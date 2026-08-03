import test from 'node:test';
import assert from 'node:assert/strict';
import { skeletonize, estimateTokens, calculateSavings, indexSymbols } from '../src/index.js';

test('Core AST Engine - JavaScript / TypeScript Folding', () => {
  const code = `
  import fs from 'fs';

  /**
   * Calculates total user revenue
   */
  export function calculateRevenue(transactions) {
    let total = 0;
    for (const tx of transactions) {
      if (tx.status === 'completed') {
        total += tx.amount;
      }
    }
    return total;
  }

  export class UserAccount {
    constructor(name) {
      this.name = name;
    }

    getProfileData() {
      const data = { name: this.name, active: true };
      return data;
    }
  }
  `;

  const result = skeletonize(code, 'app.ts');

  assert.ok(result.skeletonCode.includes('export function calculateRevenue(transactions) {'));
  assert.ok(result.skeletonCode.includes('folded implementation'));
  assert.ok(result.metrics.percentageSaved > 0, 'Should reduce tokens');
  assert.ok(result.metrics.tokensSaved > 0, 'Tokens saved should be positive');
});

test('Core AST Engine - Python Folding', () => {
  const pyCode = `
def process_data(payload):
    """Processes incoming queue payload"""
    formatted = payload.strip()
    result = []
    for item in formatted.split(','):
        result.append(item.upper())
    return result

class DataPipeline:
    def __init__(self, name):
        self.name = name

    def execute(self):
        print("Executing pipeline")
        return True
  `;

  const result = skeletonize(pyCode, 'pipeline.py');
  assert.ok(result.skeletonCode.includes('def process_data(payload):'));
  assert.ok(result.skeletonCode.includes('# ... [folded implementation'));
  assert.ok(result.metrics.percentageSaved > 0);
});

test('Core AST Engine - Symbol Indexing', () => {
  const code = `
  export function runTask() {}
  export class Worker {}
  const secretKey = '12345';
  `;

  const symbols = indexSymbols(code, 'task.js');
  assert.equal(symbols.length, 3);
  assert.equal(symbols[0].name, 'runTask');
  assert.equal(symbols[1].name, 'Worker');
  assert.equal(symbols[2].name, 'secretKey');
});

test('Token Estimation & Financial Savings', () => {
  const savings = calculateSavings(100000, 20000, 3.00);
  assert.equal(savings.tokensSaved, 80000);
  assert.equal(savings.percentageSaved, 80);
  assert.equal(savings.dollarsSaved, 0.24);
});
