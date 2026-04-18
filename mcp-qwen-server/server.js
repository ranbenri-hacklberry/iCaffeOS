#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

class QwenCoderServer {
  constructor() {
    this.server = new Server(
      {
        name: 'qwen-coder-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: OLLAMA_BASE_URL,
      timeout: 60000, // 60 seconds timeout for local model
    });

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'qwen_coder_chat',
          description: 'Send a chat message to Qwen Coder and get a response',
          inputSchema: {
            type: 'object',
            properties: {
              messages: {
                type: 'array',
                description: 'Array of chat messages',
                items: {
                  type: 'object',
                  properties: {
                    role: {
                      type: 'string',
                      enum: ['system', 'user', 'assistant'],
                      description: 'Role of the message sender'
                    },
                    content: {
                      type: 'string',
                      description: 'Content of the message'
                    }
                  },
                  required: ['role', 'content']
                }
              },
              model: {
                type: 'string',
                default: 'qwen2.5-coder:7b',
                description: 'Model to use for the chat'
              },
              temperature: {
                type: 'number',
                default: 0.7,
                description: 'Temperature for sampling'
              },
              max_tokens: {
                type: 'number',
                default: 2000,
                description: 'Maximum number of tokens to generate'
              }
            },
            required: ['messages']
          },
        },
        {
          name: 'qwen_coder_generate',
          description: 'Generate code using Qwen Coder with a prompt',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'The prompt to send to Qwen Coder'
              },
              model: {
                type: 'string',
                default: 'qwen2.5-coder:7b',
                description: 'Model to use for generation'
              },
              temperature: {
                type: 'number',
                default: 0.7,
                description: 'Temperature for sampling'
              },
              max_tokens: {
                type: 'number',
                default: 2000,
                description: 'Maximum number of tokens to generate'
              }
            },
            required: ['prompt']
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'qwen_coder_chat') {
        return await this.handleChat(args);
      } else if (name === 'qwen_coder_generate') {
        return await this.handleGenerate(args);
      } else {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
      }
    });
  }

  async handleChat(args) {
    const { messages, model = 'qwen2.5-coder:7b', temperature = 0.7, max_tokens = 2000 } = args;

    if (!messages || !Array.isArray(messages)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Messages array is required'
      );
    }

    try {
      const response = await this.axiosInstance.post('/api/chat', {
        model,
        messages,
        stream: false,
        options: {
          temperature,
          num_predict: max_tokens,
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: response.data.message?.content || response.data.response || 'No response',
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Qwen API error: ${error.response?.data?.error || error.message}`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

  async handleGenerate(args) {
    const { prompt, model = 'qwen2.5-coder:7b', temperature = 0.7, max_tokens = 2000 } = args;

    if (!prompt || typeof prompt !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Prompt string is required'
      );
    }

    try {
      const response = await this.axiosInstance.post('/api/generate', {
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          num_predict: max_tokens,
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: response.data.response || 'No response',
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Qwen API error: ${error.response?.data?.error || error.message}`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Qwen Coder MCP server running on stdio');
  }
}

const server = new QwenCoderServer();
server.run().catch(console.error);