const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// We will replace the ENTIRE useMemo block with Maya's clean implementation.

// 1. Identify the start and end of the useMemo block.
// Start: const { milkGroup, foamGroup, tempGroup, baseGroup, strengthGroup, otherGroups } = useMemo(() => {
// End: }, [optionGroups, selectedItem]);

const startMarker = `const { milkGroup, foamGroup, tempGroup, baseGroup, strengthGroup, otherGroups } = useMemo(() => {`;
const endMarker = `}, [optionGroups, selectedItem]);`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const mayaCode = `const { milkGroup, foamGroup, tempGroup, baseGroup, strengthGroup, otherGroups } = useMemo(() => {
    if (!optionGroups?.length) {
      return {
        milkGroup: null, foamGroup: null, tempGroup: null, 
        baseGroup: null, strengthGroup: null, otherGroups: []
      };
    }

    const normalize = (str) => (str || '').toLowerCase();
    const hasValue = (group, keyword) => {
      return group.values?.some(v => {
        const valName = normalize(v.name || v.value_name);
        return valName.includes(keyword);
      });
    };

    // Helper to check group name/title/category
    const checkGroup = (group, keywords, category) => {
      const title = normalize(group.title || group.name);
      return keywords.some(k => title.includes(k));
    };

    // 1. Milk
    const milk = optionGroups.find(g => {
      if (checkGroup(g, ['חלב', 'milk'], 'milk')) return true;
      return hasValue(g, 'סויה') || hasValue(g, 'שיבולת') || hasValue(g, 'שקדים');
    });

    // 2. Foam
    const foam = optionGroups.find(g => checkGroup(g, ['קצף', 'foam'], 'texture') || hasValue(g, 'קצף'));

    // 3. Temp
    const temp = optionGroups.find(g => 
      checkGroup(g, ['טמפרטורה', 'חום', 'temp'], 'temperature') || hasValue(g, 'רותח') || hasValue(g, 'פושר')
    );

    // 4. Base
    let base = optionGroups.find(g => 
      checkGroup(g, ['בסיס', 'base', 'water'], 'base') || hasValue(g, 'בסיס') || hasValue(g, 'מים')
    );

    // Filter base group logic for coffee (keep existing logic)
    const isCoffeeItem = selectedItem?.name?.includes('קפה') ||
      selectedItem?.name?.includes('הפוך') ||
      selectedItem?.name?.includes('אספרסו') ||
      selectedItem?.name?.includes('נס') ||
      selectedItem?.name?.includes('מקיאטו');

    if (base && isCoffeeItem) {
      const hasWaterOrMilkBase = base.values.some(v =>
        v?.name?.includes('מים') || v?.name?.includes('חלב') || v?.name?.includes('סודה')
      );
      if (!hasWaterOrMilkBase) base = null;
    }

    // 5. Strength
    const strength = optionGroups.find(g => 
      checkGroup(g, ['חוזק', 'strength'], 'strength') || hasValue(g, 'חזק') || hasValue(g, 'חלש')
    );

    // Find optionsGroup for exclusion
    const optionsGroup = optionGroups.find(g => 
      g.name?.includes('אפשרויות') || g.name?.includes('תוספות מיוחדות')
    );

    // Filter others: Exclude categorized groups and optionsGroup by ID
    const others = optionGroups.filter(g => {
      const exclusions = [
        milk?.id, foam?.id, temp?.id, base?.id, strength?.id, optionsGroup?.id
      ].filter(Boolean); // Remove nulls
      return !exclusions.includes(g.id);
    });

    return {
      milkGroup: milk, foamGroup: foam, tempGroup: temp,
      baseGroup: base, strengthGroup: strength, otherGroups: others
    };`;

    // Replace the block
    const preBlock = content.substring(0, startIndex);
    const postBlock = content.substring(endIndex); // Includes the closing line? No, endIndex points to start of endMarker.

    // Actually, I want to replace everything including the endMarker? No, let's keep the endMarker clean or include it in replacement.
    // The mayaCode includes the opening line but NOT the closing line/array.

    // Let's construct it precisely.
    // mayaCode ends with "};". 
    // We need to append "}, [optionGroups, selectedItem]);"

    const replacement = mayaCode + '\n  ' + endMarker;

    // We replace from startIndex to endIndex + endMarker.length
    const fullEndIndex = endIndex + endMarker.length;

    const newContent = content.substring(0, startIndex) + replacement + content.substring(fullEndIndex);

    fs.writeFileSync(path, newContent, 'utf8');
    console.log("Successfully applied Maya's optimized useMemo logic.");

} else {
    console.error("Could not find useMemo block bounds.", startIndex, endIndex);
}
