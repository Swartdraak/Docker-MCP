# Branching Strategy

This document outlines the branching strategy for the Docker MCP Server project, following industry-standard Git Flow practices adapted for modern CI/CD workflows.

## Table of Contents

- [Overview](#overview)
- [Branch Types](#branch-types)
- [Workflow](#workflow)
- [Branch Protection Rules](#branch-protection-rules)
- [Version Management](#version-management)
- [Best Practices](#best-practices)

## Overview

This project follows a modified Git Flow branching strategy optimized for continuous integration and npm package releases. This approach ensures stable releases while allowing for rapid development and hotfixes.

### Branch Structure

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/feature-name
  │     ├── feature/another-feature
  │     └── bugfix/bug-description
  │
  └── hotfix/critical-fix
```

## Branch Types

### Main Branches

#### `main`
- **Purpose**: Production-ready code
- **Protection**: Highest level of protection
- **Merges From**: `develop`, `hotfix/*`
- **Triggers**: Release workflow, npm publish
- **Version Tags**: All releases are tagged here (e.g., `v2.0.0`)

**Characteristics:**
- Always stable and deployable
- Only contains tested, reviewed code
- Every merge creates a new release
- Protected from direct commits

#### `develop`
- **Purpose**: Integration branch for features
- **Protection**: Required reviews, CI must pass
- **Merges From**: `feature/*`, `bugfix/*`, `hotfix/*`
- **Merges To**: `main` (for releases)
- **Triggers**: CI workflow, integration tests

**Characteristics:**
- Contains latest development changes
- Must always build successfully
- Integration point for all features
- Regular sync point for developers

### Supporting Branches

#### Feature Branches (`feature/*`)
- **Naming**: `feature/short-description` or `feature/issue-123-description`
- **Created From**: `develop`
- **Merged To**: `develop`
- **Lifetime**: Temporary (deleted after merge)

**Purpose:**
- Develop new features
- Add new tools or capabilities
- Implement enhancements

**Examples:**
```bash
feature/container-health-check
feature/docker-compose-support
feature/advanced-logging
```

**Workflow:**
```bash
# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# Work on feature
git add .
git commit -m "feat: add new feature"

# Keep up-to-date with develop
git fetch origin
git rebase origin/develop

# Push and create PR
git push origin feature/my-new-feature
```

#### Bugfix Branches (`bugfix/*`)
- **Naming**: `bugfix/short-description` or `bugfix/issue-123-description`
- **Created From**: `develop`
- **Merged To**: `develop`
- **Lifetime**: Temporary (deleted after merge)

**Purpose:**
- Fix bugs in development
- Address issues found in testing
- Non-critical production bugs

**Examples:**
```bash
bugfix/container-name-validation
bugfix/memory-leak-in-stats
bugfix/incorrect-volume-parsing
```

#### Hotfix Branches (`hotfix/*`)
- **Naming**: `hotfix/version-description` (e.g., `hotfix/2.0.1-security-patch`)
- **Created From**: `main`
- **Merged To**: `main` AND `develop`
- **Lifetime**: Temporary (deleted after merge)

**Purpose:**
- Critical production bug fixes
- Security vulnerabilities
- Data loss prevention
- Service-breaking issues

**Examples:**
```bash
hotfix/2.0.1-container-crash
hotfix/2.1.1-security-cve
hotfix/3.0.1-data-corruption
```

**Workflow:**
```bash
# Create hotfix branch
git checkout main
git pull origin main
git checkout -b hotfix/2.0.1-critical-fix

# Fix the issue and update version
# Edit package.json: version from 2.0.0 to 2.0.1
git add .
git commit -m "fix: critical issue causing container crashes"

# Merge to main
git checkout main
git merge --no-ff hotfix/2.0.1-critical-fix
git tag -a v2.0.1 -m "Version 2.0.1 - Critical hotfix"
git push origin main --tags

# Merge to develop
git checkout develop
git merge --no-ff hotfix/2.0.1-critical-fix
git push origin develop

# Delete hotfix branch
git branch -d hotfix/2.0.1-critical-fix
git push origin --delete hotfix/2.0.1-critical-fix
```

#### Release Branches (`release/*`)
- **Naming**: `release/version` (e.g., `release/2.1.0`)
- **Created From**: `develop`
- **Merged To**: `main` AND `develop`
- **Lifetime**: Temporary (deleted after merge)

**Purpose:**
- Prepare for production release
- Final testing and bug fixes
- Version number updates
- Documentation updates
- CHANGELOG preparation

**Examples:**
```bash
release/2.1.0
release/3.0.0
```

**Workflow:**
```bash
# Create release branch
git checkout develop
git pull origin develop
git checkout -b release/2.1.0

# Update version in package.json to 2.1.0
# Update CHANGELOG.md
# Run final tests
npm run build
npm test

# Commit version changes
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 2.1.0"

# Merge to main
git checkout main
git merge --no-ff release/2.1.0
git tag -a v2.1.0 -m "Version 2.1.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge --no-ff release/2.1.0
git push origin develop

# Delete release branch
git branch -d release/2.1.0
git push origin --delete release/2.1.0
```

## Workflow

### Feature Development

1. **Start Feature**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Develop**
   - Make changes
   - Write tests
   - Update documentation
   - Commit regularly with conventional commits

3. **Stay Updated**
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

4. **Complete Feature**
   ```bash
   git push origin feature/my-feature
   # Create Pull Request to develop
   # Get code review
   # Merge after CI passes
   ```

### Release Process

1. **Prepare Release**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/X.Y.Z
   ```

2. **Update Version**
   - Update `package.json` version
   - Update `CHANGELOG.md`
   - Run full test suite
   - Build and verify

3. **Merge to Main**
   ```bash
   git checkout main
   git merge --no-ff release/X.Y.Z
   git tag -a vX.Y.Z -m "Version X.Y.Z"
   git push origin main --tags
   ```

4. **Merge to Develop**
   ```bash
   git checkout develop
   git merge --no-ff release/X.Y.Z
   git push origin develop
   ```

5. **Cleanup**
   ```bash
   git branch -d release/X.Y.Z
   ```

### Hotfix Process

1. **Create Hotfix**
   ```bash
   git checkout main
   git checkout -b hotfix/X.Y.Z-description
   ```

2. **Fix Issue**
   - Make minimal changes
   - Update version (patch bump)
   - Update CHANGELOG

3. **Merge to Main**
   ```bash
   git checkout main
   git merge --no-ff hotfix/X.Y.Z-description
   git tag -a vX.Y.Z -m "Hotfix X.Y.Z"
   git push origin main --tags
   ```

4. **Merge to Develop**
   ```bash
   git checkout develop
   git merge --no-ff hotfix/X.Y.Z-description
   git push origin develop
   ```

## Branch Protection Rules

### Recommended Settings

#### `main` Branch
- ✅ Require pull request reviews before merging (2 approvals)
- ✅ Require status checks to pass before merging
  - CI build (all Node versions)
  - Tests pass
  - Linting passes
  - CodeQL analysis
- ✅ Require branches to be up to date before merging
- ✅ Require signed commits
- ✅ Include administrators in restrictions
- ✅ Restrict who can push to matching branches
- ✅ Allow force pushes: **Disabled**
- ✅ Allow deletions: **Disabled**

#### `develop` Branch
- ✅ Require pull request reviews before merging (1 approval)
- ✅ Require status checks to pass before merging
  - CI build passes
  - Tests pass
  - Linting passes
- ✅ Require branches to be up to date before merging
- ✅ Allow force pushes: **Disabled**
- ✅ Allow deletions: **Disabled**

### Setting Up Protection

**Via GitHub UI:**
1. Go to Repository Settings
2. Select "Branches" from sidebar
3. Click "Add branch protection rule"
4. Configure rules as above

**Via GitHub CLI:**
```bash
# Protect main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews='{"required_approving_review_count":2}' \
  --field required_status_checks='{"strict":true,"contexts":["build","test","lint"]}'

# Protect develop branch
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field required_status_checks='{"strict":true,"contexts":["build","test"]}'
```

## Version Management

This project follows [Semantic Versioning 2.0.0](https://semver.org/). For detailed information about versioning, see [VERSIONING.md](VERSIONING.md).

### Version Format
```
MAJOR.MINOR.PATCH

Examples:
- 2.0.0 - Major release
- 2.1.0 - Minor release (new features)
- 2.1.1 - Patch release (bug fixes)
```

### When to Bump Versions

- **MAJOR**: Breaking changes, API redesign
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Version Tagging

All releases on `main` must be tagged:

```bash
# Create annotated tag
git tag -a v2.1.0 -m "Version 2.1.0: Added advanced networking features"

# Push tags
git push origin --tags

# List tags
git tag -l

# View tag details
git show v2.1.0
```

## Best Practices

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```bash
feat(container): add health check support
fix(network): resolve connection timeout issue
docs(readme): update installation instructions
chore(deps): update dependencies to latest versions
```

### Pull Requests

1. **Title**: Clear and descriptive
   - Good: `feat: Add container health monitoring`
   - Bad: `Update index.ts`

2. **Description**: Include:
   - What changed and why
   - Related issue numbers
   - Testing performed
   - Breaking changes (if any)

3. **Size**: Keep PRs focused
   - One feature or fix per PR
   - Aim for < 400 lines changed

4. **Reviews**: 
   - Respond to feedback promptly
   - Be open to suggestions
   - Don't merge your own PRs

### Keeping Branches Updated

```bash
# Update develop regularly
git checkout develop
git pull origin develop

# Update feature branch from develop
git checkout feature/my-feature
git rebase origin/develop

# Resolve conflicts if any
git add .
git rebase --continue

# Force push (only to feature branches!)
git push origin feature/my-feature --force-with-lease
```

### Cleaning Up

```bash
# Delete local feature branch
git branch -d feature/old-feature

# Delete remote feature branch
git push origin --delete feature/old-feature

# Prune deleted remote branches
git fetch --prune

# List merged branches
git branch --merged develop
```

### Common Scenarios

#### Starting Work on a New Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: add feature"
git push origin feature/my-feature
# Create PR to develop
```

#### Fixing a Bug in Development
```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/fix-issue
# Fix bug
git add .
git commit -m "fix: resolve issue"
git push origin bugfix/fix-issue
# Create PR to develop
```

#### Critical Production Hotfix
```bash
git checkout main
git pull origin main
git checkout -b hotfix/2.0.1-critical
# Fix issue, update version
git commit -m "fix: critical security issue"
git checkout main
git merge --no-ff hotfix/2.0.1-critical
git tag -a v2.0.1 -m "Critical security hotfix"
git push origin main --tags
git checkout develop
git merge --no-ff hotfix/2.0.1-critical
git push origin develop
```

## Continuous Integration

### Automated Checks

All branches trigger CI workflows that perform:
- **Linting**: TypeScript type checking
- **Testing**: Unit and integration tests
- **Building**: Compilation to JavaScript
- **Security**: CodeQL analysis, dependency review

### CI Requirements

- ✅ All CI checks must pass before merge
- ✅ Tests must maintain > 80% coverage
- ✅ No linting errors or warnings
- ✅ Build must succeed on Node 18, 20, 22
- ✅ No security vulnerabilities

## Release Automation

### Automated Releases

When code is merged to `main` with a version tag:
1. GitHub Actions creates a release
2. Builds production artifacts
3. Generates release notes
4. (Optional) Publishes to npm

### Manual Release Process

If automated release fails:
```bash
# Ensure you're on main with latest
git checkout main
git pull origin main

# Build
npm ci
npm run build

# Create release archive
tar -czf docker-mcp-server-X.Y.Z.tar.gz dist/ package.json README.md LICENSE

# Create GitHub release manually via UI or gh CLI
gh release create vX.Y.Z docker-mcp-server-X.Y.Z.tar.gz --title "Version X.Y.Z" --notes "Release notes here"
```

## References

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)

## Questions?

For questions about branching or versioning:
- Check [VERSIONING.md](VERSIONING.md)
- Check [CONTRIBUTING.md](CONTRIBUTING.md)
- Open a discussion on GitHub
- Contact the maintainers

---

**Last Updated**: 2024-02-09  
**Version**: 1.0.0
