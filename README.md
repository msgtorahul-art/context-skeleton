# ⚡ ContextSkeleton

> **Zero-latency Structural Code Folding CLI, Model Context Protocol (MCP) Server & Token Optimizer for AI Agents (Cursor, Claude Code, Windsurf, AGY).**

[![ContextSkeleton](https://img.shields.io/badge/%E2%9A%A1_ContextSkeleton-67%25_Blended_Savings-00f2fe?style=flat-square)](https://github.com/msgtorahul-art/context-skeleton)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ContextSkeleton folds function and class implementations while preserving top-level signatures, interface definitions, exported types, and docstrings across JavaScript, TypeScript, Python, Go, and C-style languages.

Token reduction scales with function size and implementation depth — typically 0% on trivial 1-2 line utility functions (comment-marker overhead exceeds the savings), 45-70% on production-sized modules with substantial function bodies, and up to 90%+ on large, implementation-heavy files. Across our internal benchmark set spanning small, medium, and large files in TypeScript, Python, Go, and Rust, the blended average was 67%.

---

## 🚀 Quick Start

### 1. Run CLI Scan
Scan your project to view code compression and token savings metrics:
```bash
npx context-skeleton scan
```

### 2. Copy Formatted Context for AI Chat Prompts
Dump the compressed skeleton context directly to stdout for Cursor, Claude Code, or Windsurf:
```bash
npx context-skeleton copy > context.md
```

### 3. Add to PRs & `.cursorrules` / `CLAUDE.md`
Inject automated token-savings badges into your repository:
```bash
npx context-skeleton badge
```

---

## 🤖 Model Context Protocol (MCP) Integration

Integrate ContextSkeleton natively with Claude Code, Cursor, or AGY agents.

Add to your `claude_desktop_config.json` or `.cursorrules`:

```json
{
  "mcpServers": {
    "context-skeleton": {
      "command": "npx",
      "args": ["-y", "context-skeleton-mcp"]
    }
  }
}
```

### Exposed MCP Tools:
- `get_repo_skeleton`: Returns folded structural skeleton of target repository.
- `unfold_symbol`: Retrieves exact implementation of a specific function or class on demand.
- `get_token_savings`: Returns exact token & prompt cost savings metrics.

---

## 📊 Features & Benchmarks

| Feature | Raw Codebase | With ContextSkeleton | Benefit |
| :--- | :--- | :--- | :--- |
| **Blended Benchmark (9 files)** | 6,183 tokens | **2,028 tokens** | **67.2% Blended Savings** |
| **Production Modules (88-135 lines)** | ~550 tokens / file | **~220 tokens / file** | **45% to 70% Reduction** |
| **Large Files (500+ lines)** | 2,963 tokens | **236 tokens** | **92.0% Reduction** |
| **Syntax Errors** | Common (unpruned) | **0% (Valid Signatures)** | Syntactically intact |

> *Note: Token reduction scales with function size and implementation depth — typically 0% on trivial 1-2 line utility functions (comment-marker overhead exceeds the savings), 45-70% on production-sized modules with substantial function bodies, and up to 90%+ on large, implementation-heavy files. Across our internal benchmark set spanning small, medium, and large files in TypeScript, Python, Go, and Rust, the blended average was 67%.*

---

## 💻 Tech Stack ($0 Infra Cost)

- **Engine:** Zero-dependency Node.js Structural Signature Pruner & Token Counter
- **MCP Server:** Stdio JSON-RPC 2.0
- **Web App:** Single-Source HTML5 + Modern CSS + Pure JS

---

## 📄 License

MIT License © 2026 ContextSkeleton
