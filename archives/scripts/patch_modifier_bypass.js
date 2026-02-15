const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

// Logic Injection: MANUAL FETCH WITH RPC BYPASS FOR VALUES
const fetchRemoteLogic = `    const fetchRemote = async () => {
      setIsRemoteLoading(true);
      setRawDebugData(null); 
      setDebugStep('INIT_BYPASS');

      const updateStep = (step, data = null) => {
        console.log(\`🪜 STEP: \${step}\`);
        setDebugStep(step);
        if (data) setRawDebugData(prev => Array.isArray(prev) ? [...prev, { step, data }] : [{ step, data }]);
      };

      try {
        const tId = Number(targetItemId);

        // A. FETCH GROUPS (Direct - seems to work based on logs)
        updateStep('FETCH_GROUPS');
        
        const { data: privGroups } = await supabase.from('optiongroups').select('*').eq('menu_item_id', tId);
        
        const { data: links } = await supabase.from('menuitemoptions').select('group_id').eq('item_id', tId);
            
        let sharedGroups = [];
        if (links && links.length > 0) {
            const linkIds = links.map(l => l.group_id);
            const { data: sGroups } = await supabase.from('optiongroups').select('*').in('id', linkIds);
            sharedGroups = sGroups || [];
        }

        const allGroups = [...(privGroups || []), ...sharedGroups];
        updateStep(\`GOT_\${allGroups.length}_GROUPS\`, allGroups);

        if (allGroups.length === 0) {
            setRemoteData([]);
            return;
        }

        // B. FETCH VALUES via RPC BYPASS
        const groupIds = allGroups.map(g => g.id);
        updateStep('RPC_VALUES', { groupIds });

        // 🔥 CALL NEW RPC
        const { data: allValues, error: vErr } = await supabase
            .rpc('get_values_for_groups', { target_group_ids: groupIds });

        if (vErr) {
            // Fallback to normal select if RPC fails/not exists yet
            console.warn("RPC Failed, falling back to select", vErr);
            updateStep('RPC_FAIL_FALLBACK');
            const { data: fbValues } = await supabase.from('optionvalues').select('*').in('group_id', groupIds);
            updateStep(\`GOT_\${fbValues?.length}_VALS_FALLBACK\`, fbValues);
            
            // Merge Logic (Fallback)
             const result = allGroups.map(g => ({
                ...g,
                values: (fbValues || [])
                    .filter(v => v.group_id === g.id)
                    .map(v => ({ ...v, name: v.name || v.value_name || 'Unk' }))
                    .sort((a,b) => (a.display_order||0) - (b.display_order||0))
            }));
            setRemoteData(result);
            return;
        }

        updateStep(\`GOT_\${allValues?.length || 0}_VALUES_RPC\`, allValues);

        // C. MERGE
        const result = allGroups.map(g => ({
            ...g,
            values: (allValues || [])
                .filter(v => v.group_id === g.id)
                .map(v => ({ ...v, name: v.name || v.value_name || 'Unk' })) // Safety
                .sort((a,b) => (a.display_order||0) - (b.display_order||0))
        }));

        setRemoteData(result);
        updateStep('DONE_BYPASS');

      } catch (err) {
        console.error("Bypass Fetch Error:", err);
        setRawDebugData({ error: err.message, step: 'CRASH' });
        setDebugStep('ERROR');
      } finally {
        setIsRemoteLoading(false);
      }
    };`;

const wholeEffect = `  // 2. Fallback to Supabase (RPC BYPASS) - v2.4.0
  useEffect(() => {
    if (!isOpen || !targetItemId) return;
    if (dexieOptions && dexieOptions.length > 0) return;
    if (isRemoteLoading || remoteData) return;

    ${fetchRemoteLogic}

    fetchRemote();
  }, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);`;


// EXECUTE PATCH
try {
    let content = fs.readFileSync(path, 'utf8');

    // Find v2.3.9 logic block
    const effStart = '// 2. Fallback to Supabase (MANUAL DIRECT) - v2.3.9';
    // Use dependency array line as reliable anchor
    const depArrayLine = '}, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);';

    const sIdx = content.indexOf(effStart);
    const eIdx = content.indexOf(depArrayLine, sIdx);

    if (sIdx !== -1 && eIdx !== -1) {
        const before = content.substring(0, sIdx);
        const after = content.substring(eIdx + depArrayLine.length);
        content = before + wholeEffect + after;
        console.log("Replaced useEffect with RPC BYPASS Logic.");
    } else {
        console.warn("Could not find v2.3.9 Effect block. Check markers.");
    }

    // Update Debugger UI Version title
    content = content.replace('MANUAL FETCH v2.3.9', 'RPC BYPASS v2.4.0');

    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully patched ModifierModal to v2.4.0.');

} catch (e) {
    console.error("Patch script failed:", e);
}
