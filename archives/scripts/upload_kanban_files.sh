#!/bin/bash

# Configuration
COLLECTION_ID="collection_b1470bb9-6e71-4f10-91fa-73edd1377bc2"
MANAGEMENT_KEY="xai-token-FMhfqMMUtTR7MyfWXATxQ0QYjReoewjmhDilimkHx1NkATh3A2KXEpaKGXev0D4EXDVx0kgnRFdlPK6V"
API_KEY="xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"

# Define files to upload (relative to project root)
FILES=(
  "frontend_source/src/hooks/useOrders.js"
  "frontend_source/src/pages/kds/hooks/useKDSData.js"
  "frontend_source/src/components/kanban/KanbanBoard.jsx"
  "frontend_source/src/components/kanban/KanbanColumn.jsx"
  "frontend_source/src/components/kanban/DraggableOrderCard.jsx"
  "frontend_source/src/pages/kanban/index.jsx"
  "frontend_source/src/db/database.js"
  "frontend_source/src/services/syncService.js"
  "frontend_source/src/services/offlineQueue.js"
  "frontend_source/src/hooks/useOrderAlerts.js"
  "frontend_source/src/pages/kds/components/OrderCard.jsx"
  "frontend_source/src/utils/kdsUtils.js"
)

echo "🚀 Starting upload process to collection: $COLLECTION_ID"

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "--- 📄 Processing: $file ---"
    
    # Step 1: Upload file to storage
    echo "1. Uploading to storage..."
    FILE_RES=$(curl -s -X POST https://api.x.ai/v1/files \
      -H "Authorization: Bearer $API_KEY" \
      -F "file=@$file")
    
    FILE_ID=$(echo $FILE_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$FILE_ID" ]; then
      echo "❌ Error uploading file storage: $FILE_RES"
      continue
    fi
    
    echo "   File ID: $FILE_ID"
    
    # Step 2: Add document to collection
    echo "2. Adding to collection..."
    ADD_RES=$(curl -s -X POST "https://management-api.x.ai/v1/collections/$COLLECTION_ID/documents/$FILE_ID" \
      -H "Authorization: Bearer $MANAGEMENT_KEY" \
      -H "Content-Type: application/json" \
      -d '{}')
    
    if [ "$ADD_RES" == "{}" ]; then
      echo "✅ Successfully added to collection"
    else
      echo "❌ Error adding to collection: $ADD_RES"
    fi
  else
    echo "⚠️ File not found: $file"
  fi
done

echo "🏁 All files processed!"
