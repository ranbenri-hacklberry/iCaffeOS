const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/index.jsx';

let content = fs.readFileSync(path, 'utf8');

// Fix: Add a ref to track if edit data was already loaded
// Insert after the other useRefs at the top of the component

// Find a good anchor - look for existing useRef declarations
const refAnchor = `const [isEditMode, setIsEditMode] = useState(false);`;

if (content.includes(refAnchor)) {
    const withRef = `const [isEditMode, setIsEditMode] = useState(false);
  const editDataLoadedRef = useRef(false); // Track if edit data was loaded`;

    content = content.replace(refAnchor, withRef);
    console.log("Added editDataLoadedRef.");
}

// Now modify the useEffect to check the ref
const oldUseEffect = `  // Check for edit mode on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editOrderId = urlParams.get('editOrderId');

    // Safety Check: Redirect if ID is explicitly "undefined" string
    if (editOrderId === 'undefined' || editOrderId === 'null') {
      console.error('❌ Detected invalid editOrderId in URL:', editOrderId);
      navigate(currentUser?.business_id ? '/kds' : '/'); // Fallback logic
      return;
    }

    if (editOrderId) {`;

const newUseEffect = `  // Check for edit mode on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editOrderId = urlParams.get('editOrderId');

    // Safety Check: Redirect if ID is explicitly "undefined" string
    if (editOrderId === 'undefined' || editOrderId === 'null') {
      console.error('❌ Detected invalid editOrderId in URL:', editOrderId);
      navigate(currentUser?.business_id ? '/kds' : '/'); // Fallback logic
      return;
    }

    // Only load edit data once, and only when menuItems is ready
    if (editOrderId && !editDataLoadedRef.current && menuItems.length > 0) {
      editDataLoadedRef.current = true; // Mark as loaded`;

if (content.includes(oldUseEffect)) {
    content = content.replace(oldUseEffect, newUseEffect);
    console.log("Fixed useEffect to run only once when menuItems is ready.");
    fs.writeFileSync(path, content, 'utf8');
} else {
    console.warn("Could not find useEffect block.");
}
