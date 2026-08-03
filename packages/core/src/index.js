/**
 * ContextSkeleton Core AST Engine
 * Provides intelligent AST folding, skeleton generation, token calculation, and symbol indexing.
 */

import fs from 'fs';
import path from 'path';

/**
 * Token counter estimator (1 token ~ 3.8 characters for code context)
 */
export function estimateTokens(text) {
  if (!text) return 0;
  // Code context token estimation: words + structural symbols + whitespace factor
  const charCount = text.length;
  const wordCount = (text.match(/\w+/g) || []).length;
  const symbolCount = (text.match(/[{}[\]();:=><+\-*\/&|!.,?]/g) || []).length;
  return Math.ceil((wordCount * 0.75) + (symbolCount * 0.4) + (charCount * 0.05));
}

/**
 * Calculates financial savings based on standard LLM input token costs ($3.00 / 1M tokens)
 */
export function calculateSavings(originalTokens, skeletonTokens, costPerMillion = 3.00) {
  const tokensSaved = Math.max(0, originalTokens - skeletonTokens);
  const percentageSaved = originalTokens > 0 ? ((tokensSaved / originalTokens) * 100).toFixed(1) : 0;
  const dollarsSaved = ((tokensSaved / 1_000_000) * costPerMillion).toFixed(4);
  
  return {
    originalTokens,
    skeletonTokens,
    tokensSaved,
    percentageSaved: Number(percentageSaved),
    dollarsSaved: Number(dollarsSaved)
  };
}

/**
 * Folds function and block implementations in JavaScript / TypeScript / JSX / TSX code
 */
function skeletonizeJS(code, options = {}) {
  const lines = code.split('\n');
  const result = [];
  let inFunction = false;
  let blockDepth = 0;
  let foldContentLines = 0;
  let currentComment = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;

    if (inFunction) {
      blockDepth += (openBraces - closeBraces);
      if (blockDepth <= 0) {
        // End of function block
        inFunction = false;
        if (foldContentLines > 0) {
          result.push(`  /* ... [folded implementation: ${foldContentLines} lines] ... */`);
        }
        result.push('}');
      } else {
        foldContentLines++;
      }
      continue;
    }

    // Preserve comments attached to top-level signatures
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      if (options.preserveDocstrings !== false) {
        currentComment.push(line);
      }
      continue;
    }

    // Detect signatures: function, class methods, arrow functions, async methods
    const isSignature = /^(export\s+)?(async\s+)?(function|class|interface|type|enum|const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>)/.test(trimmed) ||
                        /^(public|private|protected|static|async|get|set)?\s*\w+\s*\([^)]*\)\s*(\{|=)/.test(trimmed);

    // Signature opening block condition
    const hasOpeningBrace = line.includes('{');
    if (isSignature && hasOpeningBrace) {
      inFunction = true;
      blockDepth = Math.max(1, openBraces - closeBraces);
      foldContentLines = 0;

      if (currentComment.length > 0) {
        result.push(...currentComment);
        currentComment = [];
      }

      // Print signature up to opening brace
      const braceIndex = line.lastIndexOf('{');
      if (braceIndex !== -1) {
        result.push(line.substring(0, braceIndex + 1));
      } else {
        result.push(line);
      }
      continue;
    }

    if (currentComment.length > 0) {
      result.push(...currentComment);
      currentComment = [];
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Folds function and class implementations in Python code
 */
function skeletonizePython(code, options = {}) {
  const lines = code.split('\n');
  const result = [];
  let inDef = false;
  let defIndent = 0;
  let foldContentLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (!inDef) result.push(line);
      continue;
    }

    const currentIndent = line.search(/\S/);

    // Detect Python def / class
    if (trimmed.startsWith('def ') || trimmed.startsWith('async def ') || trimmed.startsWith('class ')) {
      if (inDef && foldContentLines > 0) {
        const indentStr = ' '.repeat(defIndent + 4);
        result.push(`${indentStr}# ... [folded implementation: ${foldContentLines} lines] ...`);
        result.push(`${indentStr}...`);
      }

      inDef = true;
      defIndent = currentIndent;
      foldContentLines = 0;
      result.push(line);
      continue;
    }

    if (inDef) {
      if (currentIndent <= defIndent && !trimmed.startsWith('#')) {
        // Out of indentation block
        const indentStr = ' '.repeat(defIndent + 4);
        if (foldContentLines > 0) {
          result.push(`${indentStr}# ... [folded implementation: ${foldContentLines} lines] ...`);
          result.push(`${indentStr}...`);
        }
        inDef = false;
        result.push(line);
      } else {
        // Fold body content
        foldContentLines++;
      }
      continue;
    }

    result.push(line);
  }

  if (inDef && foldContentLines > 0) {
    const indentStr = ' '.repeat(defIndent + 4);
    result.push(`${indentStr}# ... [folded implementation: ${foldContentLines} lines] ...`);
    result.push(`${indentStr}...`);
  }

  return result.join('\n');
}

/**
 * Folds function implementations in Go / Rust code
 */
function skeletonizeCStyle(code, options = {}) {
  return skeletonizeJS(code, options);
}

/**
 * Main AST Skeletonizer API
 */
export function skeletonize(code, filename = 'code.js', options = {}) {
  const ext = path.extname(filename).toLowerCase();
  let skeletonCode = code;

  if (['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext)) {
    skeletonCode = skeletonizeJS(code, options);
  } else if (['.py'].includes(ext)) {
    skeletonCode = skeletonizePython(code, options);
  } else if (['.go', '.rs', '.java', '.c', '.cpp', '.cs'].includes(ext)) {
    skeletonCode = skeletonizeCStyle(code, options);
  } else {
    // Generic fallback: pass-through or basic line cap
    skeletonCode = code;
  }

  const originalTokens = estimateTokens(code);
  const skeletonTokens = estimateTokens(skeletonCode);
  const metrics = calculateSavings(originalTokens, skeletonTokens);

  return {
    filename,
    originalCode: code,
    skeletonCode,
    metrics
  };
}

/**
 * Processes a directory recursively and generates a complete repo skeleton context
 */
export function skeletonizeDirectory(dirPath, options = {}) {
  const maxDepth = options.maxDepth || 8;
  const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.gemini']);
  const validExts = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.c', '.cpp', '.cs', '.json', '.md']);

  const fileResults = [];
  let totalOriginalTokens = 0;
  let totalSkeletonTokens = 0;

  function walk(currentDir, depth) {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.cursorrules' && entry.name !== 'CLAUDE.md') continue;
      
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          walk(fullPath, depth + 1);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (validExts.has(ext)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Ignore files larger than 1MB
            if (content.length > 1_000_000) continue;

            const res = skeletonize(content, entry.name, options);
            res.relativePath = path.relative(dirPath, fullPath);
            fileResults.push(res);

            totalOriginalTokens += res.metrics.originalTokens;
            totalSkeletonTokens += res.metrics.skeletonTokens;
          } catch {
            // Skip unreadable files
          }
        }
      }
    }
  }

  walk(dirPath, 0);

  const aggregateMetrics = calculateSavings(totalOriginalTokens, totalSkeletonTokens);

  return {
    directory: dirPath,
    filesCount: fileResults.length,
    fileResults,
    metrics: aggregateMetrics
  };
}

/**
 * Indexes exported symbols (functions, classes, variables) in a file for on-demand unfolding
 */
export function indexSymbols(code, filename = 'code.js') {
  const lines = code.split('\n');
  const symbols = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(/(?:export\s+)?(?:async\s+)?(function|class|const|let|var|interface|type)\s+([A-Za-z0-9_$]+)/);
    if (match) {
      symbols.push({
        name: match[2],
        kind: match[1],
        line: i + 1,
        snippet: line
      });
    }
  }

  return symbols;
}
