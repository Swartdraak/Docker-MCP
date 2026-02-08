#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import Docker from "dockerode";
import tarFs from "tar-fs";

const docker = new Docker();

// Define proper input schemas for tools
const TOOL_SCHEMAS = {
  list_containers: {
    name: "list_containers",
    description: "List all Docker containers",
    inputSchema: {
      type: "object",
      properties: {
        all: {
          type: "boolean",
          description: "Show all containers (default shows just running)",
          default: false,
        },
      },
    },
  },
  list_images: {
    name: "list_images",
    description: "List Docker images",
    inputSchema: {
      type: "object",
      properties: {
        all: {
          type: "boolean",
          description: "Show all images (default hides intermediate)",
          default: false,
        },
      },
    },
  },
  create_container: {
    name: "create_container",
    description: "Create a new Docker container",
    inputSchema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          description: "Docker image name (e.g., 'nginx:latest')",
        },
        name: {
          type: "string",
          description: "Container name",
        },
        command: {
          type: "array",
          items: { type: "string" },
          description:
            "Command to run as an array (e.g., ['python', 'app.py'])",
        },
        entrypoint: {
          type: "array",
          items: { type: "string" },
          description: "Entrypoint as an array (e.g., ['/bin/bash', '-c'])",
        },
        env: {
          type: "array",
          items: { type: "string" },
          description:
            "Environment variables as array of KEY=VALUE strings (e.g., ['NODE_ENV=production', 'PORT=3000'])",
        },
        exposedPorts: {
          type: "object",
          description:
            "Exposed ports as object with port/protocol keys (e.g., {'80/tcp': {}, '443/tcp': {}})",
        },
        hostConfig: {
          type: "object",
          description: "Host configuration including port bindings and volumes",
          properties: {
            PortBindings: {
              type: "object",
              description:
                "Port bindings (e.g., {'80/tcp': [{'HostPort': '8080'}]})",
            },
            Binds: {
              type: "array",
              items: { type: "string" },
              description:
                "Volume bindings as array (e.g., ['/host/path:/container/path'])",
            },
          },
        },
        labels: {
          type: "object",
          description: "Container labels as key-value pairs",
        },
      },
      required: ["image"],
    },
  },
  run_container: {
    name: "run_container",
    description:
      "Run a container (create and start). This is the preferred method for starting containers.",
    inputSchema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          description: "Docker image name (e.g., 'nginx:latest')",
        },
        name: {
          type: "string",
          description: "Container name",
        },
        command: {
          type: "array",
          items: { type: "string" },
          description:
            "Command to run as an array (e.g., ['python', 'app.py'])",
        },
        entrypoint: {
          type: "array",
          items: { type: "string" },
          description: "Entrypoint as an array (e.g., ['/bin/bash', '-c'])",
        },
        env: {
          type: "array",
          items: { type: "string" },
          description:
            "Environment variables as array of KEY=VALUE strings (e.g., ['NODE_ENV=production', 'PORT=3000'])",
        },
        exposedPorts: {
          type: "object",
          description:
            "Exposed ports as object with port/protocol keys (e.g., {'80/tcp': {}, '443/tcp': {}})",
        },
        hostConfig: {
          type: "object",
          description: "Host configuration including port bindings and volumes",
          properties: {
            PortBindings: {
              type: "object",
              description:
                "Port bindings (e.g., {'80/tcp': [{'HostPort': '8080'}]})",
            },
            Binds: {
              type: "array",
              items: { type: "string" },
              description:
                "Volume bindings as array (e.g., ['/host/path:/container/path'])",
            },
          },
        },
        labels: {
          type: "object",
          description: "Container labels as key-value pairs",
        },
      },
      required: ["image"],
    },
  },
  start_container: {
    name: "start_container",
    description: "Start a stopped Docker container",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
      },
      required: ["containerId"],
    },
  },
  stop_container: {
    name: "stop_container",
    description: "Stop a running Docker container",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
        timeout: {
          type: "number",
          description: "Seconds to wait before killing the container",
          default: 10,
        },
      },
      required: ["containerId"],
    },
  },
  remove_container: {
    name: "remove_container",
    description: "Remove a Docker container",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
        force: {
          type: "boolean",
          description: "Force removal of running container",
          default: false,
        },
        volumes: {
          type: "boolean",
          description: "Remove associated volumes",
          default: false,
        },
      },
      required: ["containerId"],
    },
  },
  inspect_container: {
    name: "inspect_container",
    description: "Get detailed information about a container",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
      },
      required: ["containerId"],
    },
  },
  container_logs: {
    name: "container_logs",
    description: "Get logs from a container",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
        tail: {
          type: "number",
          description: "Number of lines to show from the end of the logs",
          default: 100,
        },
        follow: {
          type: "boolean",
          description: "Follow log output",
          default: false,
        },
      },
      required: ["containerId"],
    },
  },
  pull_image: {
    name: "pull_image",
    description: "Pull a Docker image from a registry",
    inputSchema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          description: "Image name with optional tag (e.g., 'nginx:latest')",
        },
      },
      required: ["image"],
    },
  },
  list_networks: {
    name: "list_networks",
    description: "List Docker networks",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  list_volumes: {
    name: "list_volumes",
    description: "List Docker volumes",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  exec_container: {
    name: "exec_container",
    description: "Execute a command in a running container",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
        command: {
          type: "array",
          items: { type: "string" },
          description: "Command to execute as an array (e.g., ['ls', '-la', '/app'])",
        },
        workingDir: {
          type: "string",
          description: "Working directory for the command",
        },
        env: {
          type: "array",
          items: { type: "string" },
          description: "Environment variables as array of KEY=VALUE strings",
        },
      },
      required: ["containerId", "command"],
    },
  },
  container_stats: {
    name: "container_stats",
    description: "Get real-time resource usage statistics for a container (CPU, memory, network, I/O)",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
        stream: {
          type: "boolean",
          description: "Stream stats continuously",
          default: false,
        },
      },
      required: ["containerId"],
    },
  },
  restart_container: {
    name: "restart_container",
    description: "Restart a Docker container",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
        timeout: {
          type: "number",
          description: "Seconds to wait before killing the container",
          default: 10,
        },
      },
      required: ["containerId"],
    },
  },
  pause_container: {
    name: "pause_container",
    description: "Pause all processes within a container",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
      },
      required: ["containerId"],
    },
  },
  unpause_container: {
    name: "unpause_container",
    description: "Unpause all processes within a container",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
      },
      required: ["containerId"],
    },
  },
  rename_container: {
    name: "rename_container",
    description: "Rename a Docker container",
    inputSchema: {
      type: "object",
      properties: {
        containerId: {
          type: "string",
          description: "Container ID or current name",
        },
        newName: {
          type: "string",
          description: "New name for the container",
        },
      },
      required: ["containerId", "newName"],
    },
  },
  build_image: {
    name: "build_image",
    description: "Build a Docker image from a Dockerfile",
    inputSchema: {
      type: "object",
      properties: {
        context: {
          type: "string",
          description: "Path to the build context directory",
        },
        dockerfile: {
          type: "string",
          description: "Path to the Dockerfile (relative to context)",
          default: "Dockerfile",
        },
        tag: {
          type: "string",
          description: "Name and optionally tag in 'name:tag' format",
        },
        buildArgs: {
          type: "object",
          description: "Build-time variables as key-value pairs",
        },
      },
      required: ["context", "tag"],
    },
  },
  tag_image: {
    name: "tag_image",
    description: "Tag an image with a new name/tag",
    inputSchema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          description: "Source image name or ID",
        },
        repo: {
          type: "string",
          description: "Repository name for the tag",
        },
        tag: {
          type: "string",
          description: "Tag name (e.g., 'latest', 'v1.0')",
          default: "latest",
        },
      },
      required: ["image", "repo"],
    },
  },
  remove_image: {
    name: "remove_image",
    description: "Remove a Docker image",
    inputSchema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          description: "Image name or ID",
        },
        force: {
          type: "boolean",
          description: "Force removal of the image",
          default: false,
        },
      },
      required: ["image"],
    },
  },
  push_image: {
    name: "push_image",
    description: "Push an image to a Docker registry",
    inputSchema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          description: "Image name with optional tag (e.g., 'myrepo/myimage:latest')",
        },
      },
      required: ["image"],
    },
  },
  create_network: {
    name: "create_network",
    description: "Create a Docker network",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Network name",
        },
        driver: {
          type: "string",
          description: "Network driver (bridge, overlay, host, etc.)",
          default: "bridge",
        },
        internal: {
          type: "boolean",
          description: "Restrict external access to the network",
          default: false,
        },
      },
      required: ["name"],
    },
  },
  remove_network: {
    name: "remove_network",
    description: "Remove a Docker network",
    inputSchema: {
      type: "object",
      properties: {
        networkId: {
          type: "string",
          description: "Network ID or name",
        },
      },
      required: ["networkId"],
    },
  },
  connect_network: {
    name: "connect_network",
    description: "Connect a container to a network",
    inputSchema: {
      type: "object",
      properties: {
        networkId: {
          type: "string",
          description: "Network ID or name",
        },
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
      },
      required: ["networkId", "containerId"],
    },
  },
  disconnect_network: {
    name: "disconnect_network",
    description: "Disconnect a container from a network",
    inputSchema: {
      type: "object",
      properties: {
        networkId: {
          type: "string",
          description: "Network ID or name",
        },
        containerId: {
          type: "string",
          description: "Container ID or name",
        },
        force: {
          type: "boolean",
          description: "Force disconnect",
          default: false,
        },
      },
      required: ["networkId", "containerId"],
    },
  },
  inspect_network: {
    name: "inspect_network",
    description: "Get detailed information about a network",
    inputSchema: {
      type: "object",
      properties: {
        networkId: {
          type: "string",
          description: "Network ID or name",
        },
      },
      required: ["networkId"],
    },
  },
  create_volume: {
    name: "create_volume",
    description: "Create a Docker volume",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Volume name",
        },
        driver: {
          type: "string",
          description: "Volume driver",
          default: "local",
        },
        labels: {
          type: "object",
          description: "Labels as key-value pairs",
        },
      },
      required: ["name"],
    },
  },
  remove_volume: {
    name: "remove_volume",
    description: "Remove a Docker volume",
    inputSchema: {
      type: "object",
      properties: {
        volumeName: {
          type: "string",
          description: "Volume name",
        },
        force: {
          type: "boolean",
          description: "Force removal",
          default: false,
        },
      },
      required: ["volumeName"],
    },
  },
  inspect_volume: {
    name: "inspect_volume",
    description: "Get detailed information about a volume",
    inputSchema: {
      type: "object",
      properties: {
        volumeName: {
          type: "string",
          description: "Volume name",
        },
      },
      required: ["volumeName"],
    },
  },
  prune_images: {
    name: "prune_images",
    description: "Remove unused images",
    inputSchema: {
      type: "object",
      properties: {
        all: {
          type: "boolean",
          description: "Remove all unused images, not just dangling ones",
          default: false,
        },
      },
    },
  },
  prune_containers: {
    name: "prune_containers",
    description: "Remove all stopped containers",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  prune_volumes: {
    name: "prune_volumes",
    description: "Remove all unused volumes",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  prune_networks: {
    name: "prune_networks",
    description: "Remove all unused networks",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  system_info: {
    name: "system_info",
    description: "Get Docker system information",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  system_version: {
    name: "system_version",
    description: "Get Docker version information",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
};

// Helper function to format container info
function formatContainerInfo(container: any) {
  return {
    id: container.Id,
    name: container.Names ? container.Names[0] : container.Name,
    image: container.Image,
    state: container.State,
    status: container.Status,
    ports: container.Ports,
    created: container.Created,
  };
}

// Helper function to format image info
function formatImageInfo(image: any) {
  return {
    id: image.Id,
    repoTags: image.RepoTags || [],
    created: image.Created,
    size: image.Size,
    virtualSize: image.VirtualSize,
  };
}

const server = new Server(
  {
    name: "docker-mcp-server",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(TOOL_SCHEMAS) as Tool[],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_containers": {
        const all = (args?.all as boolean) || false;
        const containers = await docker.listContainers({ all: all });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                containers.map(formatContainerInfo),
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_images": {
        const all = (args?.all as boolean) || false;
        const images = await docker.listImages({ all: all });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(images.map(formatImageInfo), null, 2),
            },
          ],
        };
      }

      case "create_container": {
        if (!args?.image) {
          throw new Error("Image name is required");
        }

        // Build container creation options with proper array handling
        const createOptions: Docker.ContainerCreateOptions = {
          Image: args.image as string,
          name: args.name as string | undefined,
          Cmd: args.command as string[] | undefined,
          Entrypoint: args.entrypoint as string[] | undefined,
          Env: args.env as string[] | undefined,
          ExposedPorts: args.exposedPorts as { [port: string]: {} } | undefined,
          HostConfig: args.hostConfig as Docker.ContainerCreateOptions['HostConfig'] | undefined,
          Labels: args.labels as { [label: string]: string } | undefined,
        };

        const container = await docker.createContainer(createOptions);
        const info = await container.inspect();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: info.Id,
                  name: info.Name,
                  image: info.Config.Image,
                  state: info.State?.Status,
                  created: info.Created,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "run_container": {
        if (!args?.image) {
          throw new Error("Image name is required");
        }

        // Build container creation options with proper array handling
        const createOptions: Docker.ContainerCreateOptions = {
          Image: args.image as string,
          name: args.name as string | undefined,
          Cmd: args.command as string[] | undefined,
          Entrypoint: args.entrypoint as string[] | undefined,
          Env: args.env as string[] | undefined,
          ExposedPorts: args.exposedPorts as { [port: string]: {} } | undefined,
          HostConfig: args.hostConfig as Docker.ContainerCreateOptions['HostConfig'] | undefined,
          Labels: args.labels as { [label: string]: string } | undefined,
        };

        const container = await docker.createContainer(createOptions);
        await container.start();
        const info = await container.inspect();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: info.Id,
                  name: info.Name,
                  image: info.Config.Image,
                  state: info.State?.Status,
                  created: info.Created,
                  ports: info.NetworkSettings?.Ports,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "start_container": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const container = docker.getContainer(args.containerId as string);
        await container.start();
        const info = await container.inspect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: info.Id,
                  name: info.Name,
                  state: info.State?.Status,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "stop_container": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const container = docker.getContainer(args.containerId as string);
        const timeout = (args?.timeout as number) || 10;
        await container.stop({ t: timeout });
        const info = await container.inspect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: info.Id,
                  name: info.Name,
                  state: info.State?.Status,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "remove_container": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const container = docker.getContainer(args.containerId as string);
        await container.remove({
          force: (args?.force as boolean) || false,
          v: (args?.volumes as boolean) || false,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "removed",
                  containerId: args.containerId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "inspect_container": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const container = docker.getContainer(args.containerId as string);
        const info = await container.inspect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case "container_logs": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const container = docker.getContainer(args.containerId as string);
        const tail = (args?.tail as number) || 100;
        const follow = (args?.follow as boolean) || false;
        
        // Type-safe log fetching
        if (follow) {
          await container.logs({
            stdout: true,
            stderr: true,
            tail: tail,
            follow: true,
          });
          return {
            content: [
              {
                type: "text",
                text: "Following logs... (stream)",
              },
            ],
          };
        } else {
          const logs = await container.logs({
            stdout: true,
            stderr: true,
            tail: tail,
            follow: false,
          });
          return {
            content: [
              {
                type: "text",
                text: logs.toString(),
              },
            ],
          };
        }
      }

      case "pull_image": {
        if (!args?.image) {
          throw new Error("Image name is required");
        }

        return new Promise((resolve, reject) => {
          docker.pull(args.image as string, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) {
              reject(err);
              return;
            }

            const onFinished = (err: Error | null, output: any[]) => {
              if (err) {
                reject(err);
                return;
              }
              resolve({
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(
                      {
                        status: "pulled",
                        image: args.image,
                      },
                      null,
                      2
                    ),
                  },
                ],
              });
            };

            docker.modem.followProgress(stream, onFinished);
          });
        });
      }

      case "list_networks": {
        const networks = await docker.listNetworks();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                networks.map((n) => ({
                  id: n.Id,
                  name: n.Name,
                  driver: n.Driver,
                  scope: n.Scope,
                })),
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_volumes": {
        const result = await docker.listVolumes();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                result.Volumes.map((v) => ({
                  name: v.Name,
                  driver: v.Driver,
                  mountpoint: v.Mountpoint,
                })),
                null,
                2
              ),
            },
          ],
        };
      }

      case "exec_container": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        if (!args?.command || !Array.isArray(args.command)) {
          throw new Error("Command array is required");
        }
        const container = docker.getContainer(args.containerId as string);
        const exec = await container.exec({
          Cmd: args.command as string[],
          AttachStdout: true,
          AttachStderr: true,
          WorkingDir: args.workingDir as string | undefined,
          Env: args.env as string[] | undefined,
        });
        const stream = await exec.start({ Detach: false });
        
        // Collect output
        let output = "";
        stream.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        
        await new Promise((resolve) => stream.on("end", resolve));
        
        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      }

      case "container_stats": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const container = docker.getContainer(args.containerId as string);
        
        const stats = await container.stats({ stream: false });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      case "restart_container": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const container = docker.getContainer(args.containerId as string);
        const timeout = (args?.timeout as number) || 10;
        await container.restart({ t: timeout });
        const info = await container.inspect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: info.Id,
                  name: info.Name,
                  state: info.State?.Status,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "pause_container": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const container = docker.getContainer(args.containerId as string);
        await container.pause();
        const info = await container.inspect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: info.Id,
                  name: info.Name,
                  state: info.State?.Status,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "unpause_container": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const container = docker.getContainer(args.containerId as string);
        await container.unpause();
        const info = await container.inspect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: info.Id,
                  name: info.Name,
                  state: info.State?.Status,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "rename_container": {
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        if (!args?.newName) {
          throw new Error("New name is required");
        }
        const container = docker.getContainer(args.containerId as string);
        await container.rename({ name: args.newName as string });
        const info = await container.inspect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: info.Id,
                  name: info.Name,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "build_image": {
        if (!args?.context) {
          throw new Error("Build context is required");
        }
        if (!args?.tag) {
          throw new Error("Tag is required");
        }
        
        const tarStream = tarFs.pack(args.context as string);
        const stream = await docker.buildImage(tarStream, {
          t: args.tag as string,
          dockerfile: (args.dockerfile as string) || "Dockerfile",
          buildargs: args.buildArgs as { [key: string]: string } | undefined,
        });

        return new Promise((resolve, reject) => {
          const onFinished = (err: Error | null, output: any[]) => {
            if (err) {
              reject(err);
              return;
            }
            resolve({
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      status: "built",
                      tag: args.tag,
                    },
                    null,
                    2
                  ),
                },
              ],
            });
          };
          docker.modem.followProgress(stream, onFinished);
        });
      }

      case "tag_image": {
        if (!args?.image) {
          throw new Error("Image is required");
        }
        if (!args?.repo) {
          throw new Error("Repository is required");
        }
        const image = docker.getImage(args.image as string);
        await image.tag({
          repo: args.repo as string,
          tag: (args.tag as string) || "latest",
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "tagged",
                  image: args.image,
                  repo: args.repo,
                  tag: args.tag || "latest",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "remove_image": {
        if (!args?.image) {
          throw new Error("Image is required");
        }
        const image = docker.getImage(args.image as string);
        await image.remove({ force: (args?.force as boolean) || false });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "removed",
                  image: args.image,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "push_image": {
        if (!args?.image) {
          throw new Error("Image is required");
        }
        const image = docker.getImage(args.image as string);
        const stream = await image.push();
        
        return new Promise((resolve, reject) => {
          const onFinished = (err: Error | null, output: any[]) => {
            if (err) {
              reject(err);
              return;
            }
            resolve({
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      status: "pushed",
                      image: args.image,
                    },
                    null,
                    2
                  ),
                },
              ],
            });
          };
          docker.modem.followProgress(stream, onFinished);
        });
      }

      case "create_network": {
        if (!args?.name) {
          throw new Error("Network name is required");
        }
        const network = await docker.createNetwork({
          Name: args.name as string,
          Driver: (args.driver as string) || "bridge",
          Internal: (args.internal as boolean) || false,
        });
        const info = await network.inspect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: info.Id,
                  name: info.Name,
                  driver: info.Driver,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "remove_network": {
        if (!args?.networkId) {
          throw new Error("Network ID is required");
        }
        const network = docker.getNetwork(args.networkId as string);
        await network.remove();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "removed",
                  networkId: args.networkId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "connect_network": {
        if (!args?.networkId) {
          throw new Error("Network ID is required");
        }
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const network = docker.getNetwork(args.networkId as string);
        await network.connect({
          Container: args.containerId as string,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "connected",
                  networkId: args.networkId,
                  containerId: args.containerId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "disconnect_network": {
        if (!args?.networkId) {
          throw new Error("Network ID is required");
        }
        if (!args?.containerId) {
          throw new Error("Container ID is required");
        }
        const network = docker.getNetwork(args.networkId as string);
        await network.disconnect({
          Container: args.containerId as string,
          Force: (args.force as boolean) || false,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "disconnected",
                  networkId: args.networkId,
                  containerId: args.containerId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "inspect_network": {
        if (!args?.networkId) {
          throw new Error("Network ID is required");
        }
        const network = docker.getNetwork(args.networkId as string);
        const info = await network.inspect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case "create_volume": {
        if (!args?.name) {
          throw new Error("Volume name is required");
        }
        const volume = await docker.createVolume({
          Name: args.name as string,
          Driver: (args.driver as string) || "local",
          Labels: args.labels as { [key: string]: string } | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  name: volume.Name,
                  driver: volume.Driver,
                  mountpoint: volume.Mountpoint,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "remove_volume": {
        if (!args?.volumeName) {
          throw new Error("Volume name is required");
        }
        const volume = docker.getVolume(args.volumeName as string);
        await volume.remove({ force: (args.force as boolean) || false });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "removed",
                  volumeName: args.volumeName,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "inspect_volume": {
        if (!args?.volumeName) {
          throw new Error("Volume name is required");
        }
        const volume = docker.getVolume(args.volumeName as string);
        const info = await volume.inspect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case "prune_images": {
        const result = await docker.pruneImages({
          filters: { dangling: { [(args?.all as boolean) ? "false" : "true"]: true } },
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "pruned",
                  imagesDeleted: result.ImagesDeleted?.length || 0,
                  spaceReclaimed: result.SpaceReclaimed,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "prune_containers": {
        const result = await docker.pruneContainers();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "pruned",
                  containersDeleted: result.ContainersDeleted?.length || 0,
                  spaceReclaimed: result.SpaceReclaimed,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "prune_volumes": {
        const result = await docker.pruneVolumes();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "pruned",
                  volumesDeleted: result.VolumesDeleted?.length || 0,
                  spaceReclaimed: result.SpaceReclaimed,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "prune_networks": {
        const result = await docker.pruneNetworks();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "pruned",
                  networksDeleted: result.NetworksDeleted?.length || 0,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "system_info": {
        const info = await docker.info();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case "system_version": {
        const version = await docker.version();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(version, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Docker MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
