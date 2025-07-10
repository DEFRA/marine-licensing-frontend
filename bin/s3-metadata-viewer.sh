#!/bin/bash

# S3 Metadata Viewer for LocalStack
# Usage: ./s3-metadata-viewer.sh <bucket-name> [endpoint-url]

set -e

# Configuration
BUCKET_NAME="${1:-mmo-uploads}"
ENDPOINT_URL="${2:-http://localhost:4566}"

# Colors for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to print usage
usage() {
    echo "Usage: $0 [bucket-name] [endpoint-url]"
    echo "  bucket-name: Name of the S3 bucket (default: mmo-uploads)"
    echo "  endpoint-url: LocalStack endpoint (default: http://localhost:4566)"
    echo ""
    echo "Example: $0"
    echo "Example: $0 my-bucket"
    echo "Example: $0 my-bucket http://localhost:4566"
    exit 1
}

# Function to format file size
format_size() {
    local size=$1
    if [ "$size" -lt 1000 ]; then
        echo "${size}B"
    elif [ "$size" -lt 1000000 ]; then
        echo "$(( size / 1000 ))KB"
    elif [ "$size" -lt 1000000000 ]; then
        echo "$(( size / 1000000 ))MB"
    else
        echo "$(( size / 1000000000 ))GB"
    fi
}

# Function to format date
format_date() {
    local date_str="$1"
    # Convert ISO 8601 to readable format
    date -d "$date_str" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "$date_str"
}

# Function to get and display file metadata
get_file_metadata() {
    local key="$1"
    local metadata_json

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}📄 File: ${CYAN}$key${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Get metadata using head-object
    if metadata_json=$(aws --endpoint-url="$ENDPOINT_URL" s3api head-object \
        --bucket "$BUCKET_NAME" \
        --key "$key" \
        --output json \
        --no-sign-request 2>/dev/null); then

        # Extract basic information
        local content_type=$(echo "$metadata_json" | jq -r '.ContentType // "N/A"')
        local content_length=$(echo "$metadata_json" | jq -r '.ContentLength // 0')
        local last_modified=$(echo "$metadata_json" | jq -r '.LastModified // "N/A"')
        local etag=$(echo "$metadata_json" | jq -r '.ETag // "N/A"' | tr -d '"')
        local storage_class=$(echo "$metadata_json" | jq -r '.StorageClass // "STANDARD"')

        # Format size
        local formatted_size=$(format_size "$content_length")
        local formatted_date=$(format_date "$last_modified")

        # Display basic metadata
        echo -e "${YELLOW}📋 Basic Information:${NC}"
        echo -e "   ${GREEN}Content Type:${NC} $content_type"
        echo -e "   ${GREEN}File Size:${NC} $formatted_size ($content_length bytes)"
        echo -e "   ${GREEN}Last Modified:${NC} $formatted_date"
        echo -e "   ${GREEN}ETag:${NC} $etag"
        echo -e "   ${GREEN}Storage Class:${NC} $storage_class"

        # Check for server-side encryption
        local sse_algorithm=$(echo "$metadata_json" | jq -r '.ServerSideEncryption // empty')
        if [ -n "$sse_algorithm" ]; then
            echo -e "   ${GREEN}Encryption:${NC} $sse_algorithm"
        fi

        # Check for custom metadata
        local custom_metadata=$(echo "$metadata_json" | jq -r '.Metadata // {}')
        if [ "$custom_metadata" != "{}" ] && [ "$custom_metadata" != "null" ]; then
            echo -e "\n${YELLOW}🏷️  Custom Metadata:${NC}"
            echo "$metadata_json" | jq -r '.Metadata | to_entries[] | "   \(.key): \(.value)"' | while read -r line; do
                echo -e "   ${PURPLE}$line${NC}"
            done
        fi

        # Check for cache control and other HTTP headers
        local cache_control=$(echo "$metadata_json" | jq -r '.CacheControl // empty')
        local content_disposition=$(echo "$metadata_json" | jq -r '.ContentDisposition // empty')
        local content_encoding=$(echo "$metadata_json" | jq -r '.ContentEncoding // empty')
        local content_language=$(echo "$metadata_json" | jq -r '.ContentLanguage // empty')

        if [ -n "$cache_control" ] || [ -n "$content_disposition" ] || [ -n "$content_encoding" ] || [ -n "$content_language" ]; then
            echo -e "\n${YELLOW}🌐 HTTP Headers:${NC}"
            [ -n "$cache_control" ] && echo -e "   ${GREEN}Cache-Control:${NC} $cache_control"
            [ -n "$content_disposition" ] && echo -e "   ${GREEN}Content-Disposition:${NC} $content_disposition"
            [ -n "$content_encoding" ] && echo -e "   ${GREEN}Content-Encoding:${NC} $content_encoding"
            [ -n "$content_language" ] && echo -e "   ${GREEN}Content-Language:${NC} $content_language"
        fi

    else
        echo -e "${RED}❌ Error: Could not retrieve metadata for '$key'${NC}"
    fi

    echo ""
}

# Main script
main() {

    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required but not installed${NC}"
        echo "Install with: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
        exit 1
    fi

    # Check if aws cli is installed
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}Error: AWS CLI is required but not installed${NC}"
        exit 1
    fi

    echo -e "${WHITE}🚀 S3 Metadata Viewer for LocalStack${NC}"
    echo -e "${WHITE}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}Bucket:${NC} $BUCKET_NAME"
    echo -e "${GREEN}Endpoint:${NC} $ENDPOINT_URL"
    echo ""

    # Get list of all objects in the bucket
    echo -e "${YELLOW}📥 Retrieving file list...${NC}"
    local file_list
    if file_list=$(aws --endpoint-url="$ENDPOINT_URL" s3api list-objects-v2 \
        --bucket "$BUCKET_NAME" \
        --query 'Contents[].Key' \
        --output json \
        --no-sign-request 2>/dev/null); then

        if [ -z "$file_list" ] || [ "$file_list" = "null" ] || [ "$file_list" = "[]" ]; then
            echo -e "${YELLOW}📭 No files found in bucket '$BUCKET_NAME'${NC}"
            exit 0
        fi

        # Count files
        local file_count=$(echo "$file_list" | jq -r '. | length')
        echo -e "${GREEN}✅ Found $file_count file(s)${NC}"
        echo ""

        # Process each file
        echo "$file_list" | jq -r '.[]' | while read -r key; do
            [ -n "$key" ] && get_file_metadata "$key"
        done

        echo -e "${GREEN}✨ Complete! Processed $file_count file(s)${NC}"

    else
        echo -e "${RED}❌ Error: Could not list objects in bucket '$BUCKET_NAME'${NC}"
        echo -e "${RED}   Make sure the bucket exists and LocalStack is running${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
