#!/bin/bash

# Revert all lucide imports back to the original format
# This will rely on Next.js optimizePackageImports instead

FILES=$(find components -name "*.tsx" -type f)

for file in $FILES; do
    if grep -q "lucide-react/dist/esm/icons" "$file"; then
        echo "Reverting: $file"
    fi
done
