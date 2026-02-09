# Quick Reference Guide

This guide provides quick references for common tasks related to branching, versioning, and releasing in the Docker MCP Server project.

## Quick Links

- [BRANCHING.md](BRANCHING.md) - Complete branching strategy
- [VERSIONING.md](VERSIONING.md) - Complete versioning guide
- [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) - Branch protection setup
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

## Branching Quick Reference

### Start a New Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
# Make changes
git push origin feature/my-feature
# Create PR to develop
```

### Fix a Bug
```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/bug-description
# Fix bug
git push origin bugfix/bug-description
# Create PR to develop
```

### Create a Release
```bash
git checkout develop
git pull origin develop
git checkout -b release/2.1.0

# Update version
npm version minor --no-git-tag-version
# Edit CHANGELOG.md

git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: bump version to 2.1.0"

# Merge to main
git checkout main
git merge --no-ff release/2.1.0
git tag -a v2.1.0 -m "Version 2.1.0"
git push origin main --tags

# Merge to develop
git checkout develop
git merge --no-ff release/2.1.0
git push origin develop

# Cleanup
git branch -d release/2.1.0
```

### Emergency Hotfix
```bash
git checkout main
git pull origin main
git checkout -b hotfix/2.0.1-description

# Fix critical issue
npm version patch --no-git-tag-version
# Edit CHANGELOG.md

git add package.json package-lock.json CHANGELOG.md
git commit -m "fix: critical issue description"

# Merge to main
git checkout main
git merge --no-ff hotfix/2.0.1-description
git tag -a v2.0.1 -m "Hotfix 2.0.1"
git push origin main --tags

# Merge to develop
git checkout develop
git merge --no-ff hotfix/2.0.1-description
git push origin develop

# Cleanup
git branch -d hotfix/2.0.1-description
```

## Versioning Quick Reference

### Version Format
```
MAJOR.MINOR.PATCH
2.1.0
│ │ │
│ │ └─ PATCH: Bug fixes (2.1.0 → 2.1.1)
│ └─── MINOR: New features (2.1.0 → 2.2.0)
└───── MAJOR: Breaking changes (2.1.0 → 3.0.0)
```

### When to Bump
- **PATCH**: Bug fixes, documentation, dependencies (no API change)
- **MINOR**: New features, new tools (backward compatible)
- **MAJOR**: Breaking changes, API redesign

### Version Commands
```bash
# Patch version (2.0.0 → 2.0.1)
npm version patch

# Minor version (2.0.0 → 2.1.0)
npm version minor

# Major version (2.0.0 → 3.0.0)
npm version major

# Specific version
npm version 2.5.0

# Pre-release
npm version prerelease --preid=alpha
npm version prerelease --preid=beta
npm version prerelease --preid=rc
```

## Commit Message Convention

### Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### Examples
```bash
git commit -m "feat(container): add health check support"
git commit -m "fix(network): resolve connection timeout"
git commit -m "docs(readme): update installation steps"
git commit -m "chore: bump version to 2.1.0"
```

## Release Checklist

### Before Release
- [ ] All features merged to develop
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md prepared

### Create Release
- [ ] Create release branch
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md with date
- [ ] Commit version changes
- [ ] Merge to main
- [ ] Create and push tag
- [ ] Merge back to develop

### After Release
- [ ] Verify GitHub release created
- [ ] Verify npm package published (if configured)
- [ ] Announce release
- [ ] Close related issues

## npm Publishing

### Manual Publish
```bash
# Login to npm
npm login

# Verify package
npm pack --dry-run

# Test locally
npm pack
tar -xzf swartdraak-docker-mcp-server-*.tgz
cd package && npm install && npm test

# Publish
npm publish --access public

# Verify
npm view @swartdraak/docker-mcp-server
```

### Automated Publish
```bash
# Just push tag to main
git tag -a v2.1.0 -m "Version 2.1.0"
git push origin v2.1.0

# GitHub Actions will:
# 1. Run tests
# 2. Build package
# 3. Create release
# 4. Publish to npm (if NPM_TOKEN configured)
```

## Branch Protection Setup

### Quick Setup (GitHub CLI)
```bash
REPO="Swartdraak/Docker-MCP"

# Protect main
gh api repos/$REPO/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews='{"required_approving_review_count":2}' \
  --field required_status_checks='{"strict":true,"contexts":["CI / Build and Test (18.x)","CI / Build and Test (20.x)","CI / Build and Test (22.x)","CI / quality"]}'

# Protect develop
gh api repos/$REPO/branches/develop/protection \
  --method PUT \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field required_status_checks='{"strict":true,"contexts":["CI / Build and Test (18.x)","CI / Build and Test (20.x)","CI / Build and Test (22.x)","CI / quality"]}'
```

## Common Tasks

### Update Dependencies
```bash
# Check outdated
npm outdated

# Update all
npm update

# Update specific package
npm update <package-name>

# Commit
git commit -am "chore(deps): update dependencies"
```

### Fix Merge Conflicts
```bash
# During rebase
git rebase origin/develop
# Fix conflicts in files
git add .
git rebase --continue

# During merge
git merge origin/develop
# Fix conflicts in files
git add .
git commit
```

### Sync Fork
```bash
# Add upstream
git remote add upstream https://github.com/Swartdraak/Docker-MCP.git

# Fetch and merge
git fetch upstream
git checkout develop
git merge upstream/develop
git push origin develop
```

### Clean Up Branches
```bash
# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Prune deleted remote branches
git fetch --prune
```

## Troubleshooting

### CI Failing
1. Check workflow logs in GitHub Actions
2. Run tests locally: `npm test`
3. Check linting: `npm run lint`
4. Rebuild: `npm run build`

### Version Conflict
1. Ensure version is updated in package.json
2. Run `npm install` to update package-lock.json
3. Commit both files together

### Merge Conflicts
1. Always pull latest before starting work
2. Rebase regularly during feature development
3. Communicate with team about overlapping changes

### Tag Already Exists
```bash
# Delete local tag
git tag -d v2.1.0

# Delete remote tag
git push origin --delete v2.1.0

# Create new tag
git tag -a v2.1.0 -m "Version 2.1.0"
git push origin v2.1.0
```

## Getting Help

- 📖 Read [BRANCHING.md](BRANCHING.md) for branching strategy
- 📖 Read [VERSIONING.md](VERSIONING.md) for versioning details
- 📖 Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- 🔧 Check [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) for protection setup
- 💬 Open a discussion on GitHub
- 🐛 Report issues via GitHub Issues

## Useful Commands

```bash
# View commit history
git log --oneline --graph -20

# View tags
git tag -l

# View tag details
git show v2.1.0

# Check status
git status

# View diff
git diff

# View remote branches
git branch -r

# View all branches
git branch -a

# Check package version
node -p "require('./package.json').version"

# Check npm package info
npm view @swartdraak/docker-mcp-server

# Run full CI locally
npm ci && npm run lint && npm test && npm run build
```

---

**Last Updated**: 2024-02-09  
**Version**: 1.0.0
