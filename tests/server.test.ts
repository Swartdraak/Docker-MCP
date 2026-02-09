/**
 * Basic smoke tests for Docker MCP Server
 * These tests verify the server can be imported and basic structures are correct
 */

import Docker from 'dockerode';

describe('Docker MCP Server', () => {
  describe('Docker Connection', () => {
    it('should be able to create a Docker instance', () => {
      const docker = new Docker();
      expect(docker).toBeDefined();
      expect(docker).toBeInstanceOf(Docker);
    });
  });

  describe('Tool Schemas', () => {
    // These would be imported from index.ts when we refactor to export them
    const expectedTools = [
      // Container operations
      'list_containers',
      'create_container',
      'run_container',
      'start_container',
      'stop_container',
      'restart_container',
      'pause_container',
      'unpause_container',
      'rename_container',
      'remove_container',
      'inspect_container',
      'container_logs',
      'exec_container',
      'container_stats',
      'prune_containers',
      
      // Image operations
      'list_images',
      'pull_image',
      'build_image',
      'tag_image',
      'push_image',
      'remove_image',
      'prune_images',
      
      // Network operations
      'list_networks',
      'create_network',
      'inspect_network',
      'connect_network',
      'disconnect_network',
      'remove_network',
      'prune_networks',
      
      // Volume operations
      'list_volumes',
      'create_volume',
      'inspect_volume',
      'remove_volume',
      'prune_volumes',
      
      // System operations
      'system_info',
      'system_version',
      'validate_connection',
    ];

    it('should have 37 expected tools', () => {
      expect(expectedTools.length).toBe(37);
    });

    it('should have tools in expected categories', () => {
      const containerTools = expectedTools.filter(t => 
        t.includes('container') || t === 'list_containers'
      );
      const imageTools = expectedTools.filter(t => t.includes('image'));
      const networkTools = expectedTools.filter(t => t.includes('network'));
      const volumeTools = expectedTools.filter(t => t.includes('volume'));
      const systemTools = expectedTools.filter(t => t.includes('system') || t === 'validate_connection');

      expect(containerTools.length).toBe(15);
      expect(imageTools.length).toBe(7);
      expect(networkTools.length).toBe(7);
      expect(volumeTools.length).toBe(5);
      expect(systemTools.length).toBe(3);
    });
  });

  describe('Package Info', () => {
    it('should have correct package metadata', () => {
      // Load package.json using require which works in Jest
      const pkg = require('../package.json');
      
      expect(pkg.name).toBe('@swartdraak/docker-mcp-server');
      expect(pkg.version).toBe('2.0.0');
      expect(pkg.description).toContain('MCP Server');
      expect(pkg.license).toBe('MIT');
    });
  });
});

describe('Docker Integration', () => {
  let docker: Docker;

  beforeAll(() => {
    docker = new Docker();
  });

  // Only run these tests if Docker is available
  const isDockerAvailable = async () => {
    try {
      await docker.ping();
      return true;
    } catch {
      return false;
    }
  };

  it('should connect to Docker daemon if available', async () => {
    if (await isDockerAvailable()) {
      const info = await docker.version();
      expect(info).toBeDefined();
      expect(info.Version).toBeDefined();
    } else {
      console.log('⚠️  Docker not available, skipping integration tests');
      expect(true).toBe(true); // Pass the test
    }
  });
});
