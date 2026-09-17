#!/usr/bin/env node
// Validate that every workflow YAML file parses and that job/step
// expressions reference only contexts permitted at their position.
//
// Regression guard for the release.yml incident: a job-level `if:`
// expression using the `secrets` context is rejected by GitHub with
// "Unrecognized named-value: 'secrets'" and makes the ENTIRE workflow
// unparseable, so every trigger event fails before any job runs.
//
// Run from anywhere:
//   node scripts/validate_workflows.js
// Exit code 0 = all workflow files valid; 1 = problems found.
const fs = require('fs');
const path = require('path');

// The repo root is the parent of this script's directory. js-yaml is a
// transitive dependency (via jest's dependency tree); resolve it from
// the repo's node_modules rather than adding a new direct devDependency.
const REPO = path.join(__dirname, '..');
const yaml = require(path.join(REPO, 'node_modules', 'js-yaml'));

const dir = path.join(REPO, '.github', 'workflows');
if (!fs.existsSync(dir)) {
  console.error(`FAIL: workflows directory not found at ${dir}`);
  process.exit(1);
}

let failures = 0;
const files = fs.readdirSync(dir).filter((x) => x.endsWith('.yml') || x.endsWith('.yaml'));
if (!files.length) {
  console.error('FAIL: no workflow files found');
  process.exit(1);
}

for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  let doc;
  try {
    doc = yaml.load(text);
  } catch (e) {
    console.error(`FAIL ${f}: YAML parse error: ${e.message}`);
    failures++;
    continue;
  }
  if (!doc || typeof doc !== 'object' || !doc.jobs || typeof doc.jobs !== 'object') {
    console.error(`FAIL ${f}: missing top-level 'jobs' mapping`);
    failures++;
    continue;
  }

  const problems = [];

  const checkIf = (value, where) => {
    if (typeof value !== 'string') return;
    const refs = value.match(/secrets\.[A-Za-z_][A-Za-z0-9_]*/g) || [];
    if (refs.length) {
      // The `secrets` context is not available in job-level `if:`
      // expressions; GitHub rejects the workflow at parse time. Flag
      // step-level usage too (GitHub does not support the secrets
      // context in if: expressions at all).
      problems.push(
        `${where} uses the secrets context (${refs.join(', ')}). ` +
        'The secrets context is not permitted in if: expressions ' +
        '(GitHub error: "Unrecognized named-value: secrets"); map the secret ' +
        'to a job/step env var and test the env context instead.'
      );
    }
  };

  for (const [jobName, job] of Object.entries(doc.jobs)) {
    if (!job || typeof job !== 'object') {
      problems.push(`jobs.${jobName} is not a mapping`);
      continue;
    }
    checkIf(job.if, `jobs.${jobName}.if`);
    const steps = job.steps || [];
    steps.forEach((step, i) => {
      if (!step || typeof step !== 'object') {
        problems.push(`jobs.${jobName}.steps[${i}] is not a mapping`);
        return;
      }
      checkIf(step.if, `jobs.${jobName}.steps[${i}]${step.name ? ` ("${step.name}")` : ''}.if`);
    });
  }

  if (problems.length) {
    for (const p of problems) console.error(`FAIL ${f}: ${p}`);
    failures += problems.length;
  } else {
    console.log(`PASS ${f} (jobs: ${Object.keys(doc.jobs).join(', ')})`);
  }
}

if (failures) {
  console.error(`\n${failures} problem(s) found in ${files.length} workflow file(s)`);
  process.exit(1);
}
console.log(`\nAll ${files.length} workflow files parse; no forbidden secrets-context usage in if: conditions`);
