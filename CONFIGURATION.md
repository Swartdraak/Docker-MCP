# Example MCP Configuration for Docker Server

## VS Code / GitHub Copilot Configuration

Create or edit `~/.vscode/mcp-settings.json`:

```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/absolute/path/to/Docker-MCP/dist/index.js"]
    }
  }
}
```

## Claude Desktop Configuration

Create or edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or 
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/absolute/path/to/Docker-MCP/dist/index.js"]
    }
  }
}
```

## Example Usage with GitHub Copilot

Once configured, you can interact with Docker using natural language in GitHub Copilot:

### Example 1: Run a simple container
```
"Run an nginx container named web-server on port 8080"
```

GitHub Copilot will call:
```json
{
  "tool": "run_container",
  "arguments": {
    "image": "nginx:latest",
    "name": "web-server",
    "exposedPorts": {"80/tcp": {}},
    "hostConfig": {
      "PortBindings": {"80/tcp": [{"HostPort": "8080"}]}
    }
  }
}
```

### Example 2: Run a Python app with environment variables
```
"Create a Python container that runs app.py with DEBUG=true and PORT=5000"
```

GitHub Copilot will call:
```json
{
  "tool": "run_container",
  "arguments": {
    "image": "python:3.9",
    "command": ["python", "app.py"],
    "env": ["DEBUG=true", "PORT=5000"]
  }
}
```

### Example 3: List all containers
```
"Show me all Docker containers including stopped ones"
```

GitHub Copilot will call:
```json
{
  "tool": "list_containers",
  "arguments": {
    "all": true
  }
}
```

## Notes

- Make sure to use absolute paths in the configuration
- The server must be built (`npm run build`) before use
- Docker daemon must be running and accessible
- On Linux, ensure your user has permission to access Docker socket
