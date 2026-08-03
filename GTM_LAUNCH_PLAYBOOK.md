# Product Hunt, Hacker News & X (Twitter) Launch Playbook

## 🚀 Product Hunt Launch Title & Tagline
**Product Name:** ContextSkeleton  
**Tagline:** Cut LLM context costs with zero-latency structural code folding  
**Topic:** Developer Tools, Artificial Intelligence, Open Source, Productivity  

### Short Description:
ContextSkeleton is an open-source CLI and Model Context Protocol (MCP) server that compresses codebases into syntactically valid code skeletons. Token reduction scales with function size and implementation depth — typically 0% on trivial 1-2 line utility functions (comment-marker overhead exceeds the savings), 45-70% on production-sized modules with substantial function bodies, and up to 90%+ on large, implementation-heavy files. Across our internal benchmark set spanning small, medium, and large files in TypeScript, Python, Go, and Rust, the blended average was 67%.

---

## 📄 Hacker News (Show HN) Post
**Title:** Show HN: ContextSkeleton – Cut LLM token costs via structural code folding

**Post Body:**
Hey HN! 

I built ContextSkeleton because sending raw 1,000-line source files to AI coding agents (Cursor, Claude Code, Windsurf) was blowing through token limits and inflating API bills.

ContextSkeleton parses JS/TS, Python, Go, and Rust code into structural skeletons—folding function and class implementations while preserving exported signatures, interfaces, imports, and docstrings.

- **0.4ms parsing time** (100% client-side)
- **67% blended token reduction** (45-70% on production modules, up to 90%+ on large files)
- **Native MCP Server** integration (`get_repo_skeleton`, `unfold_symbol`)
- **$0 infra stack** built with zero-dependency Node.js signature pruner

CLI: `npx context-skeleton scan`  
GitHub: https://github.com/msgtorahul-art/context-skeleton  

Would love feedback from engineers using AI agents in production!

---

## 🐦 X (Twitter) Viral Thread Draft

**Tweet 1:**  
AI coding tools are eating context windows & blowing up LLM API bills 💸  

Sending full, unpruned source files to Cursor / Claude Code is a massive token drain.  

Meet ContextSkeleton ⚡ — an open-source tool that cuts code context with structural code folding (67% blended token savings across full repos).  

🧵 (1/5)

**Tweet 2:**  
How it works:  
Instead of dumping 500 lines of implementation into your prompt, ContextSkeleton folds method bodies while preserving exported signatures, interfaces, & JSDocs.  

The AI gets 100% of the architectural blueprint at a fraction of the token cost. (2/5)

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
https://github.com/msgtorahul-art/context-skeleton (5/5)
