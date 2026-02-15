#!/bin/bash

# Script to apply Maya Biometric migration to remote Supabase
# Run this to manually apply the migration if supabase db push doesn't work

echo "🔄 Applying Maya Biometric Migration to Remote Supabase..."
echo ""
echo "📋 Instructions:"
echo "1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new"
echo "2. Copy the entire content of: supabase/migrations/20260210000000_maya_biometric_system.sql"
echo "3. Paste it into the SQL Editor"
echo "4. Click 'Run'"
echo ""
echo "Or run this command to copy the SQL to clipboard:"
echo ""

if command -v pbcopy &> /dev/null; then
    cat supabase/migrations/20260210000000_maya_biometric_system.sql | pbcopy
    echo "✅ SQL copied to clipboard! Paste it in Supabase SQL Editor."
elif command -v xclip &> /dev/null; then
    cat supabase/migrations/20260210000000_maya_biometric_system.sql | xclip -selection clipboard
    echo "✅ SQL copied to clipboard! Paste it in Supabase SQL Editor."
else
    echo "📄 Copy this file manually:"
    echo "   supabase/migrations/20260210000000_maya_biometric_system.sql"
fi

echo ""
echo "🔗 Direct link (replace YOUR_PROJECT_ID):"
echo "   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new"
