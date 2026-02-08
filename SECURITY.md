# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Security Features

### Overview

Docker MCP Server is designed with security in mind for production deployments. While the server provides full Docker API access, it implements several security best practices:

1. **No Authentication Required for Local Use**: When running locally via stdio transport, authentication is not necessary as it communicates directly with the AI assistant.

2. **Docker Socket Security**: The server respects Docker daemon permissions. Ensure Docker socket is properly secured on your system.

3. **Input Validation**: All tool inputs are validated using JSON schema validation.

4. **Error Handling**: Errors are properly caught and sanitized before returning to the client.

5. **No Credential Storage**: The server does not store Docker registry credentials or any sensitive information.

## Security Best Practices

### For Local Development

1. **Docker Socket Permissions**: Ensure only authorized users have access to Docker socket
   ```bash
   # Linux/macOS
   ls -la /var/run/docker.sock
   
   # Should be owned by root:docker or equivalent
   ```

2. **Limited Scope**: Only give Docker access to users who need it
   ```bash
   # Add user to docker group (Linux)
   sudo usermod -aG docker $USER
   ```

### For Production Deployments

1. **Network Security**: If deploying with network access, use a reverse proxy with:
   - TLS/HTTPS encryption
   - Authentication (OAuth, API keys, etc.)
   - Rate limiting
   - IP whitelisting

2. **Container Isolation**: Run the MCP server in a container with limited privileges
   ```bash
   docker run --read-only --security-opt=no-new-privileges \
     -v /var/run/docker.sock:/var/run/docker.sock \
     docker-mcp-server
   ```

3. **Audit Logging**: Monitor all Docker operations through Docker's audit logs

4. **Principle of Least Privilege**: Consider using Docker's authorization plugins to restrict operations

## Known Security Considerations

### Docker Socket Access

The server requires access to the Docker socket (`/var/run/docker.sock`). This is equivalent to root access on the host system. Anyone with access to this server can:

- Create and manage containers
- Access container logs and inspect containers
- Modify networks and volumes
- Execute commands in containers
- Build and push images

**Mitigation**: 
- Only deploy in trusted environments
- Use network segmentation
- Implement authentication/authorization if exposed over network
- Monitor Docker API calls through audit logs

### Container Logs May Contain Sensitive Data

Container logs retrieved through `container_logs` may contain:
- Application secrets
- API keys
- Personal information
- Internal system details

**Mitigation**:
- Educate AI assistant users about log sensitivity
- Use Docker secrets management for sensitive data
- Rotate credentials regularly
- Filter logs before exposure if possible

### Image Building Security

The `build_image` tool can execute Dockerfile instructions which may:
- Download malicious content
- Execute arbitrary commands during build
- Access build context files

**Mitigation**:
- Validate Dockerfiles before building
- Use trusted base images only
- Scan built images for vulnerabilities
- Limit build context to necessary files only

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **DO NOT** open a public GitHub issue
2. Email security details to: eternusprocer@gmail.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to:
- Verify the vulnerability
- Develop a fix
- Coordinate disclosure timeline
- Credit you for the discovery (if desired)

## Security Updates

Security updates will be released as patch versions and announced through:
- GitHub Security Advisories
- Release notes
- README updates

## Additional Resources

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [MCP Security Considerations](https://modelcontextprotocol.io/docs/security)
- [OWASP Container Security](https://owasp.org/www-project-docker-top-10/)

## Compliance

This server is designed to be compliant with:
- Docker security best practices
- OWASP Top 10 for containers
- Industry standard secure coding practices

For specific compliance requirements (SOC2, ISO 27001, etc.), please conduct your own security assessment and implement additional controls as needed.
