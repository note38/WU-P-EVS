#!/bin/bash

# Election Status Cron Test Script
# This script helps test the cron endpoint locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to load environment variables
load_env() {
    if [ -f "$ENV_FILE" ]; then
        print_color $BLUE "📁 Loading environment from $ENV_FILE"
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    else
        print_color $YELLOW "⚠️  .env.local not found, using environment variables"
    fi
}

# Function to validate required variables
validate_env() {
    local missing_vars=()
    
    if [ -z "$CRON_SECRET" ]; then
        missing_vars+=("CRON_SECRET")
    fi
    
    if [ -z "$DEPLOYMENT_URL" ] && [ -z "$NEXTAUTH_URL" ]; then
        missing_vars+=("DEPLOYMENT_URL or NEXTAUTH_URL")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_color $RED "❌ Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            print_color $RED "   - $var"
        done
        echo ""
        print_color $YELLOW "💡 Please set these in your .env.local file or environment"
        exit 1
    fi
}

# Function to determine base URL
get_base_url() {
    if [ -n "$DEPLOYMENT_URL" ]; then
        echo "$DEPLOYMENT_URL"
    elif [ -n "$NEXTAUTH_URL" ]; then
        echo "$NEXTAUTH_URL"
    else
        echo "http://localhost:3000"
    fi
}

# Function to test the cron endpoint
test_cron_endpoint() {
    local base_url=$(get_base_url)
    local endpoint="$base_url/api/cron/election-status"
    
    print_color $BLUE "🚀 Testing election status cron endpoint"
    print_color $BLUE "📡 URL: $endpoint"
    print_color $BLUE "⏰ Time: $(date)"
    echo ""
    
    # Make the request
    print_color $YELLOW "📡 Making request..."
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" \
        -H "Authorization: Bearer $CRON_SECRET" \
        -H "Content-Type: application/json" \
        -H "User-Agent: test-script/1.0" \
        "$endpoint")
    
    # Parse response
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | sed 's/HTTP_STATUS://')
    time_total=$(echo "$response" | grep "TIME_TOTAL:" | sed 's/TIME_TOTAL://')
    response_body=$(echo "$response" | sed '/HTTP_STATUS:/d' | sed '/TIME_TOTAL:/d')
    
    # Display results
    echo ""
    print_color $BLUE "📊 Results:"
    echo "   Status Code: $http_status"
    echo "   Response Time: ${time_total}s"
    echo ""
    
    if [ "$http_status" -eq 200 ]; then
        print_color $GREEN "✅ Request successful!"
        echo ""
        print_color $BLUE "📄 Response:"
        echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
        
        # Parse election update info
        if command -v jq >/dev/null 2>&1; then
            updated_count=$(echo "$response_body" | jq -r '.updatedCount // 0' 2>/dev/null || echo "0")
            message=$(echo "$response_body" | jq -r '.message // "Unknown"' 2>/dev/null || echo "Unknown")
            
            echo ""
            print_color $GREEN "📈 Election Updates: $updated_count"
            print_color $GREEN "💬 Message: $message"
            
            if [ "$updated_count" -gt 0 ]; then
                echo ""
                print_color $GREEN "🗳️ Updated Elections:"
                echo "$response_body" | jq -r '.updatedElections[]? | "   - \(.name) (ID: \(.id)) → \(.status)"' 2>/dev/null || echo "   - Details not available"
            fi
        fi
    else
        print_color $RED "❌ Request failed!"
        echo ""
        print_color $RED "💥 Error Response:"
        echo "$response_body"
    fi
}

# Function to show usage
show_usage() {
    echo "Election Status Cron Test Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Show verbose output"
    echo ""
    echo "Environment Variables Required:"
    echo "  CRON_SECRET        Secret token for authentication"
    echo "  DEPLOYMENT_URL     Base URL of your application"
    echo "                     (or NEXTAUTH_URL as fallback)"
    echo ""
    echo "Example .env.local:"
    echo "  CRON_SECRET=your-secret-token-here"
    echo "  DEPLOYMENT_URL=https://your-app.vercel.app"
}

# Main execution
main() {
    case "${1:-}" in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--verbose)
            set -x
            ;;
    esac
    
    print_color $BLUE "🧪 Election Status Cron Endpoint Test"
    echo ""
    
    load_env
    validate_env
    test_cron_endpoint
    
    echo ""
    print_color $GREEN "🏁 Test completed!"
}

# Run main function with all arguments
main "$@"