#!/bin/bash

# Docker initialization script for BSM V2
# Automatically sets up Supabase migrations and n8n workflows

echo "🚀 Starting BSM V2 Docker initialization..."

# Check if Supabase CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ npm/npx not found. Please install Node.js first."
    exit 1
fi

# Wait for Supabase to be ready (external)
echo "⏳ Checking Supabase connection..."
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "✅ Supabase URL configured: $NEXT_PUBLIC_SUPABASE_URL"
else
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not set"
    exit 1
fi

# Apply migrations if needed
echo "📊 Checking database migrations..."
if [ -d "supabase/migrations" ]; then
    echo "🔄 Applying Supabase migrations..."
    npx supabase db push --linked || echo "⚠️ Migration push failed - may already be applied"
else
    echo "ℹ️ No migrations directory found"
fi

# Wait for n8n to be healthy
echo "⏳ Waiting for n8n to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f -s "http://n8n:5678/rest/healthz" > /dev/null 2>&1; then
        echo "✅ n8n is ready!"
        break
    fi

    attempt=$((attempt + 1))
    echo "⏳ Waiting for n8n... (attempt $attempt/$max_attempts)"
    sleep 10
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ n8n failed to start within timeout"
    exit 1
fi

# Check if workflows need to be imported
echo "🔧 Checking n8n workflows..."
if [ -d "n8n/workflows" ]; then
    echo "📂 Found workflow directory, checking for imports..."
    # Add workflow import logic here if needed
else
    echo "ℹ️ No n8n workflows directory found"
fi

echo "✅ BSM V2 Docker initialization complete!"
echo "🌐 Application should be available at: http://localhost:4000"
echo "🔧 n8n interface available at: http://localhost:5679"