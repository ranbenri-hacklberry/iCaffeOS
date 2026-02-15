const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// The error is around:
// try {
//     console.log('🚀 ModifierModal Reaching Return Statement - Rendering JSX');
//     return (

// We simply want to remove "try {" and keep the return.
// We also remove the log if we want to be clean.

const brokenBlock = `  try {
    console.log('🚀 ModifierModal Reaching Return Statement - Rendering JSX');
    return (`;

const fixedBlock = `    // console.log('🚀 ModifierModal Reaching Return Statement - Rendering JSX');
    return (`;

if (content.includes(brokenBlock)) {
    content = content.replace(brokenBlock, fixedBlock);
    console.log("Successfully removed stray try-block.");
    fs.writeFileSync(path, content, 'utf8');
} else {
    // Try less strict matching
    const looseMatch = /try\s*{\s*console\.log\('🚀 ModifierModal Reaching Return Statement - Rendering JSX'\);\s*return \(/;
    if (looseMatch.test(content)) {
        content = content.replace(looseMatch, "return (");
        console.log("Successfully removed stray try-block via Regex.");
        fs.writeFileSync(path, content, 'utf8');
    } else {
        console.error("Could not find the broken syntax block to fix.");
    }
}
