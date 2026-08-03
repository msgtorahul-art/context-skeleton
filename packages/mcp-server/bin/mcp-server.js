#!/usr/bin/env node

/**
 * ContextSkeleton MCP Stdio JSON-RPC Server
 */

import { MCPServerHandler } from '../src/index.js';

const handler = new MCPServerHandler(process.cwd());

process.stdin.on('data', (chunk) => {
  const lines = chunk.toString().split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      if (msg.method === 'tools/list') {
        const response = {
          jsonrpc: '2.0',
          id: msg.id,
          result: handler.handleListTools()
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } else if (msg.method === 'tools/call') {
        const result = handler.handleCallTool(msg.params.name, msg.params.arguments || {});
        const response = {
          jsonrpc: '2.0',
          id: msg.id,
          result
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch {
      // Ignore invalid frames
    }
  }
});
