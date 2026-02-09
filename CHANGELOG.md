# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-02-08

### Added

#### Container Operations (8 new tools)
- `exec_container` - Execute commands in running containers with working directory and environment support
- `container_stats` - Get real-time resource usage statistics (CPU, memory, network, I/O)
- `restart_container` - Restart containers with configurable timeout
- `pause_container` - Pause all processes within a container
- `unpause_container` - Resume paused containers
- `rename_container` - Rename existing containers
- `prune_containers` - Remove all stopped containers

#### Image Operations (5 new tools)
- `build_image` - Build Docker images from Dockerfile with build args support
- `tag_image` - Tag images with new repository names and tags
- `push_image` - Push images to Docker registries
- `remove_image` - Remove images with force option
- `prune_images` - Remove unused images (dangling or all)

#### Network Operations (6 new tools)
- `create_network` - Create Docker networks with driver and internal options
- `inspect_network` - Get detailed network information
- `connect_network` - Connect containers to networks
- `disconnect_network` - Disconnect containers from networks with force option
- `remove_network` - Remove Docker networks
- `prune_networks` - Remove all unused networks

#### Volume Operations (4 new tools)
- `create_volume` - Create Docker volumes with driver and labels
- `inspect_volume` - Get detailed volume information
- `remove_volume` - Remove volumes with force option
- `prune_volumes` - Remove all unused volumes

#### System Operations (2 new tools)
- `system_info` - Get comprehensive Docker system information
- `system_version` - Get Docker version and component details

#### Infrastructure
- Comprehensive GitHub Actions CI/CD workflows
  - Multi-version Node.js testing (18, 20, 22)
  - CodeQL security scanning
  - Dependency review
  - Automated releases
- Security documentation (SECURITY.md)
- Contributing guidelines (CONTRIBUTING.md)
- Changelog documentation

#### Documentation
- Complete tool reference with 38 documented tools
- Enhanced README with all new features
- Usage examples for all new operations
- Security best practices and considerations

### Changed
- Updated package version to 2.0.0
- Enhanced package.json with comprehensive metadata
- Improved README structure and organization
- Updated tool count from 13 to 38
- Added repository, bugs, and homepage URLs to package.json

### Technical
- Added tar-fs dependency for image building support
- Maintained TypeScript strict mode compliance
- All new tools follow existing patterns and error handling
- Type-safe implementations throughout

## [1.0.0] - 2024-01-XX

### Added
- Initial release with 13 Docker tools
- Container lifecycle management (create, run, start, stop, remove)
- Container inspection and logs
- Image management (list, pull)
- Network and volume listing
- Proper array handling for Docker API
- TypeScript implementation with MCP SDK
- dockerode integration for Docker communication
- Comprehensive documentation (README, CONFIGURATION, EXAMPLES)
- MIT License

### Features
- VS Code and GitHub Copilot integration
- Claude Desktop support
- stdio transport for MCP communication
- JSON schema validation for all tools
- Error handling and reporting
- Type-safe TypeScript implementation

---

## Version Guidelines

This project follows [Semantic Versioning 2.0.0](https://semver.org/). For complete versioning details, see [VERSIONING.md](VERSIONING.md).

### Major Version (X.0.0)
- Breaking API changes
- Removal of deprecated features
- Major architectural changes
- Incompatible tool schema changes

### Minor Version (0.X.0)
- New features and tools
- Non-breaking enhancements
- New capabilities
- Backward-compatible changes

### Patch Version (0.0.X)
- Bug fixes
- Documentation updates
- Security patches
- Performance improvements
- Dependency updates (non-breaking)

### Pre-release Versions
- `X.Y.Z-alpha.N` - Alpha releases (unstable)
- `X.Y.Z-beta.N` - Beta releases (feature complete, testing)
- `X.Y.Z-rc.N` - Release candidates (final testing)

---

## Branching and Release Strategy

This project follows Git Flow branching strategy. For complete branching details, see [BRANCHING.md](BRANCHING.md).

**Key Branches:**
- `main` - Production releases (tagged)
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

**Release Process:**
1. Create release branch from `develop`
2. Update version and changelog
3. Merge to `main` and tag
4. Automated CI/CD publishes to npm
5. Merge back to `develop`

---

## Links

- [GitHub Repository](https://github.com/Swartdraak/Docker-MCP)
- [Issues](https://github.com/Swartdraak/Docker-MCP/issues)
- [Pull Requests](https://github.com/Swartdraak/Docker-MCP/pulls)
- [Releases](https://github.com/Swartdraak/Docker-MCP/releases)
- [npm Package](https://www.npmjs.com/package/@swartdraak/docker-mcp-server)
- [Branching Strategy](https://github.com/Swartdraak/Docker-MCP/blob/main/BRANCHING.md)
- [Versioning Guide](https://github.com/Swartdraak/Docker-MCP/blob/main/VERSIONING.md)
- [Contributing Guide](https://github.com/Swartdraak/Docker-MCP/blob/main/CONTRIBUTING.md)
