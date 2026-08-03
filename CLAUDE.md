# CLAUDE.md - ContextSkeleton Project Guidelines

## Core Commands
- **Test Suite**: `npm test` (Runs node native test runner against `@context-skeleton/core`)
- **CLI Executable**: `node packages/cli/bin/context-skeleton.js scan .`
- **MCP Server**: `node packages/mcp-server/bin/mcp-server.js`

## Architecture Rules
- `@context-skeleton/core` MUST NOT rely on external paid APIs or server runtimes. All AST parsing and token estimation must execute 100% locally and offline.
- Always verify token savings percentage after modifying skeletonizer functions.
- Maintain syntax integrity for TypeScript, Python, Go, and C-style languages.
