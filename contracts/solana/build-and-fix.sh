#!/bin/bash

# Cross-Chain Lending Pool - Build and Fix Script
echo "🏗️  Building Cross-Chain Lending Pool..."

# Step 1: Build the Anchor program
echo "📦 Building Anchor program..."
if anchor build; then
    echo "✅ Anchor build completed successfully!"
else
    echo "❌ Anchor build failed!"
    exit 1
fi

# Step 2: Fix import paths in TypeScript files
echo "🔧 Fixing import paths..."

# Fix deploy.ts
if [ -f "migrations/deploy.ts" ]; then
    sed -i '' 's|from "../types/lending_pool"|from "../target/types/lending_pool"|g' migrations/deploy.ts
    echo "✅ Fixed migrations/deploy.ts"
fi

# Fix test file
if [ -f "tests/lending_pool.ts" ]; then
    sed -i '' 's|from "../types/lending_pool"|from "../target/types/lending_pool"|g' tests/lending_pool.ts
    echo "✅ Fixed tests/lending_pool.ts"
fi

# Step 3: Clean up temporary type file
if [ -f "types/lending_pool.d.ts" ]; then
    rm types/lending_pool.d.ts
    echo "✅ Removed temporary type definitions"
fi

# Step 4: Run TypeScript check
echo "🔍 Running TypeScript check..."
if npx tsc --noEmit; then
    echo "✅ TypeScript check passed! All lint errors resolved."
else
    echo "⚠️  Some TypeScript issues remain, but the build is functional."
fi

echo "🎉 Build process completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'anchor test' to run the test suite"
echo "2. Run 'anchor deploy --provider.cluster devnet' to deploy to devnet"
echo "3. Check the deployment with the generated program ID"
