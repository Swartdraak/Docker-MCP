# Example MCP Configuration for Docker Server

> **Note**: For comprehensive remote connection setup including Windows 11 specific instructions, SSH tunneling, TLS certificate generation, and troubleshooting, see **[REMOTE_SETUP.md](REMOTE_SETUP.md)**.
>
> This file provides quick configuration examples. For detailed setup guides and troubleshooting, refer to REMOTE_SETUP.md.

## VS Code / GitHub Copilot Configuration

### Local Docker (Default)

Create or edit `~/.vscode/mcp-settings.json` (Linux/Mac) or `%USERPROFILE%\.vscode\mcp-settings.json` (Windows):

**Linux/Mac:**
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

**Windows:**
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\Docker-MCP\\dist\\index.js"]
    }
  }
}
```

**Note**: Windows paths must use double backslashes (`\\`) or forward slashes (`/`).

### Remote Docker Host via TCP

**Linux/Mac:**
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/absolute/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "tcp://192.168.1.100:2375"
      }
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\Docker-MCP\\dist\\index.js"],
      "env": {
        "DOCKER_HOST": "tcp://192.168.1.100:2375"
      }
    }
  }
}
```

### Remote Docker Host via HTTPS with TLS

**Linux/Mac:**
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/absolute/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "https://192.168.1.100:2376",
        "DOCKER_TLS_VERIFY": "1",
        "DOCKER_CERT_PATH": "/home/user/.docker/certs"
      }
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\Docker-MCP\\dist\\index.js"],
      "env": {
        "DOCKER_HOST": "https://192.168.1.100:2376",
        "DOCKER_TLS_VERIFY": "1",
        "DOCKER_CERT_PATH": "C:\\Users\\YourName\\.docker\\certs"
      }
    }
  }
}
```

The certificate directory should contain:
- `ca.pem` - Certificate Authority certificate
- `cert.pem` - Client certificate
- `key.pem` - Client private key

### Remote Docker via SSH Tunnel

For SSH-based connections, set up an SSH tunnel first:

```bash
# Forward local port 2375 to remote Docker socket
ssh -NL localhost:2375:/var/run/docker.sock user@remote-host
```

Then configure the MCP server to use the tunneled connection:

```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/absolute/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "tcp://localhost:2375"
      }
    }
  }
}
```

## Claude Desktop Configuration

### Local Docker (Default)

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

### Remote Docker Host

For remote Docker hosts, add the `env` section with connection details:

```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/absolute/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "tcp://192.168.1.100:2375"
      }
    }
  }
}
```

## Environment Variables

The Docker MCP Server supports the following environment variables for configuring remote Docker host connections:

### DOCKER_HOST

Specifies the Docker daemon to connect to. Supports multiple formats:

- **Unix socket** (default): `unix:///var/run/docker.sock`
- **TCP**: `tcp://host:port` (e.g., `tcp://192.168.1.100:2375`)
- **HTTP**: `http://host:port` (e.g., `http://192.168.1.100:2375`)
- **HTTPS**: `https://host:port` (e.g., `https://192.168.1.100:2376`)
- **Host:port**: `host:port` (assumes TCP, e.g., `192.168.1.100:2375`)

If not set, defaults to local Docker socket (`/var/run/docker.sock` on Unix or named pipe on Windows).

### DOCKER_TLS_VERIFY

Enable TLS certificate verification when connecting to remote Docker hosts over HTTPS.

- Set to `1` or `true` to enable
- Requires `DOCKER_CERT_PATH` to be set

### DOCKER_CERT_PATH

Path to directory containing TLS certificates for secure connections. The directory must contain:

- `ca.pem` - Certificate Authority certificate
- `cert.pem` - Client certificate  
- `key.pem` - Client private key

Example: `/home/user/.docker/certs`

### DOCKER_PORT

Override the default Docker daemon port. Defaults:
- HTTP: `2375`
- HTTPS: `2376`

## Remote Docker Setup Examples

### Example 1: Unsecured Remote Docker (Testing Only)

**Warning**: Only use this in trusted networks or for testing purposes.

Configure remote Docker daemon (`/etc/docker/daemon.json`):
```json
{
  "hosts": ["tcp://0.0.0.0:2375", "unix:///var/run/docker.sock"]
}
```

MCP Configuration:
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "tcp://your-docker-host:2375"
      }
    }
  }
}
```

### Example 2: Secure Remote Docker with TLS

**Recommended for production use.**

1. Generate TLS certificates on the Docker host:
```bash
# On the Docker host
mkdir -p /etc/docker/ssl
cd /etc/docker/ssl

# Generate CA key and certificate
openssl genrsa -aes256 -out ca-key.pem 4096
openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem

# Generate server key and certificate
openssl genrsa -out server-key.pem 4096
openssl req -subj "/CN=your-docker-host" -sha256 -new -key server-key.pem -out server.csr
echo subjectAltName = DNS:your-docker-host,IP:192.168.1.100 >> extfile.cnf
echo extendedKeyUsage = serverAuth >> extfile.cnf
openssl x509 -req -days 365 -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem \
  -CAcreateserial -out server-cert.pem -extfile extfile.cnf

# Generate client key and certificate
openssl genrsa -out key.pem 4096
openssl req -subj '/CN=client' -new -key key.pem -out client.csr
echo extendedKeyUsage = clientAuth > extfile-client.cnf
openssl x509 -req -days 365 -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem \
  -CAcreateserial -out cert.pem -extfile extfile-client.cnf

# Set proper permissions
chmod -v 0400 ca-key.pem key.pem server-key.pem
chmod -v 0444 ca.pem server-cert.pem cert.pem
```

2. Configure Docker daemon (`/etc/docker/daemon.json`):
```json
{
  "hosts": ["tcp://0.0.0.0:2376", "unix:///var/run/docker.sock"],
  "tlsverify": true,
  "tlscacert": "/etc/docker/ssl/ca.pem",
  "tlscert": "/etc/docker/ssl/server-cert.pem",
  "tlskey": "/etc/docker/ssl/server-key.pem"
}
```

3. Copy client certificates to your local machine:
```bash
# Copy ca.pem, cert.pem, and key.pem to ~/.docker/certs/
mkdir -p ~/.docker/certs
scp user@docker-host:/etc/docker/ssl/ca.pem ~/.docker/certs/
scp user@docker-host:/etc/docker/ssl/cert.pem ~/.docker/certs/
scp user@docker-host:/etc/docker/ssl/key.pem ~/.docker/certs/
```

4. MCP Configuration:
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "https://your-docker-host:2376",
        "DOCKER_TLS_VERIFY": "1",
        "DOCKER_CERT_PATH": "/home/user/.docker/certs"
      }
    }
  }
}
```

### Example 3: Remote Docker via SSH Tunnel

**Most secure option without TLS certificate management.**

1. Set up SSH tunnel in a separate terminal:
```bash
ssh -NL localhost:2375:/var/run/docker.sock user@remote-docker-host
```

Or run it in the background:
```bash
ssh -fNL localhost:2375:/var/run/docker.sock user@remote-docker-host
```

2. MCP Configuration:
```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "tcp://localhost:2375"
      }
    }
  }
}
```

### Example 4: Multiple Docker Hosts

You can configure multiple MCP servers to manage different Docker hosts:

```json
{
  "mcpServers": {
    "docker-local": {
      "command": "node",
      "args": ["/path/to/Docker-MCP/dist/index.js"]
    },
    "docker-staging": {
      "command": "node",
      "args": ["/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "tcp://staging-server:2375"
      }
    },
    "docker-production": {
      "command": "node",
      "args": ["/path/to/Docker-MCP/dist/index.js"],
      "env": {
        "DOCKER_HOST": "https://prod-server:2376",
        "DOCKER_TLS_VERIFY": "1",
        "DOCKER_CERT_PATH": "/home/user/.docker/prod-certs"
      }
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
- On Windows, use double backslashes (`\\`) or forward slashes (`/`) in paths

## Testing Your Connection

Before using the MCP server in production, test your Docker connection:

```bash
# Test your connection
node test-connection.js

# Or with environment variables
DOCKER_HOST=tcp://192.168.1.100:2375 node test-connection.js
```

The test utility will validate your configuration, test connectivity, and provide troubleshooting recommendations if issues are found.

Once the MCP server is running, you can also use the `validate_connection` tool through your AI assistant to verify the connection at runtime.

## Additional Resources

- **[REMOTE_SETUP.md](REMOTE_SETUP.md)** - Comprehensive remote connection setup guide
  - Windows 11 specific instructions
  - Docker daemon configuration
  - SSH tunnel setup (Windows/Linux/Mac)
  - TLS certificate generation
  - Troubleshooting common issues
- **[README.md](README.md)** - Main documentation and feature overview
- **[EXAMPLES.md](EXAMPLES.md)** - Real-world usage examples
