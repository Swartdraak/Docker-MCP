# Versioning Strategy

This document outlines the versioning strategy for the Docker MCP Server project, following [Semantic Versioning 2.0.0](https://semver.org/) principles adapted for npm package releases and CI/CD automation.

## Table of Contents

- [Overview](#overview)
- [Semantic Versioning](#semantic-versioning)
- [Version Format](#version-format)
- [Version Lifecycle](#version-lifecycle)
- [Automated Versioning](#automated-versioning)
- [Manual Versioning](#manual-versioning)
- [Pre-release Versions](#pre-release-versions)
- [Version Tags](#version-tags)
- [Changelog Management](#changelog-management)
- [npm Publishing](#npm-publishing)
- [Best Practices](#best-practices)

## Overview

Docker MCP Server uses Semantic Versioning (SemVer) to communicate the impact of changes in each release. This ensures users understand whether an update is safe to install or requires attention.

### Key Principles

1. **Predictability**: Version numbers indicate the type of changes
2. **Automation**: CI/CD handles releases when tags are created
3. **Transparency**: CHANGELOG documents all changes
4. **Compatibility**: Clear communication about breaking changes

## Semantic Versioning

### Format: MAJOR.MINOR.PATCH

```
2.1.3
│ │ │
│ │ └─── PATCH: Backward-compatible bug fixes
│ └───── MINOR: New features (backward-compatible)
└─────── MAJOR: Breaking changes
```

### Version Components

#### MAJOR Version (X.0.0)

**Increment when:**
- Breaking API changes
- Incompatible tool schema changes
- Removal of existing tools or features
- Major architectural redesign
- Changes requiring user intervention

**Examples:**
```
1.0.0 → 2.0.0: Complete rewrite with new tool schemas
2.0.0 → 3.0.0: Removed deprecated tools, changed required parameters
```

**Impact:**
- ❌ May break existing integrations
- ⚠️ Requires review before upgrading
- 📖 Requires documentation review

**Changelog Section:**
```markdown
## [3.0.0] - 2024-03-01

### Breaking Changes
- Removed deprecated `old_tool` (use `new_tool` instead)
- Changed `container_create` parameter `env` from string to array
- Minimum Node.js version is now 20.0.0

### Migration Guide
See MIGRATION.md for upgrade instructions
```

#### MINOR Version (0.X.0)

**Increment when:**
- Adding new tools (backward-compatible)
- Adding new optional parameters
- Adding new features
- Deprecating features (but not removing)
- Performance improvements
- Enhanced error messages

**Examples:**
```
2.0.0 → 2.1.0: Added 5 new container management tools
2.1.0 → 2.2.0: Added health check monitoring feature
```

**Impact:**
- ✅ Fully backward-compatible
- ✅ Safe to upgrade
- 📝 Review new features

**Changelog Section:**
```markdown
## [2.1.0] - 2024-02-15

### Added
- New `container_health` tool for health monitoring
- New `container_top` tool for process listing
- Added optional `timeout` parameter to `stop_container`

### Deprecated
- `old_network_tool` (use `new_network_tool` instead)
```

#### PATCH Version (0.0.X)

**Increment when:**
- Bug fixes (no functionality change)
- Security patches
- Documentation improvements
- Dependency updates (no breaking changes)
- Performance optimizations (no API change)
- Internal refactoring

**Examples:**
```
2.1.0 → 2.1.1: Fixed memory leak in container stats
2.1.1 → 2.1.2: Updated dependencies for security patch
```

**Impact:**
- ✅ Fully backward-compatible
- ✅ Safe and recommended to upgrade
- 🛡️ May include security fixes

**Changelog Section:**
```markdown
## [2.1.1] - 2024-02-10

### Fixed
- Fixed memory leak in `container_stats` streaming
- Resolved issue with network connection timeout

### Security
- Updated `dockerode` to 4.0.2 (security patch)
```

## Version Format

### Standard Versions

```
2.0.0    - Major release
2.1.0    - Minor release (new features)
2.1.1    - Patch release (bug fixes)
```

### Pre-release Versions

```
3.0.0-alpha.1      - Alpha release (unstable)
3.0.0-alpha.2      - Alpha release 2
3.0.0-beta.1       - Beta release (feature complete)
3.0.0-beta.2       - Beta release 2
3.0.0-rc.1         - Release candidate
3.0.0-rc.2         - Release candidate 2
3.0.0              - Stable release
```

### Build Metadata

```
2.1.0+20240209     - Build date
2.1.0+build.123    - Build number
2.1.0+sha.abc123   - Git commit SHA
```

## Version Lifecycle

### 1. Development Phase

**Branch**: `develop`  
**Version**: Current stable version (no change)

```json
{
  "version": "2.0.0"
}
```

All feature development happens here without version changes.

### 2. Release Preparation

**Branch**: `release/X.Y.Z`  
**Version**: Updated to new version

```bash
# Create release branch
git checkout -b release/2.1.0

# Update version
npm version minor --no-git-tag-version
# or manually edit package.json

# Update CHANGELOG.md
# Add release date and finalize entries

git commit -am "chore: bump version to 2.1.0"
```

### 3. Release

**Branch**: `main`  
**Version**: Tagged

```bash
# Merge to main
git checkout main
git merge --no-ff release/2.1.0

# Create tag
git tag -a v2.1.0 -m "Version 2.1.0: Enhanced container management"

# Push
git push origin main --tags
```

### 4. Post-Release

**Branch**: `develop`  
**Version**: Prepare for next development

```bash
# Merge back to develop
git checkout develop
git merge --no-ff release/2.1.0

# Optional: Prepare for next minor
npm version preminor --preid=dev --no-git-tag-version
# Results in: 2.2.0-dev.0

git commit -am "chore: prepare for 2.2.0 development"
git push origin develop
```

## Automated Versioning

### Using npm version Command

```bash
# Patch version (2.1.0 → 2.1.1)
npm version patch

# Minor version (2.1.1 → 2.2.0)
npm version minor

# Major version (2.2.0 → 3.0.0)
npm version major

# Pre-release (2.2.0 → 2.2.1-0)
npm version prerelease

# Specific version
npm version 3.0.0
```

### With Git Tag

```bash
# Create version and tag in one step
npm version minor -m "chore: bump version to %s"

# Creates commit and tag automatically
# Push both
git push origin develop --follow-tags
```

### CI/CD Automation

When a tag is pushed to `main`:

```yaml
# .github/workflows/release.yml triggers
on:
  push:
    tags:
      - 'v*'
```

**Process:**
1. ✅ Extracts version from tag
2. ✅ Runs CI tests
3. ✅ Builds production artifacts
4. ✅ Creates GitHub Release
5. ✅ Publishes to npm (if configured)

## Manual Versioning

### Step-by-Step Process

#### 1. Update package.json

```json
{
  "name": "docker-mcp-server",
  "version": "2.1.0",  // ← Update this
  "description": "..."
}
```

#### 2. Update CHANGELOG.md

```markdown
## [2.1.0] - 2024-02-09

### Added
- New health check monitoring tools
- Container process management

### Fixed
- Memory leak in stats streaming

### Changed
- Improved error messages
```

#### 3. Update package-lock.json

```bash
npm install
```

#### 4. Commit Changes

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: bump version to 2.1.0"
```

#### 5. Create Tag

```bash
git tag -a v2.1.0 -m "Version 2.1.0: Container health monitoring"
```

#### 6. Push

```bash
git push origin main
git push origin v2.1.0
```

## Pre-release Versions

### Alpha Releases

**Purpose**: Early testing, unstable, frequent changes

```bash
npm version 3.0.0-alpha.1 --no-git-tag-version

# package.json
{
  "version": "3.0.0-alpha.1"
}
```

**Publishing:**
```bash
npm publish --tag alpha
```

**Installing:**
```bash
npm install @swartdraak/docker-mcp-server@alpha
```

### Beta Releases

**Purpose**: Feature complete, testing & bug fixing

```bash
npm version 3.0.0-beta.1 --no-git-tag-version

# package.json
{
  "version": "3.0.0-beta.1"
}
```

**Publishing:**
```bash
npm publish --tag beta
```

### Release Candidates

**Purpose**: Final testing before stable release

```bash
npm version 3.0.0-rc.1 --no-git-tag-version

# package.json
{
  "version": "3.0.0-rc.1"
}
```

**Publishing:**
```bash
npm publish --tag rc
```

### Stable Release

```bash
npm version 3.0.0 --no-git-tag-version

# package.json
{
  "version": "3.0.0"
}
```

**Publishing:**
```bash
npm publish --tag latest
```

## Version Tags

### Git Tag Format

```bash
v2.1.0          # Stable release
v3.0.0-alpha.1  # Pre-release
v2.1.1-hotfix   # Hotfix (not recommended, use semver)
```

### Creating Tags

```bash
# Lightweight tag (not recommended)
git tag v2.1.0

# Annotated tag (recommended)
git tag -a v2.1.0 -m "Version 2.1.0: Container health monitoring

Added:
- Health check tools
- Process management
- Enhanced monitoring

Fixed:
- Memory leaks
- Connection timeouts"

# Push tags
git push origin v2.1.0
# or push all tags
git push origin --tags
```

### Tag Management

```bash
# List tags
git tag -l
git tag -l "v2.*"

# View tag details
git show v2.1.0

# Delete local tag
git tag -d v2.1.0

# Delete remote tag
git push origin --delete v2.1.0

# Checkout tag
git checkout v2.1.0
```

## Changelog Management

### CHANGELOG.md Structure

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Work in progress features

## [2.1.0] - 2024-02-09

### Added
- New container health monitoring
- Process management tools

### Changed
- Improved error messages
- Enhanced documentation

### Fixed
- Memory leak in stats streaming
- Network connection timeout

### Deprecated
- `old_tool` in favor of `new_tool`

### Removed
- None

### Security
- Updated dependencies

## [2.0.0] - 2024-02-08

### Breaking Changes
- Changed tool schemas

### Added
- 25 new tools

[Unreleased]: https://github.com/user/repo/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/user/repo/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/user/repo/releases/tag/v2.0.0
```

### Changelog Categories

1. **Added**: New features
2. **Changed**: Changes in existing functionality
3. **Deprecated**: Soon-to-be removed features
4. **Removed**: Removed features
5. **Fixed**: Bug fixes
6. **Security**: Security fixes or updates

### Updating Changelog

```bash
# When starting work on release
git checkout release/2.1.0

# Edit CHANGELOG.md
# Move items from [Unreleased] to [2.1.0]
# Add release date
# Update comparison links

git commit -am "docs: update changelog for 2.1.0"
```

## npm Publishing

### Package Preparation

#### package.json Configuration

```json
{
  "name": "docker-mcp-server",
  "version": "2.1.0",
  "description": "MCP Server for Docker management",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "CONFIGURATION.md",
    "EXAMPLES.md"
  ],
  "scripts": {
    "prepublishOnly": "npm run build && npm test",
    "prepack": "npm run build",
    "prepare": "npm run build"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

### Publishing Process

#### Automated (via CI/CD)

```bash
# Just create and push tag
git tag -a v2.1.0 -m "Version 2.1.0"
git push origin v2.1.0

# GitHub Actions handles:
# - Build
# - Test
# - Publish to npm
```

#### Manual Publishing

```bash
# 1. Ensure you're logged in
npm login

# 2. Verify package
npm pack --dry-run

# 3. Test locally
npm pack
tar -xzf swartdraak-docker-mcp-server-2.1.0.tgz
cd package
npm install
npm test

# 4. Publish
npm publish --access public

# 5. Verify
npm view @swartdraak/docker-mcp-server
npm info @swartdraak/docker-mcp-server
```

### Publishing Checklist

- [ ] Version updated in package.json
- [ ] CHANGELOG.md updated with release date
- [ ] All tests passing
- [ ] Build successful
- [ ] Documentation up to date
- [ ] Git tag created
- [ ] Merged to main branch
- [ ] CI/CD pipeline successful

### npm Dist Tags

```bash
# Latest (default)
npm publish --tag latest

# Beta release
npm publish --tag beta

# Alpha release  
npm publish --tag alpha

# Next version
npm publish --tag next

# View tags
npm dist-tag ls docker-mcp-server

# Add/remove tags
npm dist-tag add docker-mcp-server@2.1.0 latest
npm dist-tag rm docker-mcp-server beta
```

## Best Practices

### Version Bumping Rules

1. **Start of Sprint/Iteration**
   - Version stays stable on develop
   - No version changes during development

2. **Before Release**
   - Create release branch
   - Bump version appropriately
   - Update changelog

3. **After Release**
   - Tag on main
   - Merge back to develop
   - Never increment version on feature branches

### Communication

1. **Breaking Changes**
   - Document in CHANGELOG under "Breaking Changes"
   - Update MIGRATION.md with upgrade guide
   - Announce in release notes
   - Consider deprecation period

2. **New Features**
   - Document all new tools/features
   - Add usage examples
   - Update README if significant

3. **Bug Fixes**
   - Reference issue numbers
   - Describe what was fixed
   - Include test cases

### Version Planning

#### Short-term (Patch)
- Bug fixes
- Security updates
- Documentation
- Release every 1-2 weeks

#### Medium-term (Minor)
- New features
- Enhancements
- New tools
- Release every 1-2 months

#### Long-term (Major)
- Breaking changes
- Major redesigns
- Deprecation cleanup
- Release every 6-12 months

### Deprecation Strategy

```javascript
// Version 2.5.0 - Deprecate old tool
/**
 * @deprecated Use new_tool instead. Will be removed in v3.0.0
 */
function old_tool() {
  console.warn('old_tool is deprecated, use new_tool instead');
  // ... implementation
}

// Version 3.0.0 - Remove old tool
// old_tool removed entirely
```

**Timeline:**
1. Version 2.5.0: Add deprecation warning
2. Version 2.6.0-2.9.0: Keep deprecated tool with warnings
3. Version 3.0.0: Remove deprecated tool

### Version Compatibility

#### Node.js Compatibility

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

**Update Rules:**
- PATCH: No change to minimum version
- MINOR: May increase minimum to supported Node.js LTS
- MAJOR: May drop support for EOL Node.js versions

#### Dependency Updates

- **PATCH**: Bug fixes, security patches
- **MINOR**: Minor version updates (backward-compatible)
- **MAJOR**: Major dependency updates, breaking changes

### Emergency Hotfixes

For critical production issues:

```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/2.1.1-critical-fix

# Fix issue
# Bump patch version
npm version patch -m "fix: critical security issue"

# Merge to main
git checkout main
git merge --no-ff hotfix/2.1.1-critical-fix

# Tag
git tag -a v2.1.1 -m "Hotfix 2.1.1: Critical security fix"

# Push
git push origin main --tags

# Merge to develop
git checkout develop
git merge --no-ff hotfix/2.1.1-critical-fix
git push origin develop
```

## Version History

### Current Version
- **2.0.0** - Current stable release

### Upcoming Versions
- **2.1.0** - Planned for Q1 2024 (new health monitoring tools)
- **2.2.0** - Planned for Q2 2024 (Docker Compose support)
- **3.0.0** - Planned for Q4 2024 (major API improvements)

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [npm Semantic Versioning](https://docs.npmjs.com/about-semantic-versioning)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging)

## Questions?

For questions about versioning:
- Check [BRANCHING.md](BRANCHING.md) for branching strategy
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions
- Check [CHANGELOG.md](CHANGELOG.md) for release history
- Open a discussion on GitHub

---

**Last Updated**: 2024-02-09  
**Version**: 1.0.0
