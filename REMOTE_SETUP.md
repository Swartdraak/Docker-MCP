# Remote Docker Connection Setup Guide

This guide provides detailed instructions for setting up Docker MCP Server to connect to remote Docker hosts, including Windows 11 specific configurations.

## Table of Contents

- [Overview](#overview)
- [Connection Methods](#connection-methods)
- [Windows 11 Setup](#windows-11-setup)
- [Linux Remote Host Setup](#linux-remote-host-setup)
- [SSH Tunnel Setup](#ssh-tunnel-setup)
- [TLS Certificate Setup](#tls-certificate-setup)
- [Testing Your Connection](#testing-your-connection)
- [Troubleshooting](#troubleshooting)

## Overview

Docker MCP Server supports multiple connection methods to Docker hosts:

1. **Local Socket** - Default, direct connection to local Docker daemon
2. **TCP (Unsecured)** - Remote connection without encryption (testing only)
3. **TLS/HTTPS** - Secure remote connection with certificate authentication
4. **SSH Tunnel** - Secure remote connection through SSH (recommended for remote access)

## Connection Methods

### Method Comparison

| Method | Security | Setup Difficulty | Use Case |
|--------|----------|-----------------|----------|
| Local Socket | High | Easy | Local Docker only |
| TCP | **Low** | Easy | Testing/Trusted networks only |
| TLS/HTTPS | High | Medium | Production remote access |
| SSH Tunnel | High | Medium | Best for existing SSH access |

## Windows 11 Setup

### Prerequisites

- Windows 11 with WSL2 or Docker Desktop
- Node.js 18+ installed
- Docker Desktop running (if using local Docker)
- OpenSSH Client (included in Windows 11)

### Option 1: Local Docker on Windows 11

Docker Desktop on Windows uses a named pipe for communication:

1. **Start Docker Desktop**
   - Ensure Docker Desktop is running
   - Check the Docker icon in system tray

2. **Configure MCP Server**
   
   Edit VS Code settings (`%USERPROFILE%\.vscode\mcp-settings.json`):
   ```json
   {
     "mcpServers": {
       "docker": {
         "command": "node",
         "args": ["C:\\path\\to\\Docker-MCP\\dist\\index.js"]
       }
     }
   }
   ```

   Or for Claude Desktop (`%APPDATA%\Claude\claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "docker": {
         "command": "node",
         "args": ["C:\\path\\to\\Docker-MCP\\dist\\index.js"]
       }
     }
   }
   ```

3. **Test Connection**
   ```powershell
   cd C:\path\to\Docker-MCP
   node test-connection.js
   ```

### Option 2: Remote Docker via SSH Tunnel (Recommended for Windows)

This is the most secure and easiest method for Windows users to connect to remote Docker hosts.

#### Step 1: Set Up SSH Keys

If you don't already have SSH keys:

```powershell
# Generate SSH key pair
ssh-keygen -t ed25519 -C "your-email@example.com"

# Press Enter to accept default location (C:\Users\YourName\.ssh\id_ed25519)
# Enter a passphrase (optional but recommended)
```

#### Step 2: Copy SSH Key to Remote Host

```powershell
# Copy your public key to the remote host
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh user@remote-host "cat >> ~/.ssh/authorized_keys"
```

Or manually:
1. Display your public key:
   ```powershell
   type $env:USERPROFILE\.ssh\id_ed25519.pub
   ```
2. SSH to remote host and add it to `~/.ssh/authorized_keys`

#### Step 3: Test SSH Connection

```powershell
ssh user@remote-host
```

If successful, you'll connect without being prompted for a password (or only for the SSH key passphrase).

#### Step 4: Create SSH Tunnel

**Option A: Manual Tunnel (for testing)**

Open PowerShell and run:
```powershell
ssh -NL localhost:2375:/var/run/docker.sock user@remote-host
```

Keep this terminal open while using Docker MCP.

**Option B: Background Tunnel (recommended)**

Create a background SSH tunnel that reconnects automatically:

1. Create a PowerShell script `C:\path\to\docker-ssh-tunnel.ps1`:
   ```powershell
   # Docker SSH Tunnel Script
   $remoteHost = "user@remote-host"
   $localPort = 2375
   
   while ($true) {
       Write-Host "Starting SSH tunnel to $remoteHost..."
       ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -NL localhost:${localPort}:/var/run/docker.sock $remoteHost
       
       Write-Host "SSH tunnel disconnected. Reconnecting in 5 seconds..."
       Start-Sleep -Seconds 5
   }
   ```

2. Run in a separate PowerShell window:
   ```powershell
   powershell -ExecutionPolicy Bypass -File C:\path\to\docker-ssh-tunnel.ps1
   ```

**Option C: Windows Task Scheduler (auto-start on login)**

1. Open Task Scheduler
2. Create New Task:
   - Name: "Docker SSH Tunnel"
   - Trigger: At log on
   - Action: Start a program
     - Program: `powershell.exe`
     - Arguments: `-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\path\to\docker-ssh-tunnel.ps1"`
3. Save and start the task

#### Step 5: Configure MCP Server for SSH Tunnel

Edit your MCP configuration to use the tunnel:

```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["C:\\path\\to\\Docker-MCP\\dist\\index.js"],
      "env": {
        "DOCKER_HOST": "tcp://localhost:2375"
      }
    }
  }
}
```

#### Step 6: Test the Connection

```powershell
cd C:\path\to\Docker-MCP
$env:DOCKER_HOST = "tcp://localhost:2375"
node test-connection.js
```

### Option 3: Remote Docker via TLS (Windows)

For direct TLS connection from Windows:

#### Step 1: Obtain TLS Certificates

Copy the client certificates from your Docker host to Windows:

```powershell
# Create certificate directory
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.docker\certs

# Copy certificates using SCP
scp user@remote-host:/path/to/ca.pem $env:USERPROFILE\.docker\certs\
scp user@remote-host:/path/to/cert.pem $env:USERPROFILE\.docker\certs\
scp user@remote-host:/path/to/key.pem $env:USERPROFILE\.docker\certs\
```

#### Step 2: Configure MCP Server

```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["C:\\path\\to\\Docker-MCP\\dist\\index.js"],
      "env": {
        "DOCKER_HOST": "https://remote-host:2376",
        "DOCKER_TLS_VERIFY": "1",
        "DOCKER_CERT_PATH": "C:\\Users\\YourName\\.docker\\certs"
      }
    }
  }
}
```

#### Step 3: Test Connection

```powershell
cd C:\path\to\Docker-MCP
$env:DOCKER_HOST = "https://remote-host:2376"
$env:DOCKER_TLS_VERIFY = "1"
$env:DOCKER_CERT_PATH = "$env:USERPROFILE\.docker\certs"
node test-connection.js
```

## Linux Remote Host Setup

### Configuring Docker Daemon for Remote Access

#### Option 1: TCP Only (Testing/Trusted Networks Only)

⚠️ **Warning**: This exposes Docker API without authentication. Use only in trusted networks.

1. **Edit Docker Service Configuration**

   ```bash
   sudo mkdir -p /etc/systemd/system/docker.service.d
   sudo nano /etc/systemd/system/docker.service.d/override.conf
   ```

   Add:
   ```ini
   [Service]
   ExecStart=
   ExecStart=/usr/bin/dockerd -H fd:// -H tcp://0.0.0.0:2375
   ```

2. **Reload and Restart Docker**

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

3. **Verify**

   ```bash
   sudo netstat -tulpn | grep 2375
   ```

4. **Test from Client**

   ```bash
   DOCKER_HOST=tcp://remote-host:2375 docker ps
   ```

#### Option 2: TLS/HTTPS (Recommended for Production)

1. **Generate TLS Certificates**

   ```bash
   # Create certificate directory
   sudo mkdir -p /etc/docker/ssl
   cd /etc/docker/ssl

   # Set variables
   HOST="your-docker-host"
   IP="192.168.1.100"  # Your Docker host IP

   # Generate CA
   openssl genrsa -aes256 -out ca-key.pem 4096
   openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem \
     -subj "/CN=Docker CA"

   # Generate server certificate
   openssl genrsa -out server-key.pem 4096
   openssl req -subj "/CN=$HOST" -sha256 -new -key server-key.pem -out server.csr

   echo "subjectAltName = DNS:$HOST,IP:$IP,IP:127.0.0.1" > extfile.cnf
   echo "extendedKeyUsage = serverAuth" >> extfile.cnf

   openssl x509 -req -days 365 -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem \
     -CAcreateserial -out server-cert.pem -extfile extfile.cnf

   # Generate client certificate
   openssl genrsa -out key.pem 4096
   openssl req -subj '/CN=client' -new -key key.pem -out client.csr

   echo "extendedKeyUsage = clientAuth" > extfile-client.cnf

   openssl x509 -req -days 365 -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem \
     -CAcreateserial -out cert.pem -extfile extfile-client.cnf

   # Set permissions
   sudo chmod -v 0400 ca-key.pem key.pem server-key.pem
   sudo chmod -v 0444 ca.pem server-cert.pem cert.pem

   # Clean up
   rm -v client.csr server.csr extfile.cnf extfile-client.cnf
   ```

2. **Configure Docker Daemon**

   Edit `/etc/docker/daemon.json`:
   ```json
   {
     "hosts": ["fd://", "tcp://0.0.0.0:2376"],
     "tls": true,
     "tlsverify": true,
     "tlscacert": "/etc/docker/ssl/ca.pem",
     "tlscert": "/etc/docker/ssl/server-cert.pem",
     "tlskey": "/etc/docker/ssl/server-key.pem"
   }
   ```

   **Important**: Remove `-H` flags from Docker service file if present:
   ```bash
   sudo systemctl edit docker.service
   ```

   Clear any `ExecStart` lines with `-H` flags.

3. **Restart Docker**

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

4. **Verify**

   ```bash
   sudo netstat -tulpn | grep 2376
   sudo docker --tlsverify \
     --tlscacert=/etc/docker/ssl/ca.pem \
     --tlscert=/etc/docker/ssl/cert.pem \
     --tlskey=/etc/docker/ssl/key.pem \
     -H=tcp://localhost:2376 ps
   ```

5. **Copy Client Certificates**

   Copy `ca.pem`, `cert.pem`, and `key.pem` to your client machine.

#### Option 3: SSH Access Only (Most Secure)

Keep Docker daemon on Unix socket only and use SSH tunneling:

1. **Ensure Docker uses Unix socket only** (default configuration)

2. **Configure SSH for key-based authentication**

   ```bash
   # On remote host
   cat ~/.ssh/authorized_keys  # Verify your public key is here
   ```

3. **Set proper SSH permissions**

   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

## SSH Tunnel Setup

### Linux/Mac Client

#### One-time Tunnel

```bash
ssh -NL localhost:2375:/var/run/docker.sock user@remote-host
```

#### Background Tunnel

```bash
ssh -fNL localhost:2375:/var/run/docker.sock user@remote-host
```

#### Auto-reconnecting Tunnel

Create a script `~/bin/docker-tunnel.sh`:

```bash
#!/bin/bash
while true; do
    echo "Starting Docker SSH tunnel..."
    ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 \
        -NL localhost:2375:/var/run/docker.sock user@remote-host
    echo "Tunnel disconnected. Reconnecting in 5 seconds..."
    sleep 5
done
```

Make it executable and run:

```bash
chmod +x ~/bin/docker-tunnel.sh
~/bin/docker-tunnel.sh &
```

#### Systemd Service (Linux)

Create `/etc/systemd/system/docker-tunnel.service`:

```ini
[Unit]
Description=Docker SSH Tunnel
After=network.target

[Service]
Type=simple
User=youruser
ExecStart=/usr/bin/ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -NL localhost:2375:/var/run/docker.sock user@remote-host
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable docker-tunnel.service
sudo systemctl start docker-tunnel.service
```

### Windows Client

See [Windows 11 Setup - Option 2](#option-2-remote-docker-via-ssh-tunnel-recommended-for-windows) above.

## TLS Certificate Setup

### Quick Certificate Generation Script

Save as `generate-docker-certs.sh`:

```bash
#!/bin/bash

# Configuration
HOST="${1:-localhost}"
IP="${2:-127.0.0.1}"
OUTPUT_DIR="${3:-./docker-certs}"

# Create output directory
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# Generate CA
echo "Generating CA..."
openssl genrsa -aes256 -out ca-key.pem 4096
openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem \
  -subj "/CN=Docker CA"

# Generate server certificate
echo "Generating server certificate..."
openssl genrsa -out server-key.pem 4096
openssl req -subj "/CN=$HOST" -sha256 -new -key server-key.pem -out server.csr

cat > extfile.cnf <<EOF
subjectAltName = DNS:$HOST,IP:$IP,IP:127.0.0.1
extendedKeyUsage = serverAuth
EOF

openssl x509 -req -days 365 -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem \
  -CAcreateserial -out server-cert.pem -extfile extfile.cnf

# Generate client certificate
echo "Generating client certificate..."
openssl genrsa -out key.pem 4096
openssl req -subj '/CN=client' -new -key key.pem -out client.csr

echo "extendedKeyUsage = clientAuth" > extfile-client.cnf

openssl x509 -req -days 365 -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem \
  -CAcreateserial -out cert.pem -extfile extfile-client.cnf

# Set permissions
chmod 0400 ca-key.pem key.pem server-key.pem
chmod 0444 ca.pem server-cert.pem cert.pem

# Clean up
rm -f client.csr server.csr extfile.cnf extfile-client.cnf

echo "Certificates generated in $OUTPUT_DIR"
echo ""
echo "Server files (copy to Docker host):"
echo "  - ca.pem"
echo "  - server-cert.pem"
echo "  - server-key.pem"
echo ""
echo "Client files (for MCP):"
echo "  - ca.pem"
echo "  - cert.pem"
echo "  - key.pem"
```

Usage:

```bash
chmod +x generate-docker-certs.sh
./generate-docker-certs.sh your-docker-host 192.168.1.100 ./certs
```

## Testing Your Connection

### Using the Test Connection Script

The repository includes a comprehensive connection testing tool:

```bash
# Local Docker
node test-connection.js

# Remote Docker (TCP)
DOCKER_HOST=tcp://192.168.1.100:2375 node test-connection.js

# Remote Docker (TLS)
DOCKER_HOST=https://192.168.1.100:2376 \
DOCKER_TLS_VERIFY=1 \
DOCKER_CERT_PATH=~/.docker/certs \
node test-connection.js

# SSH Tunnel
DOCKER_HOST=tcp://localhost:2375 node test-connection.js
```

### Using the validate_connection MCP Tool

Once your MCP server is configured and running, you can use the `validate_connection` tool:

1. Start your MCP client (VS Code with GitHub Copilot or Claude Desktop)
2. Ask your AI assistant: "Validate my Docker connection"
3. The assistant will use the `validate_connection` tool to test connectivity

The tool will check:
- Connection status
- Docker version
- System information
- Container and image listing capabilities

### Manual Testing with Docker CLI

Test the connection directly using Docker CLI:

```bash
# Set environment variables
export DOCKER_HOST=tcp://192.168.1.100:2375

# Or for TLS
export DOCKER_HOST=https://192.168.1.100:2376
export DOCKER_TLS_VERIFY=1
export DOCKER_CERT_PATH=~/.docker/certs

# Test commands
docker version
docker info
docker ps
docker images
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Cannot connect to the Docker daemon"

**Possible Causes:**
1. Docker daemon not running
2. Incorrect DOCKER_HOST setting
3. Firewall blocking connection
4. SSH tunnel not established

**Solutions:**

1. **Local Docker**:
   ```bash
   # Linux/Mac
   sudo systemctl status docker
   sudo systemctl start docker
   
   # Windows
   # Check Docker Desktop is running in system tray
   ```

2. **Remote Docker**:
   ```bash
   # Check if port is open
   telnet remote-host 2375
   # or
   nc -zv remote-host 2375
   
   # Check Docker daemon is listening
   ssh user@remote-host "sudo netstat -tulpn | grep docker"
   ```

3. **SSH Tunnel**:
   ```bash
   # Check if tunnel is running
   ps aux | grep "ssh.*2375"
   
   # Check if port is listening locally
   netstat -an | grep 2375  # Linux/Mac
   netstat -an | findstr 2375  # Windows
   
   # Restart tunnel
   ssh -NL localhost:2375:/var/run/docker.sock user@remote-host
   ```

#### Issue: "certificate signed by unknown authority"

**Possible Causes:**
1. CA certificate not loaded
2. Certificate doesn't match hostname
3. Self-signed certificate without proper configuration

**Solutions:**

1. **Verify certificate files**:
   ```bash
   ls -la ~/.docker/certs/
   # Should contain: ca.pem, cert.pem, key.pem
   ```

2. **Check certificate validity**:
   ```bash
   openssl x509 -in ~/.docker/certs/cert.pem -text -noout
   # Check Subject, Issuer, and SAN
   ```

3. **Verify DOCKER_CERT_PATH**:
   ```bash
   echo $DOCKER_CERT_PATH
   # Should point to directory containing certificates
   ```

4. **Test with verbose output**:
   ```bash
   docker --tlsverify \
     --tlscacert=$DOCKER_CERT_PATH/ca.pem \
     --tlscert=$DOCKER_CERT_PATH/cert.pem \
     --tlskey=$DOCKER_CERT_PATH/key.pem \
     -H tcp://remote-host:2376 version
   ```

#### Issue: "connection refused" on port 2375/2376

**Possible Causes:**
1. Docker daemon not configured to listen on TCP
2. Firewall blocking the port
3. Wrong IP address or hostname

**Solutions:**

1. **Check Docker daemon configuration**:
   ```bash
   ssh user@remote-host "sudo docker info | grep -i host"
   ssh user@remote-host "sudo netstat -tulpn | grep docker"
   ```

2. **Check firewall**:
   ```bash
   # Linux (UFW)
   sudo ufw status
   sudo ufw allow 2376/tcp
   
   # Linux (iptables)
   sudo iptables -L -n | grep 2376
   
   # Linux (firewalld)
   sudo firewall-cmd --list-all
   sudo firewall-cmd --add-port=2376/tcp --permanent
   sudo firewall-cmd --reload
   ```

3. **Check Docker is listening**:
   ```bash
   ssh user@remote-host "sudo ss -tlnp | grep dockerd"
   ```

#### Issue: SSH tunnel keeps disconnecting

**Possible Causes:**
1. Network instability
2. SSH timeout settings
3. Server keepalive not configured

**Solutions:**

1. **Use keepalive options**:
   ```bash
   ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 \
       -NL localhost:2375:/var/run/docker.sock user@remote-host
   ```

2. **Configure SSH client** (`~/.ssh/config`):
   ```
   Host remote-host
       ServerAliveInterval 60
       ServerAliveCountMax 3
       TCPKeepAlive yes
   ```

3. **Use autossh** (Linux/Mac):
   ```bash
   # Install autossh
   sudo apt install autossh  # Debian/Ubuntu
   brew install autossh      # macOS
   
   # Run with autossh
   autossh -M 0 -o ServerAliveInterval=60 -o ServerAliveCountMax=3 \
       -NL localhost:2375:/var/run/docker.sock user@remote-host
   ```

#### Issue: "permission denied" on Docker socket

**Possible Causes:**
1. User not in docker group (Linux)
2. Docker socket has wrong permissions
3. SELinux/AppArmor blocking access

**Solutions:**

1. **Add user to docker group** (Linux):
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in for changes to take effect
   ```

2. **Check socket permissions**:
   ```bash
   ls -l /var/run/docker.sock
   # Should show: srw-rw---- root docker
   
   # Fix ownership and permissions if needed
   sudo chown root:docker /var/run/docker.sock
   sudo chmod 660 /var/run/docker.sock
   # Ensure your user is in the 'docker' group (see above)
   ```

3. **Check SELinux** (RHEL/CentOS):
   ```bash
   getenforce
   # If Enforcing, try:
   sudo setenforce 0  # Temporary
   # Or configure proper SELinux policies
   ```

#### Issue: Works with Docker CLI but not MCP Server

**Possible Causes:**
1. Environment variables not passed to MCP server
2. Path expansion issues (e.g., `~` in DOCKER_CERT_PATH)
3. Node.js version incompatibility

**Solutions:**

1. **Verify environment variables in config**:
   ```json
   {
     "mcpServers": {
       "docker": {
         "env": {
           "DOCKER_HOST": "tcp://remote-host:2375",
           "DOCKER_TLS_VERIFY": "1",
           "DOCKER_CERT_PATH": "/full/absolute/path/to/certs"
         }
       }
     }
   }
   ```
   
   **Important**: Use absolute paths, not `~` or environment variables.

2. **Test with same environment**:
   ```bash
   export DOCKER_HOST=tcp://remote-host:2375
   node dist/index.js
   # Check if server starts without errors
   ```

3. **Check Node.js version**:
   ```bash
   node --version
   # Should be 18.0.0 or higher
   ```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Set debug environment variable
export DEBUG=dockerode*

# Run test connection
node test-connection.js
```

### Getting Help

If you're still having issues:

1. Run the connection test: `node test-connection.js`
2. Check the output for specific error messages
3. Review this troubleshooting guide
4. Open an issue on GitHub with:
   - Your configuration (redact sensitive info)
   - Error messages
   - Output from `node test-connection.js`
   - Your environment (OS, Node.js version, Docker version)

## Best Practices

1. **Security**:
   - Never use unencrypted TCP (port 2375) in production
   - Use TLS (port 2376) or SSH tunneling for remote access
   - Keep certificates secure and don't commit them to version control
   - Use strong passwords for SSH keys

2. **Reliability**:
   - Set up automatic SSH tunnel reconnection
   - Monitor Docker daemon health
   - Use systemd or equivalent for service management

3. **Performance**:
   - Prefer SSH tunneling for occasional access
   - Use TLS for high-frequency API calls
   - Consider network latency for remote connections

4. **Maintenance**:
   - Rotate TLS certificates before expiration
   - Keep Docker daemon and MCP server updated
   - Monitor logs for connection issues
   - Test backups of your configuration

## Additional Resources

- [Docker Daemon Socket Options](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-socket-option)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OpenSSH Documentation](https://www.openssh.com/manual.html)
- [Docker TLS Configuration](https://docs.docker.com/engine/security/protect-access/)

## Quick Reference

### Environment Variables

```bash
# Local Docker (default)
# No environment variables needed

# Remote TCP (unsecured)
export DOCKER_HOST=tcp://remote-host:2375

# Remote TLS (secured)
export DOCKER_HOST=https://remote-host:2376
export DOCKER_TLS_VERIFY=1
export DOCKER_CERT_PATH=/path/to/certs

# SSH Tunnel
export DOCKER_HOST=tcp://localhost:2375
```

### Common Commands

```bash
# Test connection
node test-connection.js

# Build MCP server
npm run build

# Start MCP server
npm start

# Run tests
npm test

# Docker CLI test
docker version
docker info
docker ps
```

### Port Reference

- **2375**: Default HTTP (unencrypted) Docker port
- **2376**: Default HTTPS (TLS) Docker port
- **Custom**: Can be configured via DOCKER_PORT environment variable
