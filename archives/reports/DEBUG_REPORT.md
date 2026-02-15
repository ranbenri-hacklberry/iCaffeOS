# Maya Sales Data RPC Debug Report

## Problem Description

The `get_sales_data` RPC function consistently returns 0 for the `total` revenue field, despite valid underlying data in `order_items` and `menu_items`.

## Symptoms

1. Maya reports "₪0" revenue.
2. Direct SQL queries via Supabase SQL Editor return correct calculated totals.
3. RPC execution via the app (client-side) returns 0.

## What We Tried

1. **Column Existence Check:** Verified `o.total` does not exist in `orders`. Switched to calculating total on-the-fly.
2. **Simple Calculation:** `SUM(oi.quantity * mi.price)` inside the JSON build object. Result: 0.
3. **Type Casting:** Added `::NUMERIC` to `mi.price` to handle potential string types. Result: 0.
4. **Lateral Join:** Refactored query to use `CROSS JOIN LATERAL` to pre-calculate totals before JSON aggregation. Result: 0.
5. **Auth Linkage:** Verified user is linked to employee and business. `Access Denied` errors were resolved, but data is zero.

## Hypotheses

1. **RLS Issue:** Even with `SECURITY DEFINER`, the internal query joining `menu_items` might be failing RLS checks for the authenticated user context if policies are strictly scoped to business_id and for some reason the context isn't propagating or `menu_items` RLS is blocking read.
2. **Data Consistency:** Potential mismatch in `business_id` between `orders` and `menu_items` causing the JOIN to yield empty results within the RPC scope (though direct query works).

## Current RPC Code (Version 4 - Lateral Join)

```sql
CREATE OR REPLACE FUNCTION get_sales_data(
    p_start_date TEXT, 
    p_end_date TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sales_data JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'created_at', o.created_at,
            'total', COALESCE(sub.order_total, 0),
            'order_items', sub.items_json
        )
    ) INTO v_sales_data
    FROM orders o
    CROSS JOIN LATERAL (
        SELECT 
            SUM(oi.quantity * mi.price::numeric) as order_total,
            jsonb_agg(jsonb_build_object('name', mi.name, 'quantity', oi.quantity)) as items_json
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = o.id
    ) sub
    WHERE o.created_at >= p_start_date::TIMESTAMPTZ
    AND o.created_at <= p_end_date::TIMESTAMPTZ
    LIMIT 100;

    RETURN COALESCE(v_sales_data, '[]'::JSONB);
END;
$$;
```

## Next Steps for Grok

- Analyze RLS policies on `menu_items`.
- Suggest a way to force-bypass RLS purely for the specific calculation within the RPC or verify why `SECURITY DEFINER` isn't sufficient (it should be).
- Check if `search_path` or other environment variables in PL/PGSQL affect the JOIN execution.
