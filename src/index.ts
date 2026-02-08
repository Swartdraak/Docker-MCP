#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import Docker from "dockerode";

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
    version: "1.0.0",
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
