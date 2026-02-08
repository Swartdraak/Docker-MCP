# Docker MCP Server

A fully functional, feature-rich, industry-standard compliant MCP (Model Context Protocol) Server that enables communication with Docker daemon. This server allows AI assistants like GitHub Copilot and Claude to interact with Docker containers, images, networks, and volumes through a standardized interface.

## Features

- ✅ **Complete Docker Operations**: Create, run, start, stop, remove containers
- ✅ **Proper Array Handling**: Correctly handles command, entrypoint, and environment variables as arrays
- ✅ **Image Management**: Pull images, list images with detailed information
- ✅ **Container Inspection**: Get detailed container information and logs
- ✅ **Network & Volume Support**: List Docker networks and volumes
- ✅ **VS Code Integration**: Works seamlessly with GitHub Copilot and VS Code
- ✅ **Industry Standard Compliant**: Uses MCP SDK and follows best practices

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

## Available Tools

### Container Operations

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

### Image Operations

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

### Network & Volume Operations

#### `list_networks`
List Docker networks
```json
{}
```

#### `list_volumes`
List Docker volumes
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

## License

MIT License - see LICENSE file for details

## Author

Swartdraak (eternusprocer@gmail.com)