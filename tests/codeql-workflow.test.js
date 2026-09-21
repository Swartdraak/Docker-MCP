// Regression guard for issue #18 (CodeQL Security Scan coverage lapse).
//
// The CodeQL workflow (.github/workflows/codeql.yml) was auto-disabled by
// GitHub (disabled_inactivity) after ~5 months of repo inactivity, lapping
// code-scanning coverage on all triggers. This test pins the workflow file's
// contract so any future regression — a missing file, a removed schedule
// (which is exactly what allowed the inactivity disable), or a trigger/
// language drift — fails CI before coverage lapses again.
//
// The actual re-enable is a repository setting (Actions:write), outside
// code scope; this test guards the file contract.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoRoot = path.join(__dirname, "..");
const wfPath = path.join(repoRoot, ".github", "workflows", "codeql.yml");

// Resolve the integration branch head (develop) so the guard is asserted
// against the governed ref, not a dirty working tree.
const head = execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();

function wfContentAt(ref) {
  return execSync(`git show ${ref}:${path.relative(repoRoot, wfPath)}`, {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

describe("issue #18 CodeQL coverage regression guard", () => {
  it("workflow file exists in the repository", () => {
    assert.ok(
      fs.existsSync(wfPath),
      ".github/workflows/codeql.yml is missing — code-scanning coverage would be absent"
    );
  });

  const content = wfContentAt(head);

  it("runs on a weekly schedule (the trigger whose absence caused the inactivity disable)", () => {
    assert.ok(
      /schedule:\s*\n\s*-\s*cron:/.test(content),
      "codeql.yml must keep a schedule/cron trigger — its absence is what let GitHub disable the workflow"
    );
    assert.ok(
      /cron:\s*'0 0 \* \* 0'/.test(content),
      "expected weekly Sunday cron '0 0 * * 0'"
    );
  });

  it("runs on push and pull_request to main and develop (integration + release lanes)", () => {
    assert.ok(/push:/.test(content), "push trigger missing");
    assert.ok(/pull_request:/.test(content), "pull_request trigger missing");
    for (const branch of ["main", "develop"]) {
      assert.ok(
        new RegExp(`\\[\\s*main\\s*,\\s*develop\\s*\\]`).test(content) ||
          new RegExp(`[\\s'"]${branch}[\\s'"],`).test(content),
        `branch ${branch} missing from codeql.yml triggers`
      );
    }
  });

  it("analyzes the javascript language with security queries and security-events write permission", () => {
    assert.ok(
      /language: \[ 'javascript' \]|language: \['javascript'\]/.test(content),
      "javascript matrix entry missing"
    );
    assert.ok(
      /queries:\s*security-and-quality/.test(content),
      "security-and-quality query pack missing"
    );
    assert.ok(
      /security-events:\s*write/.test(content),
      "security-events: write permission missing — analysis results could not be uploaded"
    );
  });
});
