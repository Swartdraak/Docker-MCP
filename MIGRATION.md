# Docker MCP Server v2.0 - Migration Guide

## Overview

This document provides a comprehensive guide for migrating from v1.0 to v2.0 and understanding the new features.

## What's New in v2.0

### New Tools (25 additions)

#### Container Operations (8 new)
- `exec_container` - Execute commands in running containers
- `container_stats` - Real-time resource monitoring
- `restart_container` - Restart containers
- `pause_container` / `unpause_container` - Pause/resume containers
- `rename_container` - Rename existing containers
- `prune_containers` - Clean up stopped containers

#### Image Operations (5 new)
- `build_image` - Build from Dockerfile
- `tag_image` - Tag images
- `push_image` - Push to registries
- `remove_image` - Remove images
- `prune_images` - Clean up unused images

#### Network Operations (6 new)
- `create_network` - Create networks
- `inspect_network` - Network details
- `connect_network` - Connect containers
- `disconnect_network` - Disconnect containers
- `remove_network` - Remove networks
- `prune_networks` - Clean up unused networks

#### Volume Operations (4 new)
- `create_volume` - Create volumes
- `inspect_volume` - Volume details
- `remove_volume` - Remove volumes
- `prune_volumes` - Clean up unused volumes

#### System Operations (2 new)
- `system_info` - Docker system information
- `system_version` - Docker version details

### Infrastructure Improvements

#### CI/CD
- Multi-version Node.js testing (18, 20, 22)
- CodeQL security scanning
- Dependency review
- Automated releases

#### Testing
- Jest test framework
- Smoke tests
- Integration tests
- CI integration

#### Documentation
- SECURITY.md
- CONTRIBUTING.md
- CHANGELOG.md
- Enhanced README

## Breaking Changes

### None!

v2.0 is fully backward compatible with v1.0. All existing tools work exactly as before.

## Migration Steps

### For Users

No migration needed! Update to the latest version:

```bash
cd Docker-MCP
git pull
npm install
npm run build
```

### For Contributors

New development setup includes testing:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Build
npm run build

# Lint
npm run lint
```

## New Capabilities

### 1. Command Execution

Execute commands in running containers:

```typescript
// Execute a command
{
  "tool": "exec_container",
  "arguments": {
    "containerId": "my-container",
    "command": ["ls", "-la", "/app"],
    "workingDir": "/app",
    "env": ["DEBUG=true"]
  }
}
```

### 2. Resource Monitoring

Get real-time container statistics:

```typescript
{
  "tool": "container_stats",
  "arguments": {
    "containerId": "my-container"
  }
}
```

### 3. Image Building

Build images from Dockerfile:

```typescript
{
  "tool": "build_image",
  "arguments": {
    "context": "/path/to/context",
    "tag": "myapp:latest",
    "buildArgs": {
      "NODE_VERSION": "18"
    }
  }
}
```

### 4. Network Management

Create and manage networks:

```typescript
// Create network
{
  "tool": "create_network",
  "arguments": {
    "name": "my-network",
    "driver": "bridge"
  }
}

// Connect container
{
  "tool": "connect_network",
  "arguments": {
    "networkId": "my-network",
    "containerId": "my-container"
  }
}
```

### 5. Volume Management

Create and manage volumes:

```typescript
{
  "tool": "create_volume",
  "arguments": {
    "name": "my-data",
    "driver": "local",
    "labels": {
      "environment": "production"
    }
  }
}
```

### 6. Resource Cleanup

Prune unused resources:

```typescript
// Prune images
{
  "tool": "prune_images",
  "arguments": {
    "all": false  // Only remove dangling images
  }
}

// Prune containers
{ "tool": "prune_containers", "arguments": {} }

// Prune volumes
{ "tool": "prune_volumes", "arguments": {} }

// Prune networks
{ "tool": "prune_networks", "arguments": {} }
```

## Best Practices

### Security

1. **Use Docker socket permissions wisely**
   ```bash
   # Linux
   sudo usermod -aG docker $USER
   ```

2. **Monitor container logs for sensitive data**
   - Container logs may contain secrets
   - Use Docker secrets for sensitive data
   - Rotate credentials regularly

3. **Validate Dockerfiles before building**
   - Use trusted base images
   - Scan built images for vulnerabilities
   - Limit build context

### Performance

1. **Use container stats for monitoring**
   ```typescript
   { "tool": "container_stats", "arguments": { "containerId": "app" } }
   ```

2. **Prune regularly to free space**
   ```typescript
   { "tool": "prune_containers" }
   { "tool": "prune_images", "arguments": { "all": false } }
   { "tool": "prune_volumes" }
   ```

3. **Use networks for container communication**
   - Better than port mapping
   - Isolates container traffic
   - Easier service discovery

### Development

1. **Use exec for debugging**
   ```typescript
   {
     "tool": "exec_container",
     "arguments": {
       "containerId": "debug-me",
       "command": ["sh"]
     }
   }
   ```

2. **Build images locally**
   ```typescript
   {
     "tool": "build_image",
     "arguments": {
       "context": ".",
       "tag": "myapp:dev"
     }
   }
   ```

3. **Tag and push for sharing**
   ```typescript
   {
     "tool": "tag_image",
     "arguments": {
       "image": "myapp:dev",
       "repo": "myrepo/myapp",
       "tag": "latest"
     }
   }
   {
     "tool": "push_image",
     "arguments": {
       "image": "myrepo/myapp:latest"
     }
   }
   ```

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Tests Fail

```bash
# Check Docker is running
docker ps

# Run tests with verbose output
npm test -- --verbose
```

### Import Errors

Ensure you're using ES modules:
- package.json has `"type": "module"`
- TypeScript uses ES2022 target
- All imports use .js extensions

## Support

- **Issues**: https://github.com/Swartdraak/Docker-MCP/issues
- **Documentation**: See README.md, SECURITY.md, CONTRIBUTING.md
- **Security**: eternusprocer@gmail.com

## Version History

### v2.0.0 (2024-02-08)
- Added 25 new Docker tools
- Added CI/CD infrastructure
- Added testing framework
- Added comprehensive documentation
- Zero security vulnerabilities
- Production ready

### v1.0.0 (2024-01-XX)
- Initial release
- 13 Docker tools
- Basic documentation
- VS Code/Copilot integration

## License

MIT License - See LICENSE file for details
