/**
 * ContextSkeleton Model Context Protocol (MCP) Server Handler
 */

import { skeletonizeDirectory, indexSymbols, skeletonize } from '@context-skeleton/core';
import fs from 'fs';
import path from 'path';

export class MCPServerHandler {
  constructor(workspaceDir = process.cwd()) {
    this.workspaceDir = workspaceDir;
  }

  handleListTools() {
    return {
      tools: [
        {
          name: 'get_repo_skeleton',
          description: 'Generates a compressed AST code skeleton of the project repository to save 70-80% of LLM context window tokens while preserving exported signatures, methods, interfaces, and docstrings.',
          inputSchema: {
            type: 'object',
            properties: {
              directoryPath: {
                type: 'string',
                description: 'Absolute or relative path to target directory (defaults to workspace root)'
              }
            }
          }
        },
        {
          name: 'unfold_symbol',
          description: 'Retrieves the complete, unfolded implementation code of a specific function, class, or symbol from a target file.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Relative path to file'
              },
              symbolName: {
                type: 'string',
                description: 'Name of the function, class, or variable to unfold'
              }
            },
            required: ['filePath', 'symbolName']
          }
        },
        {
          name: 'get_token_savings',
          description: 'Calculates exact LLM token and cost savings achieved by ContextSkeleton on the current codebase.',
          inputSchema: {
            type: 'object',
            properties: {
              directoryPath: {
                type: 'string',
                description: 'Directory path to calculate savings for'
              }
            }
          }
        }
      ]
    };
  }

  handleCallTool(name, args) {
    const targetDir = args.directoryPath ? path.resolve(this.workspaceDir, args.directoryPath) : this.workspaceDir;

    switch (name) {
      case 'get_repo_skeleton': {
        const res = skeletonizeDirectory(targetDir);
        let content = `# Repo Context Skeleton: ${path.basename(targetDir)}\n`;
        content += `Metrics: ${res.metrics.percentageSaved}% Tokens Saved (${res.metrics.tokensSaved} tokens / $${res.metrics.dollarsSaved})\n\n`;

        for (const f of res.fileResults) {
          content += `### File: ${f.relativePath}\n\`\`\`\n${f.skeletonCode}\n\`\`\`\n\n`;
        }

        return {
          content: [
            {
              type: 'text',
              text: content
            }
          ]
        };
      }

      case 'unfold_symbol': {
        const fullPath = path.resolve(this.workspaceDir, args.filePath);
        if (!fs.existsSync(fullPath)) {
          return { content: [{ type: 'text', text: `Error: File not found: ${args.filePath}` }] };
        }

        const rawCode = fs.readFileSync(fullPath, 'utf8');
        const lines = rawCode.split('\n');
        const symbols = indexSymbols(rawCode, args.filePath);
        const match = symbols.find(s => s.name === args.symbolName);

        if (!match) {
          return { content: [{ type: 'text', text: `Symbol '${args.symbolName}' not found in ${args.filePath}. Available symbols: ${symbols.map(s => s.name).join(', ')}` }] };
        }

        // Extract context block around symbol
        const startLine = Math.max(0, match.line - 1);
        const endLine = Math.min(lines.length, match.line + 40);
        const snippet = lines.slice(startLine, endLine).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `### Unfolded Symbol: \`${args.symbolName}\` in \`${args.filePath}\` (Line ${match.line})\n\`\`\`\n${snippet}\n\`\`\``
            }
          ]
        };
      }

      case 'get_token_savings': {
        const res = skeletonizeDirectory(targetDir);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.metrics, null, 2)
            }
          ]
        };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  }
}
