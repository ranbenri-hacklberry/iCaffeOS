const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/index.jsx';

let content = fs.readFileSync(path, 'utf8');

// FIX 1: Add menuItems to the useEffect dependency array so items reload when menu is ready
const oldDependency = `}, []);`;
const lineBeforeDependency = `      }
    }
  }, []);`;

if (content.includes(lineBeforeDependency)) {
    const fixedDependency = `      }
    }
  }, [menuItems]); // Added menuItems dependency so edit data loads after menu is ready`;

    content = content.replace(lineBeforeDependency, fixedDependency);
    console.log("Fixed useEffect dependency for edit mode.");
} else {
    console.warn("Could not find exact useEffect closing.");
}

// FIX 2: Make handleBack more defensive - always allow navigation if in edit mode
const oldHandleBack = `    if (hasChanges) {
      console.log('⚠️ Unsaved changes detected, showing exit confirmation');
      setShowExitConfirmModal(true);
      return;
    }`;

const fixedHandleBack = `    // In edit mode, if cart is empty (loading failed), allow immediate exit
    if (isEditMode && !hasItems) {
      console.log('🔙 Edit mode with empty cart - allowing exit without confirmation');
      clearOrderSessionState();
      if (origin === 'kds') {
        navigate('/kds', { state: { viewMode: editData?.viewMode || 'active' } });
      } else {
        navigate('/mode-selection');
      }
      return;
    }

    if (hasChanges) {
      console.log('⚠️ Unsaved changes detected, showing exit confirmation');
      setShowExitConfirmModal(true);
      return;
    }`;

content = content.replace(oldHandleBack, fixedHandleBack);
console.log("Fixed handleBack to allow exit when cart fails to load.");

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully patched menu-ordering-interface.");
