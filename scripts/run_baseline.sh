#!/usr/bin/env bash
# Re-verify the onboarding audit baseline commands for
# Swartdraak/Docker-MCP inside the Docker workspace.
#
# Run from the repo root:
#   bash scripts/run_baseline.sh <output-dir> [base_sha]
#
# Each command's full output is appended to <output-dir>/<nn>_<name>.log
# and its exit code is recorded. The script always exits 0 so that the
# full evidence set is collected; the per-command results are read from
# the logs and from stdout.
set -u

OUT="${1:-/workspace/logs}"
BASE_SHA="${2:-$(git rev-parse HEAD)}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"
mkdir -p "$OUT"

log() {
  local n="$1" name="$2"; shift 2
  local logfile="$OUT/${n}_${name}.log"
  {
    echo "=== ${name} @ $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
    echo "command: $*"
  } >> "$logfile"
  "$@" >> "$logfile" 2>&1
  local rc=$?
  echo "exit_code: $rc" >> "$logfile"
  echo "$name: exit $rc ($logfile)"
}

echo "base_sha: $BASE_SHA" > "$OUT/manifest.txt"
node -v >> "$OUT/manifest.txt"
npm -v >> "$OUT/manifest.txt"

log 01 npm_ci npm ci
log 02 lint npm run lint
log 03 test npm test
log 04 build npm run build
log 05 runtime_smoke bash -c 'timeout 6 node dist/index.js'
log 06 workflow_validate node scripts/validate_workflows.cjs
log 07 docker_integration_skipped bash -c 'command -v docker || echo "docker CLI absent"; ls /var/run/docker.sock 2>&1 || true; echo "skipped: no Docker daemon in audit container"'

echo "done: logs in $OUT"
