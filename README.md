# Docker MCP Server

A comprehensive, production-ready, industry-standard compliant MCP (Model Context Protocol) Server that enables full Docker management capabilities for AI assistants like GitHub Copilot and Claude. Featuring 38 powerful tools covering containers, images, networks, volumes, and system operations.

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
- ✅ **38 Docker Tools**: Complete coverage of Docker operations
- ✅ **Container Management**: Create, run, start, stop, restart, pause, unpause, rename, remove, exec, stats, logs
- ✅ **Image Operations**: List, pull, build, push, tag, remove, prune
- ✅ **Network Management**: List, create, remove, inspect, connect, disconnect
- ✅ **Volume Management**: List, create, remove, inspect, prune
- ✅ **System Operations**: Info, version, prune (containers, images, volumes, networks)
- ✅ **Proper Array Handling**: Correctly handles command, entrypoint, and environment variables
- ✅ **VS Code Integration**: Works seamlessly with GitHub Copilot
- ✅ **Industry Standard**: Uses MCP SDK and Docker best practices
- ✅ **TypeScript**: Full type safety and modern JavaScript features

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

### Prerequisites

- Node.js 18 or higher
- Docker installed and running
- npm or yarn package manager

### Setup

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

### VS Code Integration

To integrate with VS Code and GitHub Copilot, add the following to your MCP settings file:

**For VS Code** (`~/.vscode/mcp-settings.json` or in your workspace settings):
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

## Available Tools (38 Total)

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

### System Operations (5 tools)

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

### VS Code Integration Issues

If the MCP server doesn't appear in VS Code:
- Verify the path to `dist/index.js` is absolute
- Check that the server builds successfully: `npm run build`
- Restart VS Code after updating MCP settings
- Check VS Code Output panel for MCP-related errors

### Array-Related Errors

This server is specifically designed to handle arrays correctly. If you encounter array errors:
- Ensure you're passing arrays for `command`, `entrypoint`, and `env` fields
- Verify JSON formatting in tool arguments
- Check that arrays contain string items

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For detailed usage examples, see [EXAMPLES.md](EXAMPLES.md).

For configuration help, see [CONFIGURATION.md](CONFIGURATION.md).

## License

MIT License - see LICENSE file for details

## Author

Swartdraak (eternusprocer@gmail.com)