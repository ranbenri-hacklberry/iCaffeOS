const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

const newContent = `  // 2. Fallback to Supabase (Remote) - SURGICAL DEBUGGING V2.3.2
  // ════════════════════════════════════════════════════════════════════
  // FALLBACK EFFECT - With Enhanced Logging
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const effectId = \`effect-\${Date.now()}\`;
    
    console.log(\`🟢 [\${effectId}] FALLBACK EFFECT TRIGGERED\`, {
      isOpen,
      targetItemId,
      dexieOptions: dexieOptions === undefined ? 'UNDEFINED' : dexieOptions === null ? 'NULL' : \`ARRAY(\${dexieOptions.length})\`,
      isRemoteLoading,
      hasRemoteData: !!remoteData,
      timestamp: new Date().toISOString(),
    });

    // Guard clauses
    if (!isOpen) {
      console.log(\`🟢 [\${effectId}] SKIP: Modal not open\`);
      return;
    }

    if (!targetItemId) {
      console.log(\`🟢 [\${effectId}] SKIP: No targetItemId\`);
      return;
    }

    // Wait for Dexie to resolve (undefined → value or null)
    if (dexieOptions === undefined) {
      console.log(\`🟢 [\${effectId}] WAITING: Dexie query still pending...\`);
      return;
    }

    // Check if Dexie has valid data
    const hasValidData = dexieOptions && 
      dexieOptions.length > 0 && 
      dexieOptions.every(g => g.values && g.values.length > 0);

    console.log(\`🟢 [\${effectId}] DEXIE VALIDATION:\`, {
      dexieOptions: dexieOptions ? \`\${dexieOptions.length} groups\` : 'null',
      hasValidData,
      groupsWithValues: dexieOptions ? dexieOptions.filter(g => g.values?.length > 0).length : 0,
      groupsWithoutValues: dexieOptions ? dexieOptions.filter(g => !g.values || g.values.length === 0).length : 0,
    });

    if (hasValidData) {
      console.log(\`🟢 [\${effectId}] ✅ Using Dexie data - Skipping RPC\`);
      return;
    }

    // Skip if already loading or loaded
    if (isRemoteLoading) {
      console.log(\`🟢 [\${effectId}] SKIP: Already loading from Supabase\`);
      return;
    }

    if (remoteData) {
      console.log(\`🟢 [\${effectId}] SKIP: Already have remote data\`);
      return;
    }

    console.warn(\`🟢 [\${effectId}] 🚨 TRIGGERING SUPABASE RPC FALLBACK\`);

    const fetchRemote = async () => {
      const rpcId = \`rpc-\${Date.now()}\`;
      
      console.group(\`🟠 [\${rpcId}] SUPABASE RPC START\`);
      console.log('📋 Context:', {
        targetItemId,
        itemIdType: typeof targetItemId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        location: window.location.href,
        supabaseUrl: supabase?.supabaseUrl || 'UNDEFINED',
        hasSupabaseKey: !!supabase?.supabaseKey,
      });

      setIsRemoteLoading(true);

      try {
        console.log(\`🟠 [\${rpcId}] Calling RPC: get_item_modifiers...\`);
        const rpcStartTime = performance.now();
        
        const { data, error, status, statusText } = await supabase
          .rpc('get_item_modifiers', { 
            target_item_id: targetItemId 
          });

        const rpcDuration = performance.now() - rpcStartTime;

        console.log(\`🟠 [\${rpcId}] RPC Response:\`, {
          duration: \`\${rpcDuration.toFixed(2)}ms\`,
          status,
          statusText,
          hasError: !!error,
          hasData: !!data,
          dataType: data ? (Array.isArray(data) ? \`Array(\${data.length})\` : typeof data) : 'null/undefined',
        });

        if (error) {
          console.error(\`🟠 [\${rpcId}] ❌ RPC ERROR:\`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            fullError: error,
          });
          console.groupEnd();
          return;
        }

        if (!data || data.length === 0) {
          console.warn(\`🟠 [\${rpcId}] ⚠️ RPC returned empty/null\`);
          setRemoteData([]); 
          console.groupEnd();
          return;
        }

        // Processing Logic (Simplified for brevity but robust)
        const groupsMap = new Map();
        data.forEach(row => {
          if (!groupsMap.has(row.group_id)) {
            groupsMap.set(row.group_id, {
              id: row.group_id,
              name: row.group_name,
              is_required: row.is_required,
              is_multiple_select: row.is_multiple_select,
              min_selection: row.min_selection,
              max_selection: row.max_selection,
              display_order: row.display_order,
              values: []
            });
          }
          if (row.value_id) {
            const group = groupsMap.get(row.group_id);
            if (!group.values.some(v => v.id === row.value_id)) {
              group.values.push({
                id: row.value_id,
                group_id: row.group_id,
                name: row.value_name,
                priceAdjustment: row.price_adjustment,
                display_order: row.value_display_order,
                is_default: row.is_default
              });
            }
          }
        });

        const enhanced = Array.from(groupsMap.values()).map(g => ({
          ...g,
          values: g.values.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        })).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        console.log(\`🟠 [\${rpcId}] ✅ Data Processed: \${enhanced.length} groups\`);
        setRemoteData(enhanced);
        console.groupEnd();

      } catch (err) {
        console.error(\`🟠 [\${rpcId}] ❌ EXCEPTION:\`, err);
        console.groupEnd();
      } finally {
        setIsRemoteLoading(false);
      }
    };

    fetchRemote();
  }, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);`;

let content = fs.readFileSync(path, 'utf8');

// Find start
const startMarker = '// 2. Fallback to Supabase (Remote)';
const startIndex = content.indexOf(startMarker);

// Find end (the line with dependency array)
// It looks like: }, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);
const endMarker = '}, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);';
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const finalEndIndex = endIndex + endMarker.length;
    const before = content.substring(0, startIndex);
    const after = content.substring(finalEndIndex);

    const finalContent = before + newContent + after;
    fs.writeFileSync(path, finalContent, 'utf8');
    console.log('Successfully replaced ModifierModal fallback logic.');
} else {
    console.error('Could not find start or end markers.');
    console.log('Start Index:', startIndex);
    console.log('End Index:', endIndex);
}
