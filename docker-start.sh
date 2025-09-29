#!/bin/bash

echo "🚀 Starting BSM V2 with Docker..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Creating from template..."
    if [ -f .env.docker ]; then
        cp .env.docker .env
        echo "📋 Copied .env.docker to .env"
        echo "⚠️ Please edit .env file with your actual values before running docker-compose up"
        exit 1
    else
        echo "❌ No .env.docker template found"
        exit 1
    fi
fi

# Check required environment variables
echo "🔍 Checking environment variables..."
source .env

required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "N8N_ENCRYPTION_KEY"
    "N8N_API_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your_${var,,}_here" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing or placeholder environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo ""
    echo "Please update your .env file with real values."
    exit 1
fi

echo "✅ Environment variables configured"

# Create n8n credentials directory if it doesn't exist
mkdir -p n8n

# Create credentials overwrite file if it doesn't exist
if [ ! -f n8n/credentials_overwrite.json ]; then
    echo "📝 Creating n8n credentials overwrite file..."
    cat > n8n/credentials_overwrite.json << EOF
{
  "supabase": {
    "host": "$NEXT_PUBLIC_SUPABASE_URL",
    "apiKey": "$SUPABASE_SERVICE_ROLE_KEY"
  }
}
EOF
fi

# Start services
echo "🐳 Starting Docker services..."
docker-compose up --build

echo "🎉 BSM V2 should be running!"
echo "🌐 Application: http://localhost:3000"
echo "🔧 n8n: http://localhost:5678"