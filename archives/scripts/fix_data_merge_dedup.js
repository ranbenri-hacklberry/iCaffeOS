const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// We are looking for the merging logic block.
// Around line 440:
// const optionGroups = useMemo(() => {
//     const raw = dexieOptions || remoteData || [];
//     const fromProps = props.extraGroups || [];
//     const combined = [...raw, ...fromProps];
//
//     const uniqueMap = new Map();
//     combined.forEach(g => {
//       if (!uniqueMap.has(g.name)) {  <-- THE BUG IS HERE! USING NAME instead of ID!

const buggyBlock = `    const uniqueMap = new Map();
    combined.forEach(g => {
      if (!uniqueMap.has(g.name)) {
        const valMap = new Map();`;

// The fix: Use ID as key, fallback to name if ID missing.
const fixedBlock = `    const uniqueMap = new Map();
    combined.forEach(g => {
      // FIX V20: Dedup by ID first, fallback to name
      const key = g.id || g.name; 
      if (!uniqueMap.has(key)) {
        const valMap = new Map();`;

if (content.includes(buggyBlock)) {
    content = content.replace(buggyBlock, fixedBlock);

    // We also need to fix the `uniqueMap.set(g.name, ...)` line inside deeply.
    // It's likely: uniqueMap.set(g.name, {

    const setLineOld = `uniqueMap.set(g.name, {`;
    const setLineNew = `uniqueMap.set(key, {`;

    if (content.includes(setLineOld)) {
        content = content.replace(setLineOld, setLineNew);
        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully patched data merging logic to use ID instead of Name.");
    } else {
        console.warn("Could not find uniqueMap.set line.");
    }

} else {
    // Try relaxed matching
    console.warn("Could not find exact buggy block.");
    // Let's look for "uniqueMap.has(g.name)" specifically
    if (content.includes(`if (!uniqueMap.has(g.name))`)) {
        content = content.replace(`combined.forEach(g => {`, `combined.forEach(g => {\n      const key = g.id || g.name;`);
        content = content.replace(`if (!uniqueMap.has(g.name))`, `if (!uniqueMap.has(key))`);
        content = content.replace(`uniqueMap.set(g.name, {`, `uniqueMap.set(key, {`);
        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully patched (relaxed match).");
    }
}
