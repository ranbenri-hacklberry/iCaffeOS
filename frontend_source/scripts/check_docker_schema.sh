#!/bin/bash
# ============================================================
# check_docker_schema.sh
# בדוק שכל העמודות הנדרשות קיימות ב-Docker local Supabase
# הרץ: bash scripts/check_docker_schema.sh
# ============================================================

SUPABASE_URL="${VITE_LOCAL_SUPABASE_URL:-http://127.0.0.1:54321}"
SERVICE_KEY="${VITE_LOCAL_SERVICE_ROLE_KEY}"

# Load .env if not already set
if [ -z "$SERVICE_KEY" ] && [ -f ".env" ]; then
    export $(grep -E "^VITE_LOCAL_SERVICE_ROLE_KEY|^VITE_LOCAL_SUPABASE_URL" .env | xargs) 2>/dev/null
    SUPABASE_URL="${VITE_LOCAL_SUPABASE_URL:-http://127.0.0.1:54321}"
    SERVICE_KEY="${VITE_LOCAL_SERVICE_ROLE_KEY}"
fi

if [ -z "$SERVICE_KEY" ]; then
    echo "❌ Missing VITE_LOCAL_SERVICE_ROLE_KEY - check your .env file"
    exit 1
fi

echo ""
echo "🔍 Checking Docker Supabase schema at: $SUPABASE_URL"
echo "═══════════════════════════════════════════════════"

MISSING=0

check_column() {
    local TABLE=$1
    local COLUMN=$2
    # Use information_schema via PostgREST RPC or direct REST
    local RESULT=$(curl -s \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        "$SUPABASE_URL/rest/v1/rpc/check_column_exists" \
        -d "{\"p_table\":\"$TABLE\",\"p_column\":\"$COLUMN\"}" 2>/dev/null)

    # Fallback: query information_schema directly
    if echo "$RESULT" | grep -q "PGRST"; then
        RESULT=$(curl -s \
            -H "apikey: $SERVICE_KEY" \
            -H "Authorization: Bearer $SERVICE_KEY" \
            "$SUPABASE_URL/rest/v1/$TABLE?limit=0&select=$COLUMN" 2>/dev/null)
        if echo "$RESULT" | grep -qE "PGRST204|could not find"; then
            RESULT="false"
        else
            RESULT="true"
        fi
    fi

    if echo "$RESULT" | grep -q "true"; then
        echo "  ✓  $TABLE.$COLUMN"
    else
        echo "  ✗  $TABLE.$COLUMN  ← MISSING"
        MISSING=$((MISSING + 1))
    fi
}

echo ""
echo "📋 businesses:"
check_column "businesses" "subscription_active"
check_column "businesses" "subscription_plan"
check_column "businesses" "subscription_expires_at"
check_column "businesses" "stripe_customer_id"
check_column "businesses" "stripe_subscription_id"

echo ""
echo "📋 employees:"
check_column "employees" "gender"

echo ""
echo "📋 customers:"
check_column "customers" "gender"

echo ""
echo "📋 orders:"
check_column "orders" "is_local_only"

echo ""
echo "📋 order_items:"
check_column "order_items" "status"

echo ""
echo "═══════════════════════════════════════════════════"
if [ "$MISSING" -eq 0 ]; then
    echo "✅ All required columns exist! Schema is up to date."
else
    echo "⚠️  $MISSING column(s) missing."
    echo ""
    echo "📌 Fix: Apply the migration:"
    echo ""
    echo "  npx supabase db push"
    echo ""
    echo "  OR manually:"
    echo "  cat supabase/migrations/20260219171200_add_missing_columns_docker_schema.sql | \\"
    echo "    docker exec -i supabase_db_\$(docker ps --filter name=supabase_db --format '{{.Names}}' | head -1 | sed 's/supabase_db_//') \\"
    echo "    psql -U postgres"
fi
echo ""
