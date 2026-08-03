import test from 'node:test';
import assert from 'node:assert/strict';
import { skeletonize, estimateTokens, calculateSavings, indexSymbols } from '../src/index.js';

test('Core Engine - JavaScript / TypeScript Folding', () => {
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

test('Core Engine - JSX with Embedded Expressions {user?.name}', () => {
  const jsxCode = `
export function UserCard({ user }) {
  const title = 'User Profile Card';
  return (
    <div className="card-container">
      <h2>{title}</h2>
      <span>{user?.name}</span>
      <button onClick={() => console.log('clicked')}>Action</button>
    </div>
  );
}
`;

  const result = skeletonize(jsxCode, 'UserCard.jsx');
  assert.ok(result.skeletonCode.includes('export function UserCard({ user }) {'), 'Should contain function signature');
  assert.ok(result.skeletonCode.includes('folded implementation'), 'Should fold implementation lines');
  assert.ok(result.skeletonCode.trim().endsWith('}'), 'Should end with closing brace');
});

test('Core Engine - Template Literals & Regex Literals with Braces', () => {
  const code = `
export function formatPattern(input) {
  const regex = /{[0-9]+}/g;
  const template = \`Value: \${input.getValue({ nested: true })}\`;
  const literalBraces = \`Static brace {test} inside string\`;
  return { regex, template, literalBraces };
}
`;

  const result = skeletonize(code, 'formatter.js');
  assert.ok(result.skeletonCode.includes('export function formatPattern(input) {'), 'Should contain function signature');
  assert.ok(result.skeletonCode.includes('folded implementation'), 'Should fold implementation lines');
  assert.ok(result.skeletonCode.trim().endsWith('}'), 'Should end with closing brace');
});

test('Core Engine - Python Folding & Multi-line Triple-Quoted Docstrings', () => {
  const pyCode = `
def process_data(payload):
    """
    Multi-line docstring spanning multiple lines.
    Contains fake signature: def fake_func():
    """
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
  assert.ok(result.skeletonCode.includes('Multi-line docstring spanning multiple lines.'));
  assert.ok(result.skeletonCode.includes('# ... [folded implementation'));
  assert.ok(result.metrics.percentageSaved > 0);
});

test('Core Engine - Go Structural Folding (Structs, Methods & Comments)', () => {
  const goCode = `
package main

import "fmt"

// UserProfile stores user account details
type UserProfile struct {
	ID   string
	Name string
}

// ProcessUser handles incoming user struct and returns formatted string
func ProcessUser(user UserProfile) (string, error) {
	if user.ID == "" {
		return "", fmt.Errorf("empty ID")
	}
	formatted := fmt.Sprintf("User %s (%s)", user.Name, user.ID)
	return formatted, nil
}

func (u *UserProfile) UpdateName(newName string) {
	u.Name = newName
}
`;

  const result = skeletonize(goCode, 'user.go');
  assert.ok(result.skeletonCode.includes('// UserProfile stores user account details'));
  assert.ok(result.skeletonCode.includes('type UserProfile struct {'));
  assert.ok(result.skeletonCode.includes('func ProcessUser(user UserProfile) (string, error) {'));
  assert.ok(result.skeletonCode.includes('func (u *UserProfile) UpdateName(newName string) {'));
  assert.ok(result.skeletonCode.includes('folded implementation'));
  assert.ok(result.metrics.percentageSaved > 0, 'Go folding should reduce tokens');
});

test('Core Engine - Rust Structural Folding (Structs, Impl, Generics & Raw Strings)', () => {
  const rustCode = `
use std::fmt::Display;

/// Represents a system user account
pub struct UserAccount {
    pub username: String,
    pub active: bool,
}

impl UserAccount {
    pub fn new(username: &str) -> Self {
        UserAccount {
            username: username.to_string(),
            active: true,
        }
    }

    pub fn format_greeting<T: Display>(&self, prefix: T) -> String {
        let raw_json = r#"{"prefix": "{nested}", "status": "ok"}"#;
        format!("{} Hello {}, raw: {}", prefix, self.username, raw_json)
    }
}
`;

  const result = skeletonize(rustCode, 'user.rs');
  assert.ok(result.skeletonCode.includes('/// Represents a system user account'));
  assert.ok(result.skeletonCode.includes('pub struct UserAccount {'));
  assert.ok(result.skeletonCode.includes('impl UserAccount {'));
  assert.ok(result.skeletonCode.includes('pub fn new(username: &str) -> Self {'));
  assert.ok(result.skeletonCode.includes('pub fn format_greeting<T: Display>(&self, prefix: T) -> String {'));
  assert.ok(result.skeletonCode.includes('folded implementation'));
  assert.ok(result.metrics.percentageSaved > 0, 'Rust folding should reduce tokens');
});

test('Core Engine - Symbol Indexing', () => {
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

test('Regression - Top-level Control-Flow Statements (if, for, while) Must NOT Be Folded', () => {
  const topLevelCode = `
import { initApp } from './app';

if (process.env.NODE_ENV === 'production') {
  console.log('prod mode');
  initApp();
}

for (let i = 0; i < 3; i++) {
  console.log('loop iteration', i);
}

while (false) {
  console.log('unreachable');
}

export function handleRequest(req, res) {
  const data = req.body;
  return res.json(data);
}
`;

  const result = skeletonize(topLevelCode, 'main.ts');
  
  assert.ok(result.skeletonCode.includes("if (process.env.NODE_ENV === 'production') {"), 'Top-level if signature preserved');
  assert.ok(result.skeletonCode.includes("console.log('prod mode');"), 'Top-level if body MUST NOT be folded');
  assert.ok(result.skeletonCode.includes('initApp();'), 'Top-level if contents preserved');
  assert.ok(result.skeletonCode.includes("for (let i = 0; i < 3; i++) {"), 'Top-level for loop preserved');
  assert.ok(result.skeletonCode.includes("console.log('loop iteration', i);"), 'Top-level for body MUST NOT be folded');
  assert.ok(result.skeletonCode.includes("while (false) {"), 'Top-level while loop preserved');
  assert.ok(result.skeletonCode.includes("console.log('unreachable');"), 'Top-level while body MUST NOT be folded');
  assert.ok(result.skeletonCode.includes('export function handleRequest(req, res) {'), 'Function signature preserved');
  assert.ok(result.skeletonCode.includes('folded implementation'), 'Function body MUST be folded');
});

test('Regression - Single-line Function Definitions Must NOT Swallow Subsequent Code', () => {
  const code = `
export function real(x) { return x*2; }
export function another(y) {
  return y + 1;
}
export const AFTER = 42;
`;

  const result = skeletonize(code, 'singleLine.js');
  assert.ok(result.skeletonCode.includes('export function real(x) {'), 'Single-line function signature preserved');
  assert.ok(result.skeletonCode.includes('export function another(y) {'), 'Subsequent function signature MUST survive');
  assert.ok(result.skeletonCode.includes('export const AFTER = 42;'), 'Subsequent export constant MUST survive');
});

test('Regression - Single-line Function as Very Last Line of File', () => {
  const code = `
export const BEFORE = 100;
export function lastLineFunc(a, b) { return a + b; }
`;

  const result = skeletonize(code, 'lastLine.js');
  assert.ok(result.skeletonCode.includes('export const BEFORE = 100;'), 'Prior constant preserved');
  assert.ok(result.skeletonCode.includes('export function lastLineFunc(a, b) {'), 'Last line single-line function signature preserved');
});

test('Regression - Multiple Single-line Functions in a Row', () => {
  const code = `
export function inlineOne() { return 1; }
export function inlineTwo() { return 2; }
export function inlineThree() { return 3; }
export const FINAL_VAL = 99;
`;

  const result = skeletonize(code, 'multiInline.js');
  assert.ok(result.skeletonCode.includes('export function inlineOne() {'), 'inlineOne preserved');
  assert.ok(result.skeletonCode.includes('export function inlineTwo() {'), 'inlineTwo preserved');
  assert.ok(result.skeletonCode.includes('export function inlineThree() {'), 'inlineThree preserved');
  assert.ok(result.skeletonCode.includes('export const FINAL_VAL = 99;'), 'FINAL_VAL preserved');
});

test('Token Estimation & Financial Savings', () => {
  const savings = calculateSavings(100000, 20000, 3.00);
  assert.equal(savings.tokensSaved, 80000);
  assert.equal(savings.percentageSaved, 80);
  assert.equal(savings.dollarsSaved, 0.24);
});


