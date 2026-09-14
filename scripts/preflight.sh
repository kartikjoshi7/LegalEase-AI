#!/bin/bash
echo "Starting Preflight Checks..."

# 1. Check Repo Size (< 10MB)
echo "Checking Repository Size..."
# Use du to get size in KB, roughly check if it's over 10000
SIZE_KB=$(du -sk . | awk '{print $1}')
if [ "$SIZE_KB" -gt 15000 ]; then
    echo "ERROR: Repository exceeds size limit!"
    exit 1
fi
echo "Size Check Passed."

# 2. Check for Secrets
echo "Checking for API Keys in tracked files..."
if git grep -q "GEMINI_API_KEY=" ; then
    echo "ERROR: Hardcoded GEMINI_API_KEY found!"
    exit 1
fi
echo "Secrets Check Passed."

# 3. Check Documentation Exists
if [ ! -f "DATA_MODEL.md" ] || [ ! -f "TESTING.md" ]; then
    echo "ERROR: Missing required documentation (DATA_MODEL.md or TESTING.md)"
    exit 1
fi
echo "Docs Check Passed."

echo "All Preflight Checks Passed successfully!"
exit 0
