const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

// Logic Fix: Force showAdvanced to true always to prevent hiding groups
// We find where 'const [showAdvanced, setShowAdvanced] = useState' is used or initialized.
// Actually, let's just find the render condition or the effect that sets it.

let content = fs.readFileSync(path, 'utf8');

// The logic we saw earlier:
// if ((hasOtherGroupSelections && options.length > 1) || !hasMilkGroup) { setShowAdvanced(true); }

// We want to force it.
// Let's replace the useState init:
// const [showAdvanced, setShowAdvanced] = useState(false);
// to:
// const [showAdvanced, setShowAdvanced] = useState(true); // Force Open

const stateOld = 'const [showAdvanced, setShowAdvanced] = useState(false);';
const stateNew = 'const [showAdvanced, setShowAdvanced] = useState(true); // 🔥 Forced Open';

if (content.includes(stateOld)) {
    content = content.replace(stateOld, stateNew);
    console.log("Forced showAdvanced to start TRUE.");
} else {
    // Maybe it was already changed or different formatting?
    console.warn("Could not find useState(false) for showAdvanced.");
}

// remove the effect that might set it to false?
// The effect we saw ONLY sets it to true: `setShowAdvanced(true)`. It doesn't seem to set it to false.
// So initializing it to TRUE should be enough.

fs.writeFileSync(path, content, 'utf8');
