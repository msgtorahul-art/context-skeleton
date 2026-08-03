#!/bin/bash

# ⚡ ContextSkeleton 1-Click Launch Preparation Script

echo "====================================================="
echo "⚡ ContextSkeleton v1.0.0 Production Release Initializer"
echo "====================================================="

# 1. Run Tests
echo "[1/4] Running core test suite..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Aborting release."
    exit 1
fi
echo "✔ Tests passed 100%!"

# 2. Initialize Git Repository
echo "[2/4] Initializing local git repository..."
if [ ! -d ".git" ]; then
    git init
    git branch -M main
fi

# 3. Commit Codebase
echo "[3/4] Creating initial release commit..."
git add .
git commit -m "feat: release ContextSkeleton v1.0.0 - AST code skeletonizer for AI agents"

# 4. Tag Release
echo "[4/4] Tagging version v1.0.0..."
git tag -a v1.0.0 -m "Release v1.0.0"

echo ""
echo "====================================================="
echo "🎉 SUCCESS! ContextSkeleton v1.0.0 is 100% packaged locally."
echo "====================================================="
echo "To publish to GitHub, run:"
echo "   git remote add origin git@github.com:YOUR_USERNAME/context-skeleton.git"
echo "   git push -u origin main --tags"
echo "====================================================="
