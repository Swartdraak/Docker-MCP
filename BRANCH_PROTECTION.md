# Branch Protection Guide

This document provides recommendations for setting up branch protection rules to maintain code quality and enforce the branching strategy.

## Overview

Branch protection rules help prevent accidental changes to important branches and enforce code review requirements. This guide covers recommended settings for the Docker MCP Server repository.

## Table of Contents

- [Why Branch Protection](#why-branch-protection)
- [Protected Branches](#protected-branches)
- [Setting Up Protection](#setting-up-protection)
- [GitHub CLI Setup](#github-cli-setup)
- [Web UI Setup](#web-ui-setup)
- [Team Permissions](#team-permissions)

## Why Branch Protection

Branch protection rules provide:

- **Quality Control**: Require passing tests before merge
- **Code Review**: Enforce peer review process
- **History Preservation**: Prevent force pushes and deletions
- **CI/CD Integration**: Ensure automated checks pass
- **Release Safety**: Protect production code from accidental changes

## Protected Branches

### Main Branch (`main`)

**Purpose**: Production-ready code, stable releases

**Protection Level**: Maximum

**Rules:**
- ✅ Require pull request reviews (2 approvals)
- ✅ Dismiss stale reviews on new commits
- ✅ Require review from code owners (if CODEOWNERS file exists)
- ✅ Require status checks to pass:
  - `CI / Build and Test` (Node 18.x, 20.x, 22.x)
  - `CI / quality`
  - `CodeQL`
  - `dependency-review`
- ✅ Require branches to be up to date before merging
- ✅ Require signed commits
- ✅ Include administrators
- ❌ Allow force pushes: Disabled
- ❌ Allow deletions: Disabled

**Who can push:**
- Release managers only
- Via pull requests from `release/*` or `hotfix/*` branches

### Develop Branch (`develop`)

**Purpose**: Integration branch for ongoing development

**Protection Level**: Medium-High

**Rules:**
- ✅ Require pull request reviews (1 approval)
- ✅ Dismiss stale reviews on new commits
- ✅ Require status checks to pass:
  - `CI / Build and Test` (Node 18.x, 20.x, 22.x)
  - `CI / quality`
- ✅ Require branches to be up to date before merging
- ⚠️ Require signed commits (optional)
- ❌ Allow force pushes: Disabled
- ❌ Allow deletions: Disabled

**Who can push:**
- All developers via pull requests
- From `feature/*` and `bugfix/*` branches

## Setting Up Protection

### Prerequisites

- Repository admin access
- GitHub CLI installed (optional, for CLI setup)
- Understanding of branch protection needs

### GitHub CLI Setup

#### Install GitHub CLI

```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

#### Authenticate

```bash
gh auth login
```

#### Protect Main Branch

```bash
# Set repository (replace with actual repo)
REPO="Swartdraak/Docker-MCP"

# Protect main branch
gh api repos/$REPO/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / Build and Test (18.x)","CI / Build and Test (20.x)","CI / Build and Test (22.x)","CI / quality"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":2,"require_last_push_approval":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true
```

#### Protect Develop Branch

```bash
# Protect develop branch
gh api repos/$REPO/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["build (18.x)","build (20.x)","build (22.x)","lint","test"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1,"require_last_push_approval":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

### Web UI Setup

#### Main Branch Protection

1. Go to repository Settings
2. Click "Branches" in left sidebar
3. Click "Add branch protection rule"
4. Branch name pattern: `main`

**Configure:**

**Protect matching branches:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 2
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (if applicable)

**Require status checks to pass before merging:**
- ✅ Require branches to be up to date before merging
- Add required status checks:
  - `CI / Build and Test (18.x)`
  - `CI / Build and Test (20.x)`
  - `CI / Build and Test (22.x)`
  - `CI / quality`
  - `CodeQL / Analyze`
  - `dependency-review`

**Additional settings:**
- ✅ Require conversation resolution before merging
- ✅ Require signed commits
- ✅ Include administrators
- ❌ Allow force pushes: Disabled
- ❌ Allow deletions: Disabled

5. Click "Create" or "Save changes"

#### Develop Branch Protection

1. Go to repository Settings
2. Click "Branches" in left sidebar
3. Click "Add branch protection rule"
4. Branch name pattern: `develop`

**Configure:**

**Protect matching branches:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed

**Require status checks to pass before merging:**
- ✅ Require branches to be up to date before merging
- Add required status checks:
  - `CI / Build and Test (18.x)`
  - `CI / Build and Test (20.x)`
  - `CI / Build and Test (22.x)`
  - `CI / quality`

**Additional settings:**
- ✅ Require conversation resolution before merging
- ❌ Allow force pushes: Disabled
- ❌ Allow deletions: Disabled

5. Click "Create" or "Save changes"

## Team Permissions

### Recommended Team Structure

**Admin Team:**
- Full repository access
- Can bypass branch protection (if needed)
- Manages releases

**Maintainers Team:**
- Write access to repository
- Can review and merge PRs to develop
- Can create release branches

**Contributors Team:**
- Read access
- Can create PRs
- Cannot push directly to protected branches

### Setting Team Permissions

#### Via Web UI

1. Go to repository Settings
2. Click "Collaborators and teams"
3. Add teams with appropriate roles:
   - Admins: Admin role
   - Maintainers: Write role
   - Contributors: Read role

#### Via GitHub CLI

```bash
# Add team with write permission
gh api repos/$REPO/teams/maintainers/permissions \
  --method PUT \
  --field permission=push

# Add team with read permission
gh api repos/$REPO/teams/contributors/permissions \
  --method PUT \
  --field permission=pull
```

## Status Checks

### Required Checks for `main`

These CI/CD checks must pass before merging to main:

1. **build (18.x, 20.x, 22.x)**
   - Compiles TypeScript
   - Tests on multiple Node.js versions
   - Ensures cross-version compatibility

2. **lint**
   - TypeScript type checking
   - Code style validation

3. **test**
   - Unit tests
   - Integration tests
   - Coverage requirements

4. **CodeQL**
   - Security vulnerability scanning
   - Code quality analysis

5. **dependency-review**
   - Checks for vulnerable dependencies
   - License compliance

### Required Checks for `develop`

Slightly relaxed from main, but still ensures quality:

1. **build (18.x, 20.x, 22.x)**
2. **lint**
3. **test**

## CODEOWNERS File

Create a `.github/CODEOWNERS` file to automatically request reviews:

```
# Default owners for everything
* @Swartdraak

# Specific file patterns
*.md @Swartdraak
*.yml @Swartdraak
package.json @Swartdraak

# Source code
src/ @Swartdraak
tests/ @Swartdraak

# CI/CD workflows
.github/workflows/ @Swartdraak
```

## Rulesets (Modern Alternative)

GitHub's newer "Rulesets" feature provides more flexibility:

### Creating a Ruleset

1. Go to Settings > Rules > Rulesets
2. Click "New ruleset"
3. Choose "Branch ruleset"
4. Name: "Main branch protection"

**Target:**
- Include: `main`

**Rules:**
- ✅ Require pull request before merging (2 approvals)
- ✅ Require status checks to pass
- ✅ Require signed commits
- ✅ Block force pushes

5. Click "Create"

**Advantages:**
- More granular control
- Can apply to multiple branches with patterns
- Better audit logging
- Bypass permissions per ruleset

## Troubleshooting

### Can't Merge Despite Passing Checks

**Issue**: All checks pass but merge button is disabled

**Solutions:**
1. Check if branch is up to date with base
2. Verify all required reviews are approved
3. Ensure all conversations are resolved
4. Check if required status checks match exactly

### Need to Override Protection

**When needed:**
- Critical hotfix
- Emergency situation
- CI/CD is down

**How to temporarily disable:**

```bash
# Via GitHub CLI (requires admin)
gh api repos/$REPO/branches/main/protection \
  --method DELETE

# Make urgent changes

# Re-enable protection
gh api repos/$REPO/branches/main/protection \
  --method PUT \
  --field ... (same as above)
```

**Better approach**: Configure bypass permissions for specific teams

### Status Check Not Found

**Issue**: Required status check doesn't appear

**Solutions:**
1. Ensure the workflow name matches exactly
2. Check if workflow has run at least once
3. Verify workflow is triggered on correct events
4. Check workflow file syntax

## Best Practices

1. **Start Simple**: Begin with basic protection, add rules as needed
2. **Test First**: Test protection rules on a test branch first
3. **Document Changes**: Keep this file updated when changing rules
4. **Review Regularly**: Periodically review and adjust rules
5. **Train Team**: Ensure team understands the rules and workflow
6. **Use Templates**: Create PR templates to guide contributors
7. **Monitor Metrics**: Track merge times and review cycles

## Verification

### Check Current Protection

```bash
# Via GitHub CLI
gh api repos/$REPO/branches/main/protection

# Via web UI
# Settings > Branches > View protection rules
```

### Test Protection

1. Try to push directly to protected branch (should fail)
2. Create PR without required checks (should not merge)
3. Create PR with failing tests (should not merge)
4. Create PR without reviews (should not merge if required)

## Migration from Old Setup

If migrating from existing protection:

1. **Document Current Rules**: Export existing protection settings
2. **Communicate Changes**: Notify team of upcoming changes
3. **Update Documentation**: Update all docs to reflect new rules
4. **Gradual Rollout**: Enable rules progressively
5. **Monitor Impact**: Watch for issues in first week
6. **Adjust as Needed**: Fine-tune based on feedback

## References

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

## Support

For questions about branch protection:
- Check [BRANCHING.md](BRANCHING.md) for branching strategy
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution workflow
- Open an issue for clarification

---

**Last Updated**: 2024-02-09  
**Version**: 1.0.0
