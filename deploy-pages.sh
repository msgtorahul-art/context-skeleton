#!/bin/bash

# ⚡ Deploy ContextSkeleton Web Application to GitHub Pages

echo "====================================================="
echo "⚡ Deploying ContextSkeleton Web App to GitHub Pages"
echo "====================================================="

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)

# Create gh-pages branch if it doesn't exist
git checkout -B gh-pages

# Commit current changes
git add .
git commit -m "deploy: update GitHub Pages web application"

# Push gh-pages branch to remote
echo "Pushing gh-pages branch to GitHub..."
git push -u origin gh-pages --force

# Switch back to original branch
git checkout $CURRENT_BRANCH

echo "====================================================="
echo "🎉 SUCCESS! Live Website Deployed to GitHub Pages:"
echo "👉 https://msgtorahul-art.github.io/context-skeleton/"
echo "====================================================="
