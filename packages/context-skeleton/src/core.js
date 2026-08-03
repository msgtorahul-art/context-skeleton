/**
 * ContextSkeleton Core Engine
 * Provides zero-dependency structural code folding, skeleton generation,
 * token calculation, and symbol indexing.
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
 * Character scanner that counts structural braces on a line across languages (JS, TS, Go, Rust, C/C++, Java, C#),
 * ignoring braces inside strings, template literals, comments, regexes, and Rust raw strings (r#"..."#).
 */
function getStructuralBracesInLine(line, state, ext = '.js') {
  let openBraces = 0;
  let closeBraces = 0;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    const next = line[i + 1];

    if (state.inMultiComment) {
      if (ch === '*' && next === '/') {
        state.inMultiComment = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (state.inString) {
      if (ch === '\\') {
        i += 2; // skip escaped character
      } else if (ch === state.stringQuote) {
        state.inString = false;
        i++;
      } else {
        i++;
      }
      continue;
    }

    // Rust raw string mode r"..." or r#"..."#
    if (state.inRustRawString) {
      if (ch === '"') {
        let matchingHashes = 0;
        let idx = i + 1;
        while (idx < line.length && line[idx] === '#') {
          matchingHashes++;
          idx++;
        }
        if (matchingHashes === state.rustRawHashes) {
          state.inRustRawString = false;
          i = idx;
          continue;
        }
      }
      i++;
      continue;
    }

    // JS/TS Template literal mode (when not inside ${ ... } expression)
    if (state.templateStack && state.templateStack.length > 0 && !state.templateStack[state.templateStack.length - 1].inExpr) {
      if (ch === '\\') {
        i += 2;
      } else if (ch === '`') {
        state.templateStack.pop();
        i++;
      } else if (ch === '$' && next === '{') {
        state.templateStack[state.templateStack.length - 1].inExpr = true;
        state.templateStack[state.templateStack.length - 1].exprDepth = 1;
        openBraces++;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // Single line comments
    if (ch === '/' && next === '/') {
      break;
    }

    // Multi line comments
    if (ch === '/' && next === '*') {
      state.inMultiComment = true;
      i += 2;
      continue;
    }

    // Rust raw string start r" or r#"
    if (ext === '.rs' && ch === 'r') {
      let hashes = 0;
      let idx = i + 1;
      while (idx < line.length && line[idx] === '#') {
        hashes++;
        idx++;
      }
      if (line[idx] === '"') {
        state.inRustRawString = true;
        state.rustRawHashes = hashes;
        i = idx + 1;
        continue;
      }
    }

    // JS/TS Regex literal detection heuristic
    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext) && ch === '/') {
      const prevChars = line.substring(0, i).trim();
      const lastChar = prevChars[prevChars.length - 1];
      if (i === 0 || '=:(,{[!;&|'.includes(lastChar)) {
        i++;
        while (i < line.length) {
          if (line[i] === '\\') {
            i += 2;
          } else if (line[i] === '/') {
            i++;
            while (i < line.length && /[a-z]/i.test(line[i])) i++;
            break;
          } else {
            i++;
          }
        }
        continue;
      }
    }

    // String literal start
    if (ch === "'" || ch === '"') {
      state.inString = true;
      state.stringQuote = ch;
      i++;
      continue;
    }

    // JS/TS Template literal start
    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext) && ch === '`') {
      if (!state.templateStack) state.templateStack = [];
      state.templateStack.push({ inExpr: false, exprDepth: 0 });
      i++;
      continue;
    }

    // Structural braces count
    if (ch === '{') {
      openBraces++;
      if (state.templateStack && state.templateStack.length > 0 && state.templateStack[state.templateStack.length - 1].inExpr) {
        state.templateStack[state.templateStack.length - 1].exprDepth++;
      }
    } else if (ch === '}') {
      closeBraces++;
      if (state.templateStack && state.templateStack.length > 0 && state.templateStack[state.templateStack.length - 1].inExpr) {
        state.templateStack[state.templateStack.length - 1].exprDepth--;
        if (state.templateStack[state.templateStack.length - 1].exprDepth === 0) {
          state.templateStack[state.templateStack.length - 1].inExpr = false;
        }
      }
    }

    i++;
  }

  return { openBraces, closeBraces };
}

/**
 * Container blocks (impl, trait, class, interface, namespace) that contain internal methods/functions
 */
function isContainerSignature(trimmed, ext) {
  if (ext === '.rs') {
    return /^(pub(\([^)]*\))?\s+)?(impl|trait)\b/.test(trimmed);
  }
  if (ext === '.go') {
    return false;
  }
  return /^(export\s+)?(default\s+)?(class|interface|namespace|module)\b/.test(trimmed) && !trimmed.includes('(');
}

/**
 * Language-aware function/method signature detector
 */
function isFunctionSignature(trimmed, ext) {
  // Exclude control-flow statements in all C-style languages
  if (/^(if|else|for|while|switch|catch|with|try|finally)\b/.test(trimmed)) {
    return false;
  }

  if (ext === '.go') {
    return /^func\s+/.test(trimmed);
  }
  if (ext === '.rs') {
    return /^(pub(\([^)]*\))?\s+)?(async\s+|const\s+|unsafe\s+)?(fn)\b/.test(trimmed);
  }
  if (['.java', '.c', '.cpp', '.cs'].includes(ext)) {
    return /^(public|private|protected|static|final|virtual|override|async|void|int|char|bool|float|double|auto|template|\w+)\s+/.test(trimmed) && trimmed.includes('(');
  }
  // Default JS/TS function detector
  return /^(export\s+)?(default\s+)?(async\s+)?(function|class|interface|type|enum|const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>)/.test(trimmed) ||
         /^(export\s+)?(default\s+)?(public|private|protected|static|async|get|set)*\s*(async\s+)?(function|constructor|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*(\<[^\>]*\>)?\s*\([^)]*\)\s*(:\s*[^{]+)?\s*\{/.test(trimmed);
}

/**
 * Universal Structural Code Folding for C-style languages (JS/TS, Go, Rust, Java, C/C++, C#)
 */
function skeletonizeCStyle(code, filename = 'code.js', options = {}) {
  const ext = path.extname(filename).toLowerCase();
  const lines = code.split('\n');
  const result = [];
  let inFunction = false;
  let inPendingSignature = false;
  let blockDepth = 0;
  let foldContentLines = 0;
  let currentComment = [];

  const state = {
    inMultiComment: false,
    inString: false,
    stringQuote: '',
    inRustRawString: false,
    rustRawHashes: 0,
    templateStack: []
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const { openBraces, closeBraces } = getStructuralBracesInLine(line, state, ext);

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

    // Preserve comments attached to top-level signatures (including /// and //!)
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
      if (options.preserveDocstrings !== false) {
        currentComment.push(line);
      }
      continue;
    }

    // Container blocks (impl, class, trait) pass through so methods inside can be folded individually
    if (isContainerSignature(trimmed, ext)) {
      if (currentComment.length > 0) {
        result.push(...currentComment);
        currentComment = [];
      }
      result.push(line);
      continue;
    }

    const isFuncSig = isFunctionSignature(trimmed, ext);

    if (inPendingSignature || isFuncSig) {
      const hasOpeningBrace = line.includes('{');
      if (hasOpeningBrace) {
        inPendingSignature = false;
        
        const netBraces = openBraces - closeBraces;
        if (netBraces <= 0) {
          // Single-line function definition (signature, body, and closing brace on one line)
          if (currentComment.length > 0) {
            result.push(...currentComment);
            currentComment = [];
          }
          const firstBrace = line.indexOf('{');
          const lastBrace = line.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            const sigPart = line.substring(0, firstBrace + 1);
            result.push(`${sigPart} /* ... [folded implementation] ... */ }`);
          } else {
            result.push(line);
          }
          continue;
        }

        inFunction = true;
        blockDepth = netBraces;
        foldContentLines = 0;

        if (currentComment.length > 0) {
          result.push(...currentComment);
          currentComment = [];
        }

        const braceIndex = line.lastIndexOf('{');
        if (braceIndex !== -1) {
          result.push(line.substring(0, braceIndex + 1));
        } else {
          result.push(line);
        }
        continue;
      } else {
        inPendingSignature = true;
        if (currentComment.length > 0) {
          result.push(...currentComment);
          currentComment = [];
        }
        result.push(line);
        continue;
      }
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
 * Folds function and block implementations in JavaScript / TypeScript / JSX / TSX code
 */
function skeletonizeJS(code, filename = 'code.js', options = {}) {
  return skeletonizeCStyle(code, filename, options);
}

/**
 * Folds function and class implementations in Python code with multi-line docstring awareness
 */
function skeletonizePython(code, options = {}) {
  const lines = code.split('\n');
  const result = [];
  let inDef = false;
  let defIndent = 0;
  let foldContentLines = 0;
  let inTripleQuote = false;
  let tripleQuoteStr = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check multi-line triple-quoted docstrings
    if (inTripleQuote) {
      result.push(line);
      if (trimmed.includes(tripleQuoteStr)) {
        inTripleQuote = false;
      }
      continue;
    }

    const tripleMatch = trimmed.match(/^"""|^'''/);
    if (tripleMatch) {
      const quote = tripleMatch[0];
      const rest = trimmed.substring(3);
      if (!rest.includes(quote)) {
        inTripleQuote = true;
        tripleQuoteStr = quote;
      }
      if (inDef && foldContentLines === 0) {
        result.push(line);
        continue;
      }
    }

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
 * Main Skeletonizer API
 */
export function skeletonize(code, filename = 'code.js', options = {}) {
  const ext = path.extname(filename).toLowerCase();
  let skeletonCode = code;

  if (['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext)) {
    skeletonCode = skeletonizeJS(code, filename, options);
  } else if (['.py'].includes(ext)) {
    skeletonCode = skeletonizePython(code, options);
  } else if (['.go', '.rs', '.java', '.c', '.cpp', '.cs'].includes(ext)) {
    skeletonCode = skeletonizeCStyle(code, filename, options);
  } else {
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
    const match = line.match(/(?:export\s+)?(?:async\s+)?(function|class|const|let|var|interface|type|func|pub\s+fn)\s+([A-Za-z0-9_$]+)/);
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
