# Docker MCP Server

[![npm version](https://img.shields.io/npm/v/@swartdraak/docker-mcp-server.svg)](https://www.npmjs.com/package/@swartdraak/docker-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@swartdraak/docker-mcp-server.svg)](https://www.npmjs.com/package/@swartdraak/docker-mcp-server)
[![CI](https://github.com/Swartdraak/Docker-MCP/actions/workflows/ci.yml/badge.svg)](https://github.com/Swartdraak/Docker-MCP/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Swartdraak/Docker-MCP/actions/workflows/codeql.yml/badge.svg)](https://github.com/Swartdraak/Docker-MCP/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-API-2496ED?logo=docker)](https://www.docker.com/)
[![Semantic Versioning](https://img.shields.io/badge/semver-2.0.0-blue)](https://semver.org/)

A comprehensive, production-ready, industry-standard compliant MCP (Model Context Protocol) Server that enables full Docker management capabilities for AI assistants like GitHub Copilot and Claude. Featuring 37 powerful tools covering containers, images, networks, volumes, and system operations.

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Test the server
npm start
```

## ✨ Features

### Core Capabilities
- ✅ **37 Docker Tools**: Complete coverage of Docker operations including connection validation
- ✅ **Remote Docker Support**: Connect to Docker on remote hosts via TCP, HTTP, HTTPS, or SSH tunnel
- ✅ **Secure Connections**: Full TLS/SSL support for secure remote Docker management
- ✅ **Container Management**: Create, run, start, stop, restart, pause, unpause, rename, remove, exec, stats, logs
- ✅ **Image Operations**: List, pull, build, push, tag, remove, prune
- ✅ **Network Management**: List, create, remove, inspect, connect, disconnect
- ✅ **Volume Management**: List, create, remove, inspect, prune
- ✅ **System Operations**: Info, version, connection validation, prune (containers, images, volumes, networks)
- ✅ **Proper Array Handling**: Correctly handles command, entrypoint, and environment variables
- ✅ **VS Code Integration**: Works seamlessly with GitHub Copilot
- ✅ **Industry Standard**: Uses MCP SDK and Docker best practices
- ✅ **TypeScript**: Full type safety and modern JavaScript features

### Recent Enhancements
- 🌐 **Remote Docker Host Support**: Connect to Docker on any remote host
- 🔒 **TLS/HTTPS Support**: Secure connections with certificate authentication
- 🔑 **Environment-based Configuration**: Easy setup via DOCKER_HOST, DOCKER_TLS_VERIFY, DOCKER_CERT_PATH
- 🚇 **SSH Tunnel Support**: Secure remote access without exposing Docker API

### What's New in v2.0
- 🚀 **25 New Tools**: Added extensive container, image, network, and volume management
- 🔧 **Container Exec**: Execute commands in running containers
- 📊 **Container Stats**: Real-time CPU, memory, network, and I/O metrics
- 🏗️ **Image Building**: Build images from Dockerfile with build args
- 🔄 **Advanced Lifecycle**: Restart, pause, unpause, rename containers
- 🌐 **Full Network CRUD**: Create, inspect, connect, disconnect, remove networks
- 💾 **Full Volume CRUD**: Create, inspect, remove volumes
- 🧹 **Resource Cleanup**: Prune unused containers, images, volumes, networks
- ⚙️ **System Info**: Get Docker daemon information and version

## Installation

### Via npm (Recommended)

```bash
npm install -g @swartdraak/docker-mcp-server
```

### From Source

#### Prerequisites

- Node.js 18 or higher
- Docker installed and running
- npm or yarn package manager

#### Setup

1. Clone the repository:
```bash
git clone https://github.com/Swartdraak/Docker-MCP.git
cd Docker-MCP
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Standalone Mode

Run the server directly:
```bash
npm start
```

### Remote Docker Configuration

The MCP server supports connecting to remote Docker hosts using environment variables:

#### Connect to Remote Docker via TCP
```bash
DOCKER_HOST=tcp://192.168.1.100:2375 npm start
```

#### Connect to Remote Docker via HTTPS with TLS
```bash
DOCKER_HOST=https://192.168.1.100:2376 \
DOCKER_TLS_VERIFY=1 \
DOCKER_CERT_PATH=~/.docker/certs \
npm start
```

#### Connect via SSH Tunnel
First, set up an SSH tunnel:
```bash
ssh -NL localhost:2375:/var/run/docker.sock user@remote-host
```

Then connect to the tunneled Docker:
```bash
DOCKER_HOST=tcp://localhost:2375 npm start
```

### VS Code Integration

To integrate with VS Code and GitHub Copilot, add the following to your MCP settings file:

**For Local Docker** (`~/.vscode/mcp-settings.json` or in your workspace settings):
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/path/to/Docker-MCP/dist/index.js"]
    }
  }
}
```

**For Remote Docker over TCP**:
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "tcp://192.168.1.100:2375"
      }
    }
  }
}
```

**For Remote Docker with TLS**:
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "https://192.168.1.100:2376",
        "DOCKER_TLS_VERIFY": "1",
        "DOCKER_CERT_PATH": "/home/user/.docker/certs"
      }
    }
  }
}
```

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/path/to/Docker-MCP/dist/index.js"]
    }
  }
}
```

**Alternative using npx** (after publishing to npm):
```json
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["docker-mcp-server"]
    }
  }
}
```

## Testing Your Connection

### Connection Test Utility

Before using the MCP server, you can test your Docker connection with the included test utility:

```bash
# Test local Docker connection
node test-connection.js

# Test remote Docker via TCP
DOCKER_HOST=tcp://192.168.1.100:2375 node test-connection.js

# Test remote Docker via TLS
DOCKER_HOST=https://192.168.1.100:2376 \
DOCKER_TLS_VERIFY=1 \
DOCKER_CERT_PATH=~/.docker/certs \
node test-connection.js

# Test SSH tunnel connection
DOCKER_HOST=tcp://localhost:2375 node test-connection.js
```

The test utility will:
- ✓ Validate your configuration
- ✓ Check TLS certificates (if applicable)
- ✓ Test connection to Docker daemon
- ✓ Verify Docker operations (list containers, images, networks, volumes)
- ✓ Display system information
- ✓ Provide troubleshooting recommendations

### validate_connection Tool

Once the MCP server is running, you can also use the `validate_connection` tool from your AI assistant:

```
"Validate my Docker connection"
```

This tool performs runtime connectivity tests and returns:
- Connection status
- Docker version and API information
- System information
- Test results for common operations

### Manual Testing

You can also test your connection directly with Docker CLI:

```bash
# Set environment variables
export DOCKER_HOST=tcp://192.168.1.100:2375

# Test commands
docker version
docker info
docker ps
```

For detailed setup instructions, troubleshooting, and platform-specific guides, see:
- **[CONFIGURATION.md](CONFIGURATION.md)** - MCP server configuration examples
- **[REMOTE_SETUP.md](REMOTE_SETUP.md)** - Comprehensive remote connection setup guide (includes Windows 11 specific instructions)

## Available Tools (37 Total)

### Container Operations (15 tools)

#### `list_containers`
List all Docker containers (running or all)
```json
{
  "all": true
}
```

#### `create_container`
Create a new Docker container
```json
{
  "image": "nginx:latest",
  "name": "my-nginx",
  "command": ["nginx", "-g", "daemon off;"],
  "env": ["NODE_ENV=production"],
  "exposedPorts": {"80/tcp": {}},
  "hostConfig": {
    "PortBindings": {"80/tcp": [{"HostPort": "8080"}]},
    "Binds": ["/host/path:/container/path"]
  }
}
```

#### `run_container`
Create and start a container (recommended)
```json
{
  "image": "python:3.9",
  "name": "my-python-app",
  "command": ["python", "app.py"],
  "env": ["DEBUG=true", "PORT=5000"]
}
```

#### `start_container`
Start a stopped container
```json
{
  "containerId": "container_id_or_name"
}
```

#### `stop_container`
Stop a running container
```json
{
  "containerId": "container_id_or_name",
  "timeout": 10
}
```

#### `remove_container`
Remove a container
```json
{
  "containerId": "container_id_or_name",
  "force": false,
  "volumes": false
}
```

#### `inspect_container`
Get detailed container information
```json
{
  "containerId": "container_id_or_name"
}
```

#### `container_logs`
Get container logs
```json
{
  "containerId": "container_id_or_name",
  "tail": 100,
  "follow": false
}
```

#### `exec_container` 🆕
Execute a command in a running container
```json
{
  "containerId": "container_id_or_name",
  "command": ["ls", "-la", "/app"],
  "workingDir": "/app",
  "env": ["DEBUG=true"]
}
```

#### `container_stats` 🆕
Get real-time resource usage statistics (CPU, memory, network, I/O)
```json
{
  "containerId": "container_id_or_name",
  "stream": false
}
```

#### `restart_container` 🆕
Restart a Docker container
```json
{
  "containerId": "container_id_or_name",
  "timeout": 10
}
```

#### `pause_container` 🆕
Pause all processes within a container
```json
{
  "containerId": "container_id_or_name"
}
```

#### `unpause_container` 🆕
Unpause all processes within a container
```json
{
  "containerId": "container_id_or_name"
}
```

#### `rename_container` 🆕
Rename a Docker container
```json
{
  "containerId": "container_id_or_name",
  "newName": "new-container-name"
}
```

#### `prune_containers` 🆕
Remove all stopped containers
```json
{}
```

### Image Operations (7 tools)

#### `list_images`
List Docker images
```json
{
  "all": false
}
```

#### `pull_image`
Pull an image from registry
```json
{
  "image": "nginx:latest"
}
```

#### `build_image` 🆕
Build a Docker image from a Dockerfile
```json
{
  "context": "/path/to/build/context",
  "dockerfile": "Dockerfile",
  "tag": "myimage:latest",
  "buildArgs": {
    "NODE_VERSION": "18"
  }
}
```

#### `tag_image` 🆕
Tag an image with a new name/tag
```json
{
  "image": "myimage:latest",
  "repo": "myrepo/myimage",
  "tag": "v1.0.0"
}
```

#### `push_image` 🆕
Push an image to a Docker registry
```json
{
  "image": "myrepo/myimage:v1.0.0"
}
```

#### `remove_image` 🆕
Remove a Docker image
```json
{
  "image": "image_id_or_name",
  "force": false
}
```

#### `prune_images` 🆕
Remove unused images
```json
{
  "all": false
}
```

### Network Operations (6 tools)

#### `list_networks`
List Docker networks
```json
{}
```

#### `create_network` 🆕
Create a Docker network
```json
{
  "name": "my-network",
  "driver": "bridge",
  "internal": false
}
```

#### `inspect_network` 🆕
Get detailed information about a network
```json
{
  "networkId": "network_id_or_name"
}
```

#### `connect_network` 🆕
Connect a container to a network
```json
{
  "networkId": "network_id_or_name",
  "containerId": "container_id_or_name"
}
```

#### `disconnect_network` 🆕
Disconnect a container from a network
```json
{
  "networkId": "network_id_or_name",
  "containerId": "container_id_or_name",
  "force": false
}
```

#### `remove_network` 🆕
Remove a Docker network
```json
{
  "networkId": "network_id_or_name"
}
```

#### `prune_networks` 🆕
Remove all unused networks
```json
{}
```

### Volume Operations (5 tools)

#### `list_volumes`
List Docker volumes
```json
{}
```

#### `create_volume` 🆕
Create a Docker volume
```json
{
  "name": "my-volume",
  "driver": "local",
  "labels": {
    "environment": "production"
  }
}
```

#### `inspect_volume` 🆕
Get detailed information about a volume
```json
{
  "volumeName": "volume_name"
}
```

#### `remove_volume` 🆕
Remove a Docker volume
```json
{
  "volumeName": "volume_name",
  "force": false
}
```

#### `prune_volumes` 🆕
Remove all unused volumes
```json
{}
```

### System Operations (3 tools)

#### `system_info` 🆕
Get Docker system information
```json
{}
```

#### `system_version` 🆕
Get Docker version information
```json
{}
```

#### `validate_connection` 🆕
Validate Docker connection and test basic operations. Returns connection status, configuration details, and test results. Useful for troubleshooting connection issues.
```json
{}
```

## Key Features: Array Handling

This MCP server correctly handles arrays for:

- **Command**: Passed as an array of strings `["python", "app.py", "--port", "8000"]`
- **Entrypoint**: Passed as an array of strings `["/bin/bash", "-c"]`
- **Environment Variables**: Passed as an array of `KEY=VALUE` strings `["NODE_ENV=production", "PORT=3000"]`
- **Volume Bindings**: Passed as an array of bind strings `["/host/path:/container/path"]`

This resolves the common "array issue" where MCP servers incorrectly expect strings instead of arrays, causing errors when integrated with VS Code and GitHub Copilot.

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for development
- `npm start` - Run the compiled server
- `npm run dev` - Build and run

### Project Structure

```
Docker-MCP/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript output
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Troubleshooting

### Docker Connection Issues

If you get "Cannot connect to Docker daemon" errors:
- Ensure Docker is running: `docker ps`
- Check Docker socket permissions
- On Linux: Add your user to the docker group: `sudo usermod -aG docker $USER`

#### Remote Docker Connection Issues

If you can't connect to a remote Docker host:

1. **TCP Connection Issues**:
   - Ensure the Docker daemon is configured to listen on TCP: Check `/etc/docker/daemon.json`
   - Verify the port is open: `telnet remote-host 2375`
   - Check firewall rules on the remote host
   - Ensure `DOCKER_HOST` environment variable is set correctly

2. **TLS/HTTPS Connection Issues**:
   - Verify certificates are in the correct directory
   - Check certificate file names: `ca.pem`, `cert.pem`, `key.pem`
   - Ensure certificates are readable: `chmod 644 ca.pem cert.pem key.pem`
   - Verify `DOCKER_TLS_VERIFY=1` and `DOCKER_CERT_PATH` are set
   - Test with Docker CLI first: `docker --tlsverify --host=tcp://remote-host:2376 ps`

3. **SSH Tunnel Issues**:
   - Verify SSH tunnel is running: `ps aux | grep ssh`
   - Test tunnel: `curl http://localhost:2375/version`
   - Ensure local port is not already in use: `lsof -i :2375`
   - Try reconnecting the tunnel if connection is lost

### VS Code Integration Issues

If the MCP server doesn't appear in VS Code:
- Verify the path to `dist/index.js` is absolute
- Check that the server builds successfully: `npm run build`
- Restart VS Code after updating MCP settings
- Check VS Code Output panel for MCP-related errors
- Verify environment variables in MCP settings are correct

### Array-Related Errors

This server is specifically designed to handle arrays correctly. If you encounter array errors:
- Ensure you're passing arrays for `command`, `entrypoint`, and `env` fields
- Verify JSON formatting in tool arguments
- Check that arrays contain string items

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

This project follows industry-standard practices:

- **Branching Strategy**: Git Flow (see [BRANCHING.md](https://github.com/Swartdraak/Docker-MCP/blob/main/BRANCHING.md))
- **Versioning**: Semantic Versioning 2.0.0 (see [VERSIONING.md](https://github.com/Swartdraak/Docker-MCP/blob/main/VERSIONING.md))
- **Commit Convention**: Conventional Commits
- **CI/CD**: Automated testing and releases via GitHub Actions

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with conventional commits
4. Ensure tests pass: `npm test`
5. Push and create a Pull Request to `develop`

For detailed guidelines, see [CONTRIBUTING.md](https://github.com/Swartdraak/Docker-MCP/blob/main/CONTRIBUTING.md).

### Branch Structure

- `main` - Production releases (protected)
- `develop` - Integration branch (protected)
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Release Process

Releases are automated via GitHub Actions when tags are pushed:

```bash
# Create release branch
git checkout -b release/2.1.0

# Update version and changelog
npm version minor

# Merge to main and tag
git checkout main
git merge --no-ff release/2.1.0
git tag -a v2.1.0 -m "Version 2.1.0"
git push origin main --tags
```

See [VERSIONING.md](https://github.com/Swartdraak/Docker-MCP/blob/main/VERSIONING.md) for complete release procedures.


For detailed usage examples, see [EXAMPLES.md](EXAMPLES.md).

For configuration help, see [CONFIGURATION.md](CONFIGURATION.md).

## Documentation

### User Documentation
- [README.md](README.md) - Main documentation and quick start
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration options and setup
- [EXAMPLES.md](EXAMPLES.md) - Usage examples for all tools
- [REMOTE_SETUP.md](https://github.com/Swartdraak/Docker-MCP/blob/main/REMOTE_SETUP.md) - Remote Docker connection setup
- [MIGRATION.md](https://github.com/Swartdraak/Docker-MCP/blob/main/MIGRATION.md) - Migration guides for version upgrades

### Developer Documentation
- [CONTRIBUTING.md](https://github.com/Swartdraak/Docker-MCP/blob/main/CONTRIBUTING.md) - Contribution guidelines and workflow
- [BRANCHING.md](https://github.com/Swartdraak/Docker-MCP/blob/main/BRANCHING.md) - Git Flow branching strategy
- [VERSIONING.md](https://github.com/Swartdraak/Docker-MCP/blob/main/VERSIONING.md) - Semantic versioning and release process
- [BRANCH_PROTECTION.md](https://github.com/Swartdraak/Docker-MCP/blob/main/BRANCH_PROTECTION.md) - Branch protection setup guide
- [CHANGELOG.md](CHANGELOG.md) - Version history and changes
- [SECURITY.md](https://github.com/Swartdraak/Docker-MCP/blob/main/SECURITY.md) - Security policies and reporting

## License

MIT License - see LICENSE file for details

## Author

Swartdraak (eternusprocer@gmail.com)