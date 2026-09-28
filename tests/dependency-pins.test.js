// Regression guard for issue #21 (develop-tree dependency defects).
//
// The develop tree carried two dependency advisories, proven at the exact
// integration head 768f08ed by fresh `npm ci` + `npm audit`:
//
//   1. minimatch 10.1.2 (HIGH) — ReDoS advisories
//      GHSA-3ppc-4f35-3m26 / GHSA-7r86-cg39-jmmj / GHSA-23c5-xmqv-rm74.
//      Reached via the `package.json` override {"glob": "^13.0.0"}, which
//      lifted glob to 13.0.1 whose dependency `minimatch ^10.1.2` resolved to
//      10.1.2 (dev-only path: glob consumed by @jest/reporters, jest-config,
//      jest-runtime, test-exclude).
//   2. uuid 10.0.0 (MODERATE) — GHSA-w5hq-g745-h8pq (missing buffer bounds
//      check in v3/v5/v6, CVSS 7.5), reached via dockerode 4.0.9 (prod) ->
//      `uuid ^10.0.0`.
//
// Fix (lockfile/override scope only — no product source edits):
//   * `overrides.glob` raised to ^13.0.6 so glob resolves to 13.0.6 whose
//     `minimatch ^10.2.2` dependency resolves to >=10.2.3 (ReDoS fixed).
//   * `dependencies.dockerode` raised to ^5.0.1. dockerode 5.x DROPPED the
//     uuid dependency entirely — its gRPC session-id (lib/session.js) now uses
//     the built-in `crypto.randomUUID()` instead of `uuid.v4()`, removing
//     uuid from the tree rather than force-overriding a major version into a
//     package that declares uuid ^10.0.0.
//
// This test pins that dependency contract against the lockfile (asserted from
// the governed HEAD via `git show`, like codeql-workflow.test.js), so a future
// relapse — a glob downgrade that re-admits minimatch <10.2.3, a re-introduced
// vulnerable uuid node, or a dockerode revert to 4.x — fails CI before the
// advisories re-appear.
const assert = require("assert");
const { execSync } = require("child_process");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const head = execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();

function fileAt(ref, relPath) {
  return execSync(`git show ${ref}:${relPath}`, {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

// Parse a dotted version string into a comparable integer array.
function verParts(v) {
  return v.split(".").map((n) => parseInt(n, 10));
}
function ge(a, b) {
  // return true if version a >= version b (numeric, dotted)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return true;
}

describe("issue #21 — develop-tree dependency pins", () => {
  let lock;
  beforeAll(() => {
    const raw = fileAt(head, "package-lock.json");
    lock = JSON.parse(raw);
  });

  it("package-lock.json parses and is npm v3 layout", () => {
    assert.ok(lock.packages && typeof lock.packages === "object", "lock.packages missing");
    assert.ok(lock.lockfileVersion === 3, `expected lockfileVersion 3, got ${lock.lockfileVersion}`);
  });

  it("resolves minimatch >=10.2.3 (clears the 10.0.0-10.2.2 ReDoS band)", () => {
    const node = lock.packages["node_modules/minimatch"];
    assert.ok(node, "node_modules/minimatch not present in lockfile (glob should pull it)");
    const v = verParts(node.version);
    assert.ok(
      ge(v, [10, 2, 3]),
      `minimatch ${node.version} < 10.2.3 — ReDoS advisories GHSA-3ppc-4f35-3m26/GHSA-7r86-cg39-jmmj/GHSA-23c5-xmqv-rm74 would resurface`
    );
  });

  it("no uuid node is present anywhere in the dependency tree", () => {
    const uuidNodes = Object.keys(lock.packages).filter(
      (p) => p === "node_modules/uuid" || /\/uuid$/.test(p)
    );
    assert.deepStrictEqual(
      uuidNodes,
      [],
      `vulnerable uuid node(s) re-appeared: ${uuidNodes.join(", ")} (GHSA-w5hq-g745-h8pq)`
    );
  });

  it("no package declares uuid as a dependency", () => {
    const decl = Object.keys(lock.packages).filter(
      (p) => lock.packages[p].dependencies && "uuid" in lock.packages[p].dependencies
    );
    assert.deepStrictEqual(
      decl,
      [],
      `package(s) re-declare uuid: ${decl.join(", ")}`
    );
  });

  it("dockerode resolves to a 5.x release (uuid-free) that still declares no uuid", () => {
    const node = lock.packages["node_modules/dockerode"];
    assert.ok(node, "node_modules/dockerode missing from lockfile");
    const major = parseInt(node.version.split(".")[0], 10);
    assert.ok(
      major >= 5,
      `dockerode ${node.version} is 4.x — it declares uuid ^10.0.0 (GHSA-w5hq-g745-h8pq); expected 5.x which drops uuid`
    );
    assert.ok(
      !node.dependencies || !("uuid" in node.dependencies),
      `dockerode ${node.version} still depends on uuid`
    );
  });

  it("package.json keeps the glob override at a minimatch-safe level and dockerode at 5.x", () => {
    const pkg = JSON.parse(fileAt(head, "package.json"));
    const globOverride = pkg.overrides && pkg.overrides.glob;
    assert.ok(globOverride, "package.json overrides.glob missing");
    // The override floor must resolve a glob whose minimatch dep is >=10.2.2.
    // ^13.0.6 is the recorded floor; anything lower than 13.0.6 that could pull
    // glob 13.0.1 (minimatch ^10.1.2) would re-admit the vulnerable band.
    assert.ok(
      globOverride === "^13.0.6" || ge(verParts(globOverride.replace(/^[\^~>=\s]+/, "")), [13, 0, 6]),
      `overrides.glob ${globOverride} no longer guarantees glob >=13.0.6 (minimatch >=10.2.3)`
    );
    const dockerodeRange = pkg.dependencies && pkg.dependencies.dockerode;
    assert.ok(
      dockerodeRange && /^\^?5\./.test(dockerodeRange),
      `package.json dependencies.dockerode ${dockerodeRange} is not a 5.x range (uuid-free)`
    );
  });
});
