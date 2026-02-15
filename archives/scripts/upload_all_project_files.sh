#!/bin/bash

# Configuration
COLLECTION_ID="collection_b1470bb9-6e71-4f10-91fa-73edd1377bc2"
MANAGEMENT_KEY="xai-token-FMhfqMMUtTR7MyfWXATxQ0QYjReoewjmhDilimkHx1NkATh3A2KXEpaKGXev0D4EXDVx0kgnRFdlPK6V"
API_KEY="xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"

# Find ALL relevant files recursively in src, and at root level
FILES=$(find frontend_source/src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.sql" -o -name "*.md" -o -name "*.json" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -name "package-lock.json")
ROOT_FILES=$(find . -maxdepth 1 -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.sql" -o -name "*.md" -o -name "*.json" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -name "package-lock.json")

ALL_FILES="$FILES $ROOT_FILES"
COUNT=$(echo "$ALL_FILES" | wc -w) # Word count to count space-separated files
echo "🚀 Starting mass upload of $COUNT files to collection: $COLLECTION_ID"

i=1
for file in $ALL_FILES; do
  # Remove leading ./ if present
  clean_file=$(echo $file | sed 's|^\./||')
  
  # Check if it was already processed (basic check by name, though ID is safer)
  # For now just upload everything to be sure
  
  echo "--- [$i/$COUNT] 📄 Processing: $clean_file ---"
  
  # Step 1: Upload file to storage
  FILE_RES=$(curl -s -X POST https://api.x.ai/v1/files \
    -H "Authorization: Bearer $API_KEY" \
    -F "file=@$clean_file")
  
  FILE_ID=$(echo $FILE_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$FILE_ID" ]; then
    echo "❌ Error uploading $clean_file to storage: $FILE_RES"
  else
    echo "   File ID: $FILE_ID"
    
    # Step 2: Add document to collection
    ADD_RES=$(curl -s -X POST "https://management-api.x.ai/v1/collections/$COLLECTION_ID/documents/$FILE_ID" \
      -H "Authorization: Bearer $MANAGEMENT_KEY" \
      -H "Content-Type: application/json" \
      -d '{}')
    
    if [ "$ADD_RES" == "{}" ]; then
      echo "✅ Successfully added to collection"
    else
      echo "❌ Error adding to collection: $ADD_RES"
    fi
  fi
  
  ((i++))
done

echo "🏁 Mass upload complete! $COUNT files processed."
