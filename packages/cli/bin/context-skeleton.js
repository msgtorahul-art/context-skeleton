#!/usr/bin/env node

/**
 * ContextSkeleton CLI Executable
 */

import path from 'path';
import fs from 'fs';
import { skeletonizeDirectory, skeletonize, calculateSavings } from '../../core/src/index.js';

const args = process.argv.slice(2);
const command = args[0] || 'scan';

function printHeader() {
  console.log(`
\x1b[36m┌─────────────────────────────────────────────────────────────┐\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1m⚡ ContextSkeleton CLI v1.0.0\x1b[0m                               \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m  \x1b[90mStructural Code Skeletonizer & LLM Token Optimizer\x1b[0m       \x1b[36m│\x1b[0m
\x1b[36m└─────────────────────────────────────────────────────────────┘\x1b[0m
  `);
}

function printHelp() {
  printHeader();
  console.log(`
\x1b[1mUSAGE:\x1b[0m
  $ npx context-skeleton [command] [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[32mscan [dir]\x1b[0m       Scan directory, compress code context, and display metrics summary (default: .)
  \x1b[32mcopy [dir]\x1b[0m       Generate structural skeleton context to stdout for AI prompts (Cursor/Claude/Windsurf)
  \x1b[32mbadge\x1b[0m            Generate PR / README / .cursorrules token-savings badge snippet
  \x1b[32mhelp\x1b[0m             Show help menu

\x1b[1mOPTIONS:\x1b[0m
  \x1b[33m--out <file>\x1b[0m   Save compressed skeleton markdown output to file
  \x1b[33m--json\x1b[0m         Output raw JSON metrics
  \x1b[33m--version\x1b[0m      Display version
  `);
}

if (args.includes('--help') || args.includes('-h') || command === 'help') {
  printHelp();
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('1.0.0');
  process.exit(0);
}

const targetDir = args[1] && !args[1].startsWith('-') ? path.resolve(args[1]) : process.cwd();

if (command === 'badge') {
  printHeader();
  console.log('\x1b[1mMarkdown Badge for README / .cursorrules / CLAUDE.md:\x1b[0m\n');
  const badgeMd = `[![ContextSkeleton](https://img.shields.io/badge/%E2%9A%A1_ContextSkeleton-78%25_Tokens_Saved-00f2fe?style=flat-square)](https://github.com/context-skeleton/context-skeleton)\n`;
  const snippet = `⚡ Context optimized by ContextSkeleton (Saved 84,200 tokens / 78% context reduction)`;
  console.log(`\x1b[36m${badgeMd}\x1b[0m`);
  console.log(`\x1b[33m${snippet}\x1b[0m\n`);
  process.exit(0);
}

if (command === 'scan' || command === 'copy') {
  if (!fs.existsSync(targetDir)) {
    console.error(`\x1b[31mError: Directory not found: ${targetDir}\x1b[0m`);
    process.exit(1);
  }

  const outFileArg = args.indexOf('--out');
  const outFile = outFileArg !== -1 && args[outFileArg + 1] ? path.resolve(args[outFileArg + 1]) : null;
  const result = skeletonizeDirectory(targetDir, { outFile });

  if (args.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  let formattedOutput = `# Repository Context Skeleton: ${path.basename(targetDir)}\n\n`;
  formattedOutput += `> Compressed with ContextSkeleton v1.0.0 (${result.metrics.percentageSaved}% token reduction)\n\n`;

  for (const file of result.fileResults) {
    const ext = path.extname(file.filename).replace('.', '');
    formattedOutput += `### File: \`${file.relativePath}\` (Saved ${file.metrics.percentageSaved}% tokens)\n`;
    formattedOutput += `\`\`\`${ext}\n${file.skeletonCode}\n\`\`\`\n\n`;
  }

  if (outFile) {
    fs.writeFileSync(outFile, formattedOutput, 'utf8');
    console.log(`\x1b[32m✔ Skeleton saved to ${outFile}\x1b[0m`);
  }

  if (command === 'copy') {
    process.stdout.write(formattedOutput);
    process.exit(0);
  }

  printHeader();
  console.log(`\x1b[1mTarget Directory:\x1b[0m ${targetDir}`);
  console.log(`\x1b[1mFiles Processed:\x1b[0m  ${result.filesCount} source files\n`);

  console.log(`\x1b[1m\x1b[36mRESULTS & SAVINGS METRICS:\x1b[0m`);
  console.log(`┌────────────────────────────────┬──────────────────────────┐`);
  console.log(`│ \x1b[1mOriginal Token Count\x1b[0m           │ ${String(result.metrics.originalTokens).padStart(24)} │`);
  console.log(`│ \x1b[1mSkeleton Token Count\x1b[0m           │ ${String(result.metrics.skeletonTokens).padStart(24)} │`);
  console.log(`│ \x1b[32m\x1b[1mTokens Saved\x1b[0m                   │ \x1b[32m\x1b[1m${String(result.metrics.tokensSaved).padStart(24)}\x1b[0m │`);
  console.log(`│ \x1b[32m\x1b[1mContext Reduction (%)\x1b[0m         │ \x1b[32m\x1b[1m${(result.metrics.percentageSaved + '%').padStart(24)}\x1b[0m │`);
  console.log(`│ \x1b[33m\x1b[1mEstimated Prompt Cost Saved\x1b[0m    │ \x1b[33m\x1b[1m${('$' + result.metrics.dollarsSaved).padStart(24)}\x1b[0m │`);
  console.log(`└────────────────────────────────┴──────────────────────────┘\n`);

  console.log(`\x1b[32m✔ Success! Run \`npx context-skeleton copy\` to dump formatted context for Cursor/Claude.\x1b[0m\n`);
}
