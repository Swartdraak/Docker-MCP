#!/usr/bin/env node

/**
 * Docker MCP Connection Test Utility
 * 
 * This script helps you test and validate your Docker connection configuration
 * before using the MCP server. It checks connectivity, authentication, and
 * provides detailed diagnostic information.
 * 
 * Usage:
 *   node test-connection.js
 *   
 * Or with environment variables:
 *   DOCKER_HOST=tcp://192.168.1.100:2375 node test-connection.js
 *   DOCKER_HOST=https://192.168.1.100:2376 DOCKER_TLS_VERIFY=1 DOCKER_CERT_PATH=~/.docker/certs node test-connection.js
 */

import Docker from 'dockerode';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(`  ${title}`, colors.bright);
  log('='.repeat(60), colors.bright);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

/**
 * Parse and display current Docker configuration
 */
function displayConfiguration() {
  logSection('Docker Configuration');
  
  const dockerHost = process.env.DOCKER_HOST;
  const tlsVerify = process.env.DOCKER_TLS_VERIFY === '1' || process.env.DOCKER_TLS_VERIFY === 'true';
  const certPath = process.env.DOCKER_CERT_PATH;
  const dockerPort = process.env.DOCKER_PORT;

  if (!dockerHost) {
    logInfo('DOCKER_HOST: Not set (using default local socket)');
    if (process.platform === 'win32') {
      logInfo('  Default: npipe:////./pipe/docker_engine');
    } else {
      logInfo('  Default: /var/run/docker.sock');
    }
  } else {
    logInfo(`DOCKER_HOST: ${dockerHost}`);
  }

  logInfo(`DOCKER_TLS_VERIFY: ${tlsVerify ? 'Enabled' : 'Disabled'}`);
  
  if (certPath) {
    logInfo(`DOCKER_CERT_PATH: ${certPath}`);
  } else {
    logInfo('DOCKER_CERT_PATH: Not set');
  }

  if (dockerPort) {
    logInfo(`DOCKER_PORT: ${dockerPort}`);
  }
}

/**
 * Validate TLS certificate files
 */
function validateCertificates(certPath) {
  logSection('TLS Certificate Validation');
  
  if (!certPath) {
    logWarning('No certificate path specified');
    return false;
  }

  const homeDir = process.env.HOME || process.env.USERPROFILE;
  let expandedPath = certPath;
  if (certPath.startsWith('~')) {
    if (homeDir) {
      expandedPath = certPath.replace(/^~/, homeDir);
    } else {
      logWarning('Certificate path starts with "~" but HOME/USERPROFILE is not set; using literal path without expansion');
    }
  }
  const resolvedPath = resolve(expandedPath);
  
  logInfo(`Certificate directory: ${resolvedPath}`);

  const requiredFiles = ['ca.pem', 'cert.pem', 'key.pem'];
  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = resolve(resolvedPath, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        logSuccess(`${file}: Found (${lines} lines)`);
      } catch (error) {
        logError(`${file}: Cannot read file - ${error.message}`);
        allFilesExist = false;
      }
    } else {
      logError(`${file}: Not found at ${filePath}`);
      allFilesExist = false;
    }
  }

  return allFilesExist;
}

/**
 * Initialize Docker client with current configuration
 */
function initializeDockerClient() {
  const dockerHost = process.env.DOCKER_HOST;
  const tlsVerify = process.env.DOCKER_TLS_VERIFY === '1' || process.env.DOCKER_TLS_VERIFY === 'true';
  const certPath = process.env.DOCKER_CERT_PATH;
  const dockerPort = process.env.DOCKER_PORT;

  // Fail fast if TLS verification is requested but no certificate path is provided
  if (tlsVerify && !certPath) {
    throw new Error(
      "DOCKER_TLS_VERIFY is set but DOCKER_CERT_PATH is not configured. " +
      "Set DOCKER_CERT_PATH to the directory containing ca.pem, cert.pem, and key.pem."
    );
  }

  // If no DOCKER_HOST is specified, use default (local socket)
  if (!dockerHost) {
    return new Docker();
  }

  // Parse DOCKER_HOST URL
  let protocol = 'http';
  let host;
  let portFromUrl;

  if (dockerHost.startsWith('unix://')) {
    // Unix socket
    return new Docker({ socketPath: dockerHost.replace('unix://', '') });
  } else if (dockerHost.startsWith('npipe://')) {
    // Windows named pipe
    return new Docker({ socketPath: dockerHost });
  } else if (dockerHost.startsWith('tcp://')) {
    const url = dockerHost.replace('tcp://', '');
    const parts = url.split(':');
    host = parts[0];
    if (parts[1]) portFromUrl = parseInt(parts[1], 10);
  } else if (dockerHost.startsWith('http://')) {
    protocol = 'http';
    const url = dockerHost.replace('http://', '');
    const parts = url.split(':');
    host = parts[0];
    if (parts[1]) portFromUrl = parseInt(parts[1], 10);
  } else if (dockerHost.startsWith('https://')) {
    protocol = 'https';
    const url = dockerHost.replace('https://', '');
    const parts = url.split(':');
    host = parts[0];
    if (parts[1]) portFromUrl = parseInt(parts[1], 10);
  } else {
    const parts = dockerHost.split(':');
    host = parts[0];
    if (parts[1]) portFromUrl = parseInt(parts[1], 10);
  }

  // Determine port
  let port;
  if (dockerPort) {
    port = parseInt(dockerPort, 10);
  } else if (portFromUrl) {
    port = portFromUrl;
  } else {
    port = (protocol === 'https' || tlsVerify) ? 2376 : 2375;
  }

  // Build Docker options
  const dockerOptions = {
    host,
    port,
  };

  // Add TLS/HTTPS support
  if (tlsVerify && certPath) {
    dockerOptions.protocol = 'https';
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    let expandedPath = certPath;
    if (certPath.startsWith('~')) {
      if (homeDir) {
        expandedPath = certPath.replace(/^~/, homeDir);
      } else {
        throw new Error(
          'Certificate path starts with "~" but HOME/USERPROFILE is not set. ' +
          'Please use an absolute path or set the HOME/USERPROFILE environment variable.'
        );
      }
    }
    try {
      dockerOptions.ca = readFileSync(join(expandedPath, 'ca.pem'));
      dockerOptions.cert = readFileSync(join(expandedPath, 'cert.pem'));
      dockerOptions.key = readFileSync(join(expandedPath, 'key.pem'));
    } catch (error) {
      throw new Error(
        `Failed to load TLS certificates from ${expandedPath}. ` +
        `Ensure ca.pem, cert.pem, and key.pem exist and are readable. ` +
        `Error: ${error.message}`
      );
    }
  } else if (protocol === 'https') {
    dockerOptions.protocol = 'https';
    if (certPath) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      let expandedPath = certPath;
      if (certPath.startsWith('~')) {
        if (homeDir) {
          expandedPath = certPath.replace(/^~/, homeDir);
        } else {
          logWarning('Certificate path starts with "~" but HOME/USERPROFILE is not set; skipping certificate loading');
          return new Docker(dockerOptions);
        }
      }
      try {
        dockerOptions.ca = readFileSync(join(expandedPath, 'ca.pem'));
        dockerOptions.cert = readFileSync(join(expandedPath, 'cert.pem'));
        dockerOptions.key = readFileSync(join(expandedPath, 'key.pem'));
      } catch (error) {
        // Non-fatal for HTTPS without explicit TLS verification
        logWarning(`Could not load certificates: ${error.message}`);
      }
    }
  } else {
    dockerOptions.protocol = protocol;
  }

  return new Docker(dockerOptions);
}

/**
 * Test Docker connection and retrieve version information
 */
async function testConnection(docker) {
  logSection('Connection Test');
  
  try {
    logInfo('Attempting to connect to Docker daemon...');
    const version = await docker.version();
    logSuccess('Successfully connected to Docker daemon!');
    
    log('\nDocker Version Information:', colors.bright);
    logInfo(`  Version: ${version.Version}`);
    logInfo(`  API Version: ${version.ApiVersion}`);
    logInfo(`  Platform: ${version.Os}/${version.Arch}`);
    logInfo(`  Git Commit: ${version.GitCommit}`);
    logInfo(`  Build Time: ${version.BuildTime}`);
    
    return true;
  } catch (error) {
    logError(`Failed to connect: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      logWarning('Connection refused - is Docker daemon running?');
    } else if (error.code === 'ENOTFOUND') {
      logWarning('Host not found - check DOCKER_HOST address');
    } else if (error.code === 'ETIMEDOUT') {
      logWarning('Connection timed out - check network and firewall settings');
    } else if (error.message.includes('certificate')) {
      logWarning('Certificate error - verify TLS certificate configuration');
    }
    
    return false;
  }
}

/**
 * Test Docker operations
 */
async function testOperations(docker) {
  logSection('Docker Operations Test');
  
  try {
    // Test listing containers
    logInfo('Testing: List containers...');
    const containers = await docker.listContainers({ all: true });
    logSuccess(`Found ${containers.length} container(s)`);
    
    // Test listing images
    logInfo('Testing: List images...');
    const images = await docker.listImages();
    logSuccess(`Found ${images.length} image(s)`);
    
    // Test listing networks
    logInfo('Testing: List networks...');
    const networks = await docker.listNetworks();
    logSuccess(`Found ${networks.length} network(s)`);
    
    // Test listing volumes
    logInfo('Testing: List volumes...');
    const volumeData = await docker.listVolumes();
    const volumeCount = volumeData.Volumes ? volumeData.Volumes.length : 0;
    logSuccess(`Found ${volumeCount} volume(s)`);
    
    // Test system info
    logInfo('Testing: Get system info...');
    const info = await docker.info();
    logSuccess('System info retrieved');
    log('\nSystem Information:', colors.bright);
    logInfo(`  Containers: ${info.Containers} (${info.ContainersRunning} running)`);
    logInfo(`  Images: ${info.Images}`);
    logInfo(`  Server Version: ${info.ServerVersion}`);
    logInfo(`  Operating System: ${info.OperatingSystem}`);
    logInfo(`  Architecture: ${info.Architecture}`);
    logInfo(`  CPUs: ${info.NCPU}`);
    logInfo(`  Total Memory: ${(info.MemTotal / (1024 ** 3)).toFixed(2)} GB`);
    
    return true;
  } catch (error) {
    logError(`Operation failed: ${error.message}`);
    return false;
  }
}

/**
 * Provide recommendations based on test results
 */
function provideRecommendations(connectionSuccess, operationsSuccess) {
  logSection('Recommendations');
  
  if (connectionSuccess && operationsSuccess) {
    logSuccess('All tests passed! Your Docker connection is working correctly.');
    log('\nYou can now use this configuration with Docker MCP Server:', colors.bright);
    logInfo('  npm run build');
    logInfo('  npm start');
    return;
  }

  if (!connectionSuccess) {
    log('\nConnection Issues - Possible Solutions:', colors.yellow);
    log('');
    log('1. Local Docker:', colors.bright);
    logInfo('   - Ensure Docker Desktop/daemon is running');
    logInfo('   - Check Docker socket permissions (Linux: add user to docker group)');
    log('');
    log('2. Remote Docker (TCP):', colors.bright);
    logInfo('   - Verify DOCKER_HOST is correct: tcp://hostname:2375');
    logInfo('   - Ensure Docker daemon is configured to listen on TCP');
    logInfo('   - Check firewall rules allow connection to port 2375/2376');
    logInfo('   - Try: telnet hostname 2375');
    log('');
    log('3. Remote Docker (TLS):', colors.bright);
    logInfo('   - Verify DOCKER_HOST uses https://: https://hostname:2376');
    logInfo('   - Set DOCKER_TLS_VERIFY=1');
    logInfo('   - Set DOCKER_CERT_PATH to directory with ca.pem, cert.pem, key.pem');
    logInfo('   - Ensure certificates are valid and match the server');
    log('');
    log('4. SSH Tunnel:', colors.bright);
    logInfo('   - Establish SSH tunnel first:');
    logInfo('     ssh -NL localhost:2375:/var/run/docker.sock user@remote-host');
    logInfo('   - Then set: DOCKER_HOST=tcp://localhost:2375');
  } else if (!operationsSuccess) {
    log('\nDocker Operations Failed:', colors.yellow);
    logInfo('  - Connection established but operations failed');
    logInfo('  - Check Docker daemon logs for errors');
    logInfo('  - Verify user has permission to perform Docker operations');
  }
  
  log('\nFor more help, see:', colors.bright);
  logInfo('  - CONFIGURATION.md - Setup examples');
  logInfo('  - REMOTE_SETUP.md - Detailed remote setup guide');
  logInfo('  - GitHub Issues: https://github.com/Swartdraak/Docker-MCP/issues');
}

/**
 * Main test function
 */
async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.bright);
  log('║      Docker MCP Connection Test Utility v1.0              ║', colors.bright);
  log('╚════════════════════════════════════════════════════════════╝', colors.bright);

  displayConfiguration();

  // Validate certificates if TLS is enabled
  const tlsVerify = process.env.DOCKER_TLS_VERIFY === '1' || process.env.DOCKER_TLS_VERIFY === 'true';
  if (tlsVerify || process.env.DOCKER_CERT_PATH) {
    validateCertificates(process.env.DOCKER_CERT_PATH);
  }

  // Initialize Docker client
  let docker;
  try {
    logSection('Docker Client Initialization');
    docker = initializeDockerClient();
    logSuccess('Docker client initialized successfully');
  } catch (error) {
    logError(`Failed to initialize Docker client: ${error.message}`);
    provideRecommendations(false, false);
    process.exit(1);
  }

  // Test connection
  const connectionSuccess = await testConnection(docker);
  
  // Test operations if connection succeeded
  let operationsSuccess = false;
  if (connectionSuccess) {
    operationsSuccess = await testOperations(docker);
  }

  // Provide recommendations
  provideRecommendations(connectionSuccess, operationsSuccess);

  // Exit with appropriate code
  process.exit(connectionSuccess && operationsSuccess ? 0 : 1);
}

// Run the test
main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
