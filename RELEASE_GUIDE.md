# Release Guide

This guide provides step-by-step instructions for releasing the Docker MCP Server to npm.

## Pre-Release Checklist

Before creating a release, ensure all of the following are complete:

### Documentation
- [ ] README.md is up-to-date with current features and tool count
- [ ] CHANGELOG.md has an entry for the new version with all changes documented
- [ ] All documentation files are accurate (CONFIGURATION.md, EXAMPLES.md, etc.)
- [ ] Version numbers are consistent across all files

### Code Quality
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] No TypeScript errors: `tsc --noEmit`

### Package Validation
- [ ] package.json version is correct
- [ ] package.json metadata is accurate (description, keywords, etc.)
- [ ] All necessary files are listed in package.json "files" array
- [ ] .npmignore doesn't exclude required files
- [ ] Dry-run package looks correct: `npm pack --dry-run`

### Functionality
- [ ] Server starts without errors: `npm start`
- [ ] All 37 tools are functional
- [ ] Connection validation works
- [ ] Remote Docker connections work (if applicable)

## Release Process

### 1. Version Bump

Update the version in package.json according to [Semantic Versioning](https://semver.org/):

```bash
# For bug fixes and patches
npm version patch

# For new features (backward compatible)
npm version minor

# For breaking changes
npm version major
```

This will automatically:
- Update package.json version
- Create a git commit
- Create a git tag

### 2. Update CHANGELOG

Add an entry for the new version in CHANGELOG.md:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Modifications to existing features

### Fixed
- Bug fixes

### Security
- Security improvements
```

### 3. Pre-Publish Validation

Run the prepublishOnly script to ensure everything is ready:

```bash
npm run prepublishOnly
```

This will:
1. Clean the dist directory
2. Build the project
3. Run all tests

If any step fails, fix the issues before proceeding.

### 4. Test the Package

Create a test package and verify its contents:

```bash
# Create a tarball
npm pack

# Inspect the contents
tar -tzf swartdraak-docker-mcp-server-*.tgz

# Test installation locally
npm install -g ./swartdraak-docker-mcp-server-*.tgz

# Test the installed package
docker-mcp

# Cleanup
npm uninstall -g @swartdraak/docker-mcp-server
rm swartdraak-docker-mcp-server-*.tgz
```

### 5. Publish to npm

When ready to publish:

```bash
# Login to npm (if not already logged in)
npm login

# Dry run to verify what will be published
npm publish --dry-run

# Publish to npm
npm publish
```

### 6. Post-Release

After successful publication:

1. **Push changes to GitHub**:
   ```bash
   git push origin main
   git push origin --tags
   ```

2. **Create GitHub Release**:
   - Go to https://github.com/Swartdraak/Docker-MCP/releases
   - Click "Draft a new release"
   - Select the version tag
   - Add release notes from CHANGELOG
   - Publish the release

3. **Verify npm Package**:
   - Check https://www.npmjs.com/package/@swartdraak/docker-mcp-server
   - Verify version, documentation, and download stats

4. **Test Installation**:
   ```bash
   npm install -g @swartdraak/docker-mcp-server
   docker-mcp
   ```

5. **Update Development Branch**:
   ```bash
   git checkout develop
   git merge main
   git push origin develop
   ```

## Troubleshooting

### Publishing Fails

If publishing fails:

1. **Check npm authentication**:
   ```bash
   npm whoami
   ```

2. **Verify package name is available**:
   ```bash
   npm view @swartdraak/docker-mcp-server
   ```

3. **Check for common issues**:
   - Version already published
   - Package name conflicts
   - npm registry connection issues
   - Authentication problems

### Build Failures

If the build fails:

1. **Clean and rebuild**:
   ```bash
   npm run clean
   npm install
   npm run build
   ```

2. **Check TypeScript version**:
   ```bash
   npm list typescript
   ```

3. **Verify all dependencies are installed**:
   ```bash
   npm install
   ```

### Test Failures

If tests fail:

1. **Run tests with verbose output**:
   ```bash
   npm test -- --verbose
   ```

2. **Check Docker is running**:
   ```bash
   docker ps
   ```

3. **Review test logs for specific errors**

## Release Checklist Template

Use this checklist for each release:

```markdown
## Release X.Y.Z Checklist

### Pre-Release
- [ ] Code complete and merged to main
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] package.json metadata verified
- [ ] Dry-run package verified

### Release
- [ ] npm publish successful
- [ ] Package visible on npm
- [ ] Installation from npm works
- [ ] Server starts correctly
- [ ] All tools functional

### Post-Release
- [ ] Changes pushed to GitHub
- [ ] Git tag pushed
- [ ] GitHub Release created
- [ ] Release notes published
- [ ] Development branch updated
- [ ] Team notified

### Verification
- [ ] npm package page updated
- [ ] README renders correctly on npm
- [ ] Installation instructions work
- [ ] Example code works
- [ ] Badges show correct version
```

## Version History

- **2.0.0** - Major production-ready release with 37 tools
  - Major rewrite with comprehensive Docker support
  - Remote Docker host support
  - TLS/HTTPS connections
  - 25 new tools added

- **1.0.0** - Initial release with 13 basic tools
  - Core container operations
  - Basic image and network management

## Resources

- [Semantic Versioning](https://semver.org/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [VERSIONING.md](VERSIONING.md) - Project versioning strategy
- [BRANCHING.md](BRANCHING.md) - Git Flow branching strategy
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

## Contact

For questions about the release process:
- GitHub Issues: https://github.com/Swartdraak/Docker-MCP/issues
- Email: eternusprocer@gmail.com
