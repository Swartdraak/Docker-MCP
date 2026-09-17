#!/usr/bin/env node
// Validate that every workflow YAML file parses and that job/step
// expressions reference only contexts permitted at their position.
//
// Regression guard for the release.yml incident: a job-level `if:`
// expression using the `secrets` context is rejected by GitHub with
// "Unrecognized named-value: 'secrets'" and makes the ENTIRE workflow
// unparseable, so every trigger event fails before any job runs. The
// second iteration of the same incident swapped `secrets.` for
// `env.` in the same position — the `env` context is likewise NOT
// available in an `if:` expression anywhere. The guard therefore
// rejects ANY context name in an `if:` expression that is outside the
// per-position allow-list, not just the two names already shipped
// broken.
//
// Context availability (GitHub "Contexts reference"):
//   jobs.<job_id>.if   -> github, needs, vars, inputs
//                         + status functions always/cancelled/success/failure
//   steps[*].if        -> the job-level set PLUS the `steps` context
//                         (step outputs: steps.<id>.outputs.<name>)
//   secrets, env       -> NEVER available in any if: expression.
//
// Run from anywhere:
//   node scripts/validate_workflows.cjs
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

// Contexts permitted in a JOB-level if: expression.
const JOB_IF_CONTEXTS = ['github', 'needs', 'vars', 'inputs'];
// The steps context is additionally permitted in a STEP-level if:
// (step outputs: steps.<id>.outputs.<name>).
const STEP_IF_EXTRA_CONTEXTS = ['steps'];
// Status functions take the form always()/cancelled()/success()/failure()
// and are permitted in both positions.
const STATUS_FUNCTIONS = ['always', 'cancelled', 'success', 'failure'];

// Find every bare context name at the start of a member access
// (e.g. `secrets.NPM_TOKEN`, `env.NPM_TOKEN`, `inputs.x`, `needs.j.outputs.o`)
// or a status-function call (e.g. `always()`).
function findContextNames(value) {
  const names = new Set();
  // A context name is the FULL identifier immediately before a member
  // access or a call — it must NOT be preceded by another identifier
  // character OR a hyphen (job/step names are hyphenated, e.g.
  // needs.check-secrets.outputs.ok: the context is `needs`, not
  // `secrets`). Lookbehind: character class [\w.-] covers the
  // identifier characters and the hyphen.
  const memberRe = /(?<![\w.-])([A-Za-z_][A-Za-z0-9_]*)\s*\./g;
  const callRe = /(?<![\w.-])([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  let m;
  while ((m = memberRe.exec(value)) !== null) names.add(m[1]);
  while ((m = callRe.exec(value)) !== null) names.add(m[1]);
  return [...names];
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

  const hintFor = (name) =>
    name === 'secrets'
      ? 'Read the secret in a step (where the secrets context IS permitted) and republish its presence as a job output, then gate the job on needs.<job>.outputs.<name>.'
      : name === 'env'
        ? 'Map the secret to an env var on the job or step (step-level env permits the secrets context) and gate on a needs.<job>.outputs.<name> boolean produced by a check job — never on env.* in an if:.'
        : 'Replace with an allowed context for this position or a status function (always, cancelled, success, failure).';

  const checkIf = (value, where, allowedContexts) => {
    if (typeof value !== 'string') return;
    const offenders = findContextNames(value).filter(
      (name) =>
        !allowedContexts.includes(name) &&
        !STATUS_FUNCTIONS.includes(name)
    );
    if (!offenders.length) return;
    for (const name of offenders) {
      problems.push(
        `${where} uses the ${name} context, which is not permitted in this if: expression ` +
        `(GitHub rejects the workflow at parse time with "Unrecognized named-value: '${name}'" and the ENTIRE workflow fails on every trigger). ${hintFor(name)}`
      );
    }
  };

  for (const [jobName, job] of Object.entries(doc.jobs)) {
    if (!job || typeof job !== 'object') {
      problems.push(`jobs.${jobName} is not a mapping`);
      continue;
    }
    checkIf(job.if, `jobs.${jobName}.if`, JOB_IF_CONTEXTS);
    const steps = job.steps || [];
    steps.forEach((step, i) => {
      if (!step || typeof step !== 'object') {
        problems.push(`jobs.${jobName}.steps[${i}] is not a mapping`);
        return;
      }
      checkIf(
        step.if,
        `jobs.${jobName}.steps[${i}]${step.name ? ` ("${step.name}")` : ''}.if`,
        [...JOB_IF_CONTEXTS, ...STEP_IF_EXTRA_CONTEXTS]
      );
    });
  }

  // Raw-text scan for the D1/D2 patterns as a second line of defense:
  // if a future workflow writes an if: expression in a shape the YAML
  // structure scan above does not cover (unusual quoting, flow style),
  // the raw scan still catches `secrets.`/`env.` inside the if: line.
  // Comments are stripped first — they never execute, so the same
  // patterns in a comment are not a defect.
  const activeLines = text.split('\n')
    .map((l) => l.replace(/#.*$/, ''))
    .join('\n');
  const rawRe = /^\s*if:\s*(.*)$/gm;
  let rm;
  while ((rm = rawRe.exec(activeLines)) !== null) {
    const expr = rm[1].trim();
    // The context name is the full identifier before the dot — NOT
    // preceded by an identifier character or a hyphen (job/step names
    // are hyphenated: needs.check-secrets.outputs.ok is the `needs`
    // context, not `secrets`).
    const bad = expr.match(/(?<![\w.-])(secrets|env)\s*\.\s*[A-Za-z_][A-Za-z0-9_]*/g) || [];
    for (const ref of bad) {
      const ctx = ref.split(/\s*\./)[0];
      const lineNo = activeLines.slice(0, rm.index).split('\n').length;
      problems.push(
        `line ${lineNo}: if: expression references the ${ctx} context (${ref}), ` +
        `which is not permitted in if: expressions (GitHub: "Unrecognized named-value: '${ctx}'"). ` +
        'Raw-text fallback scan — verify the expression manually.'
      );
    }
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
console.log(
  `\nAll ${files.length} workflow files parse; job/step if: conditions reference only ` +
  `permitted contexts (job if: ${JOB_IF_CONTEXTS.join('/')} + status functions ` +
  `${STATUS_FUNCTIONS.join('/')} + the steps context at step level)`
);
