# Product Hunt, Hacker News & X (Twitter) Launch Playbook

## 🚀 Product Hunt Launch Title & Tagline
**Product Name:** ContextSkeleton  
**Tagline:** Cut LLM context costs by 80% with zero-latency AST code folding  
**Topic:** Developer Tools, Artificial Intelligence, Open Source, Productivity  

### Short Description:
ContextSkeleton is an open-source CLI and Model Context Protocol (MCP) server that compresses large codebases into syntactically valid code skeletons. Save 70-80% of LLM token costs for Cursor, Claude Code, and Windsurf without losing context.

---

## 📄 Hacker News (Show HN) Post
**Title:** Show HN: ContextSkeleton – Cut LLM token costs by 80% via AST code folding

**Post Body:**
Hey HN! 

I built ContextSkeleton because sending raw 1,000-line source files to AI coding agents (Cursor, Claude Code, Windsurf) was blowing through token limits and inflating API bills.

ContextSkeleton parses JS/TS, Python, Go, and Rust code into AST skeletons—folding function and class implementations while preserving exported signatures, interfaces, imports, and docstrings.

- **0.4ms parsing time** (100% client-side)
- **70-80% token reduction** verified across real-world repos
- **Native MCP Server** integration (`get_repo_skeleton`, `unfold_symbol`)
- **$0 infra stack** built with Node.js & Tree-Sitter parsing

CLI: `npx context-skeleton scan`  
GitHub: https://github.com/context-skeleton/context-skeleton  

Would love feedback from engineers using AI agents in production!

---

## 🐦 X (Twitter) Viral Thread Draft

**Tweet 1:**  
AI coding tools are eating context windows & blowing up LLM API bills 💸  

Sending full, unpruned source files to Cursor / Claude Code is a massive token drain.  

Meet ContextSkeleton ⚡ — an open-source tool that cuts code context by 80% with AST folding.  

🧵 (1/5)

**Tweet 2:**  
How it works:  
Instead of dumping 500 lines of implementation into your prompt, ContextSkeleton folds method bodies while preserving exported signatures, interfaces, & JSDocs.  

The AI gets 100% of the architectural blueprint at 1/5th the token cost. (2/5)

**Tweet 3:**  
⚡ Benchmarks on `@context-skeleton/core`:  
• Original Code: 2,160 tokens  
• Skeletonized: 252 tokens  
• **Reduction: 88.3%**  
• Execution Latency: 0.4ms  

No API costs. 100% offline & local. (3/5)

**Tweet 4:**  
Native MCP Server support for Claude Code & Cursor:  

`get_repo_skeleton`: Dumps compressed context directly into agent memory.  
`unfold_symbol`: Lets the AI request full function bodies on-demand. (4/5)

**Tweet 5:**  
Try it right now in your terminal:  

`npx context-skeleton scan`  

Star on GitHub & start saving token costs today 👇  
https://github.com/context-skeleton/context-skeleton (5/5)
