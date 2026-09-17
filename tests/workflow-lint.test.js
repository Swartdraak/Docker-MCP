#!/usr/bin/env node
// Unit test for scripts/validate_workflows.cjs — the regression guard
// for the release.yml incident (secrets context in a job-level if:
// made the whole workflow unparseable).
//
// Run with: npm test
//
// Note: this file is plain CommonJS (.js in an ESM package). Jest's
// CJS transform handles it; if run directly with node, it will need
// the .cjs extension or an explicit require context.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'validate_workflows.cjs');

// The validator resolves js-yaml from <repo>/node_modules, where <repo>
// is the parent of the script's directory. Build an isolated flat repo
// layout in a temp dir:
//   <tmp>/scripts/validate_workflows.cjs (copy of the real script)
//   <tmp>/node_modules/js-yaml/          (copy of the real package)
//   <tmp>/.github/workflows/*.yml        (fixture files)
function makeFixture(name, workflows) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-lint-'));
  const scriptsDir = path.join(tmp, 'scripts');
  const wfDir = path.join(tmp, '.github', 'workflows');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.mkdirSync(wfDir, { recursive: true });
  const jsyamlTarget = path.join(tmp, 'node_modules', 'js-yaml');
  fs.mkdirSync(path.dirname(jsyamlTarget), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(scriptsDir, 'validate_workflows.cjs'));
  // Copy (not symlink) the real js-yaml package (a transitive dep of
  // jest, present after npm ci) into the fake repo's node_modules.
  const realJsyaml = path.join(__dirname, '..', 'node_modules', 'js-yaml');
  fs.cpSync(realJsyaml, jsyamlTarget, { recursive: true });
  for (const [file, content] of Object.entries(workflows)) {
    fs.writeFileSync(path.join(wfDir, file), content);
  }
  return tmp;
}

function runValidator(tmp) {
  return spawnSync('node', [path.join(tmp, 'scripts', 'validate_workflows.cjs')], {
    encoding: 'utf8',
  });
}

let failures = 0;
function expect(name, cond, detail) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

describe('validate_workflows.js regression guard', () => {
  test('rejects secrets context in a job-level if: (the release.yml incident)', () => {
    const tmp = makeFixture('bad-job-if', {
      'release.yml': [
        'name: Release',
        'on:',
        "  push:",
        '    tags:',
        "      - 'v*'",
        'jobs:',
        '  npm-publish:',
        "    runs-on: ubuntu-latest",
        "    if: ${{ secrets.NPM_TOKEN != '' }}",
        '    steps:',
        '    - name: noop',
        '      run: echo ok',
      ].join('\n'),
    });
    const r = runValidator(tmp);
    expect('exits non-zero', r.status !== 0, `status=${r.status} stdout=${r.stdout}`);
    expect(
      'reports the offending job if:',
      /jobs\.npm-publish\.if/.test(r.stderr) || /jobs\.npm-publish\.if/.test(r.stdout),
      r.stderr
    );
    expect(
      'mentions the secrets context',
      /secrets context/.test(r.stderr) || /secrets context/.test(r.stdout),
      r.stderr
    );
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('accepts env-context if: with a job-level env mapping (the fix)', () => {
    const tmp = makeFixture('good-env-if', {
      'release.yml': [
        'name: Release',
        'on:',
        "  push:",
        '    tags:',
        "      - 'v*'",
        'jobs:',
        '  npm-publish:',
        "    runs-on: ubuntu-latest",
        "    if: env.NPM_TOKEN != ''",
        '    env:',
        '      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}',
        '    steps:',
        '    - name: noop',
        '      run: echo ok',
      ].join('\n'),
    });
    const r = runValidator(tmp);
    expect('exits 0', r.status === 0, `status=${r.status} stderr=${r.stderr}`);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('rejects malformed YAML', () => {
    const tmp = makeFixture('bad-yaml', {
      'broken.yml': ['name: Broken', 'on:', '  push:', 'jobs:', '  x: [', ''].join('\n'),
    });
    const r = runValidator(tmp);
    expect('exits non-zero', r.status !== 0, `status=${r.status}`);
    expect('mentions YAML parse error', /YAML parse error/.test(r.stderr), r.stderr);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('accepts the real repo workflows as-is', () => {
    // Run the real script against the real repo (no fixture).
    const r = spawnSync('node', [SCRIPT], { encoding: 'utf8' });
    expect('exits 0', r.status === 0, `status=${r.status} stderr=${r.stderr}`);
    expect(
      'reports all workflow files passing',
      /All \d+ workflow files parse/.test(r.stdout),
      r.stdout
    );
  });
});
