#!/bin/bash

branch=$(git branch --show-current)

echo "Pushing branch '$branch' to origin (Gitea)..."
git push origin $branch

echo "Pushing branch '$branch' to github..."
git push github $branch

echo "Done!"
