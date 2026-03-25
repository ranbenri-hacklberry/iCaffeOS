import React, { useEffect, useState, useMemo } from 'react';
import {
  X, Check, Coffee, Milk, Leaf, Wheat, Nut,
  Cloud, CloudOff, Thermometer, Flame, Droplets,
  Zap, Ban, Puzzle, ArrowUpFromLine, ArrowDownToLine, Blend, Gauge, Apple, Disc,
  Plus, Minus, Package, ChefHat
} from 'lucide-react';
import { fetchManagerItemOptions } from '@/lib/managerApi';

const formatPrice = (price = 0) => {
  const numPrice = Number(price);
  return numPrice > 0 ? `+${numPrice}₪` : '';
};

// Helper function to get icon based on value name
const getIconForValue = (valueName, groupName) => {
  const name = (valueName || '').toLowerCase();
  const group = (groupName || '').toLowerCase();

  // Milk icons
  if (group.includes('חלב') || group.includes('milk')) {
    if (name.includes('סויה')) return Leaf;
    if (name.includes('שיבולת')) return Wheat;
    if (name.includes('שקדים')) return Nut;
    return Milk;
  }

  // Foam icons
  if (group.includes('קצף') || group.includes('foam')) {
    if (name.includes('הרבה') || name.includes('extra')) return ArrowUpFromLine;
    if (name.includes('מעט') || name.includes('little')) return ArrowDownToLine;
    if (name.includes('בלי') || name.includes('none')) return X;
    return Cloud;
  }

  // Temperature icons
  if (group.includes('טמפרטורה') || group.includes('temp')) {
    if (name.includes('רותח') || name.includes('hot')) return Flame;
    if (name.includes('פושר') || name.includes('warm')) return Thermometer;
    return Thermometer;
  }

  // Base icons
  if (group.includes('בסיס') || group.includes('base')) {
    if (name.includes('מים') || name.includes('water')) return Droplets;
    if (name.includes('חצי')) return Blend;
    return Droplets;
  }

  // Strength icons
  if (group.includes('חוזק') || group.includes('strength')) {
    if (name.includes('חזק') || name.includes('strong')) return Gauge;
    if (name.includes('חלש') || name.includes('weak')) return Coffee;
    return Zap;
  }

  // Topping icons (for pizza/toast)
  const groupLower = group.toLowerCase();
  if (groupLower.includes('תוספות') || groupLower.includes('topping')) {
    if (name.includes('עגבניות') || name.includes('tomato')) return Apple;
    if (name.includes('זיתים') || name.includes('olive')) return Disc;
    if (name.includes('בצל') || name.includes('onion')) return Disc;
    return Disc;
  }

  // Special icons
  if (name.includes('נטול')) return Ban;
  if (name.includes('מפורק')) return Puzzle;

  return Coffee;
};

// Milk Card Component (Hero Section)
const MilkCard = ({ label, Icon, price, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex-1 flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-2xl
        font-semibold transition-all duration-200 touch-manipulation min-h-[88px] active:scale-95
        ${isSelected
          ? "bg-orange-50 text-orange-600 ring-2 ring-orange-400 ring-offset-2 shadow-lg shadow-orange-100"
          : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md"
        }
      `}
    >
      <Icon
        size={24}
        strokeWidth={isSelected ? 2.5 : 2}
        className={`transition-transform duration-200 ${isSelected ? "scale-110" : ""}`}
      />
      <span className="text-sm">{label}</span>
      {price > 0 && (
        <span className={`text-xs font-medium ${isSelected ? "text-orange-500" : "text-slate-400"}`}>
          +₪{price}
        </span>
      )}
    </button>
  );
};

// Modifier Pill Button
const ModifierPill = ({ label, Icon, isSelected, onClick, variant = "default", price }) => {
  const selectedStyles =
    variant === "purple"
      ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
      : "bg-slate-800 text-white shadow-lg shadow-slate-300";

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl
        font-medium transition-all duration-200 touch-manipulation active:scale-95
        ${isSelected
          ? selectedStyles
          : "bg-white text-slate-600 border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50"
        }
      `}
    >
      <Icon size={18} strokeWidth={isSelected ? 2.5 : 2} />
      <span className="text-sm">{label}</span>
      {price !== undefined && price > 0 && (
        <span className={`text-xs ${isSelected ? "text-white/80" : "text-slate-400"}`}>
          +₪{price}
        </span>
      )}
    </button>
  );
};

const ModifierModal = (props) => {
  const { isOpen, selectedItem, onClose, onAddItem } = props;

  // ⚠️ CRITICAL: All hooks MUST be called before any early returns (React Rules of Hooks)
  const [optionGroups, setOptionGroups] = useState([]);
  const [orderNote, setOrderNote] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [optionSelections, setOptionSelections] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [clerkChoice, setClerkChoice] = useState(null); // 'GRAB_AND_GO' or 'MADE_TO_ORDER'

  // Check if this is an espresso item
  const isEspresso = selectedItem?.name?.includes('אספרסו');
  const isConditional = selectedItem?.kds_routing_logic === 'CONDITIONAL';

  const [lastLoadedId, setLastLoadedId] = useState(null);

  // Reset state when selectedItem changes (only if it's a NEW item)
  useEffect(() => {
    const currentId = selectedItem?.id || selectedItem?.menu_item_id;
    if (currentId && currentId !== lastLoadedId) {
      console.log('🔄 [ModifierModal] Resetting for new item:', currentId);
      setOptionGroups([]);
      setOptionSelections({});
      setShowAdvanced(false);
      setOrderNote('');
      setIsNoteOpen(false);
      setItemQuantity(1);
      setClerkChoice(null);
      setLastLoadedId(currentId);
    }
  }, [selectedItem?.id]);

  useEffect(() => {
    if (!isOpen || !selectedItem) {
      return;
    }

    const currentId = selectedItem?.id || selectedItem?.menu_item_id;
    // 🛡️ DUAL-LOAD GUARD: If we already have options for this specific ID, don't re-trigger the load logic
    // this specifically fixes the 'shakiness' of jsonb items that might trigger reference changes.
    if (optionGroups.length > 0 && currentId === lastLoadedId) {
      return;
    }

    const loadOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const targetItemId = selectedItem.menu_item_id || selectedItem.id;

        console.log('🔄 Loading Options for:', selectedItem.name, 'ID:', targetItemId);
        
        let fetchedOptions = [];

        // 🛡️ REVERT TO OLD STABLE WAY: Always prioritize table-based options (DB/Cache) over JSONB to fix jank
        if (props.optionsCache && props.optionsCache[targetItemId]) {
          console.log('⚡ Using Cached Options for:', selectedItem.name);
          fetchedOptions = props.optionsCache[targetItemId];
        } else {
          try {
            console.log('🔄 Fetching Options from DB for:', selectedItem.name);
            fetchedOptions = await fetchManagerItemOptions(targetItemId);
            if (props.onCacheUpdate && fetchedOptions?.length > 0) {
              props.onCacheUpdate(prev => ({ ...prev, [targetItemId]: fetchedOptions }));
            }
          } catch (e) {
            console.warn('DB fetch failed, falling back to embedded', e);
          }
        }

        // Fallback to embedded ONLY if DB fetch returned nothing
        if ((!fetchedOptions || fetchedOptions.length === 0) && selectedItem?.modifiers && Array.isArray(selectedItem.modifiers) && selectedItem.modifiers.length > 0) {
          console.log('🍕 Using Embedded JSON Modifiers as fallback for:', selectedItem.name);
          fetchedOptions = selectedItem.modifiers.map(group => {
            const isLogicalMulti = group.logic === 'A' && group.maxSelection !== 1 && group.max_selection !== 1;
            const isMultiSelect = group.is_multiple_select || isLogicalMulti;
            
            return {
              id: group.id || `json-group-${group.name.replace(/\s+/g, '_')}`,
              title: group.name,
              name: group.name,
              type: isMultiSelect ? 'multi' : 'single',
              is_multiple_select: isMultiSelect,
              is_required: group.is_required || group.minSelection > 0 || group.requirement === 'M',
              min_selection: group.minSelection || 0,
              max_selection: group.maxSelection || (isMultiSelect ? 99 : 1),
              category: 'general',
              values: (group.items || []).map((item, idx) => ({
                id: item.id || `json-val-${item.name.replace(/\s+/g, '_')}`,
                name: item.name,
                price: item.price || 0,
                priceAdjustment: item.price || 0,
                is_default: Boolean(item.isDefault || item.is_default) // Crucial for auto-selecting "רגיל"
              }))
            };
          });
        }

        let allOptions = [...(fetchedOptions || []), ...(props.extraGroups || [])];

        // ── Pre-merge milk groups globally before setting state ──
        const isMilkGroupDef = (group) => {
          const title = (group.title || group.name || '').toLowerCase();
          if (['חלב', 'milk', 'תחליף'].some(k => title.includes(k))) return true;
          return group.values?.some(v => {
            const n = (v.name || v.value_name || '').toLowerCase();
            return n.includes('סויה') || n.includes('שיבולת') || n.includes('שקדים') ||
                   n.includes('חלב') || n.includes('soy') || n.includes('oat') || n.includes('almond');
          });
        };

        const milkGroups = allOptions.filter(isMilkGroupDef);
        if (milkGroups.length > 1) {
          console.log('🥛 Merging multiple milk groups into one global group. Discovered:', milkGroups.length);
          const primary = milkGroups[0];
          const secondaryIds = new Set(milkGroups.slice(1).map(g => String(g.id)));

          const seenNames = new Set();
          const mergedValues = [];
          for (const mg of milkGroups) {
            for (const v of (mg.values || [])) {
              const n = (v.name || v.value_name || '').toLowerCase().trim();
              const key = n.includes('סויה') ? 'סויה' :
                          n.includes('שיבולת') ? 'שיבולת' :
                          n.includes('שקדים') ? 'שקדים' :
                          n.includes('רגיל') ? 'רגיל' : n;
              if (!seenNames.has(key)) {
                seenNames.add(key);
                mergedValues.push(v);
              }
            }
          }

          const mergedMilkGroup = {
            ...primary,
            values: mergedValues
          };

          allOptions = allOptions.filter(g => !secondaryIds.has(String(g.id)));
          allOptions = allOptions.map(g => String(g.id) === String(primary.id) ? mergedMilkGroup : g);
        }

        setOptionGroups(allOptions);
        setIsLoadingOptions(false);

        console.log('🔍 ModifierModal AutoAdd Check:', {
          item: selectedItem.name,
          optionsCount: allOptions.length,
          allowAutoAdd: props.allowAutoAdd
        });

        /* 
        // 🛡️ REVED: Removed auto-add logic to prevent modal from closing in user's face
        // if network error occurs OR if they just want to add a note to a plain item.
        if (allOptions.length === 0 && props.allowAutoAdd !== false) {
           ...
        }
        */

        processDefaults(allOptions);

      } catch (error) {
        console.error('Error loading options:', error);
        setIsLoadingOptions(false);
        if (props.allowAutoAdd !== false) {
          onAddItem?.(selectedItem);
          onClose();
        }
      }
    };

    const isMilkGroup = (group) => {
      const title = (group.title || group.name || '').toLowerCase();
      if (['חלב', 'milk', 'תחליף'].some(k => title.includes(k))) return true;
      return group.values?.some(v => {
        const n = (v.name || v.value_name || '').toLowerCase();
        return n.includes('סויה') || n.includes('שיבולת') || n.includes('שקדים') ||
               n.includes('חלב') || n.includes('soy') || n.includes('oat') || n.includes('almond');
      });
    };

    const processDefaults = (options) => {
      const defaults = {};
      const existingSelections = selectedItem.selectedOptions || [];

      options.forEach(group => {
        const groupId = String(group.id);
        const isMultipleSelect = group.is_multiple_select || group.type === 'addition' || group.type === 'multi';
        const isMandatory = group.is_required || group.required || (group.min_selection !== undefined && group.min_selection > 0);

        if (isMultipleSelect) {
          const existingToppings = existingSelections
            .filter(opt => String(opt.groupId) === groupId)
            .map(opt => String(opt.valueId));
          
          if (existingToppings.length > 0) {
            defaults[groupId] = existingToppings;
          } else {
            // New logic: Also support defaults in multi-select groups
            const defaultValues = group.values
              ?.filter(v => v.is_default || (v.name || '').includes('רגיל'))
              .map(v => String(v.id)) || [];
            defaults[groupId] = defaultValues;
          }
          return;
        }

        // --- Single Select Logic ---
        let existingChoice = existingSelections.find(opt =>
          opt.groupId && String(opt.groupId) === groupId
        );

        if (!existingChoice) {
          const matchingValue = group.values?.find(v =>
            existingSelections.some(sel => {
              if (typeof sel === 'string') return sel === v.name;
              return sel.valueName === v.name;
            })
          );
          if (matchingValue) existingChoice = { valueId: matchingValue.id };
        }

        if (existingChoice) {
          const existingVal = group.values?.find(v => String(v.id) === String(existingChoice.valueId));
          if (existingVal) {
            defaults[groupId] = String(existingVal.id);
            return;
          }
        }

        const isMilk = isMilkGroup(group);

        // No existing — set default
        if (isMandatory || isMilk) {
          const defaultVal = group.values?.find(v => v.is_default) ||
            group.values?.find(v => (v.name || '').includes('רגיל'));

          if (defaultVal) {
            defaults[groupId] = String(defaultVal.id);
          } else if (group.values?.length > 0 && isMandatory) {
            const isComplexCoffeeGroup = (group.name || '').includes('קצף') || (group.name || '').includes('טמפרטו');
            if (!isComplexCoffeeGroup) {
              defaults[groupId] = String(group.values[0].id);
            }
          }
        } else {
          const explicitlyDefault = group.values?.find(v => v.is_default);
          if (explicitlyDefault) {
            defaults[groupId] = String(explicitlyDefault.id);
          }
        }
      });


      setOptionSelections(defaults);

      const hasOtherGroupSelections = options.some((group) => {
        if (isMilkGroup(group)) return false;
        return existingSelections.some(opt =>
          String(opt.groupId) === String(group.id)
        );
      });

      const hasMilk = options.some(g => isMilkGroup(g));
      if ((hasOtherGroupSelections && options.length > 1) || !hasMilk) {
        setShowAdvanced(true);
      }
    };

    loadOptions();
  }, [isOpen, selectedItem?.id]);

  const { heroGroup, heroType, foamGroup, tempGroup, baseGroup, strengthGroup, otherGroups } = useMemo(() => {
    if (!optionGroups?.length) return {
      heroGroup: null, heroType: 'none', foamGroup: null, tempGroup: null,
      baseGroup: null, strengthGroup: null, otherGroups: []
    };

    const usedIds = new Set();
    const normalize = (str) => (str || '').toLowerCase();

    const hasValue = (group, keyword) => {
      return group.values?.some(v => {
        const valName = normalize(v.name || v.value_name);
        return valName.includes(keyword);
      });
    };

    const checkGroup = (group, keywords, category) => {
      const title = normalize(group.title || group.name);
      const cat = normalize(group.category);

      if (category && cat === category) return true;
      return keywords.some(k => title.includes(k));
    };

    // 1. Identify Milk Group (now already merged in loadOptions)
    const milkGroups = optionGroups.filter(g => checkGroup(g, ['חלב', 'milk', 'תחליף'], 'milk') || 
      g.values?.some(v => {
        const n = normalize(v.name || v.value_name);
        return n.includes('סויה') || n.includes('שיבולת') || n.includes('שקדים') ||
               n.includes('חלב') || n.includes('soy') || n.includes('oat') || n.includes('almond');
      })
    );
    
    milkGroups.forEach(g => usedIds.add(g.id));
    const milk = milkGroups.length > 0 ? milkGroups[0] : null;

    // ---------------------------------------------------------
    // 2. Identify Espresso Type Group (Start/Short/Long)
    // ---------------------------------------------------------
    const espressoTypeGroup = optionGroups.find(g => {
      if (usedIds.has(g.id)) return false;
      // Check for specific espresso keywords
      const isEspressoType = g.values?.some(v => {
        const n = normalize(v.name || v.value_name);
        return n.includes('קצר') || n.includes('ארוך') || n.includes('כפול');
      });
      return isEspressoType;
    });
    // Note: We don't mark espressoTypeGroup as 'used' here because we might want to render it 
    // in the Hero section, OR we treat it as a special "Hero" candidate.
    // Let's decide: If we found a milk group, that takes Hero precedence usually.
    // BUT for "Espresso", the Coffee Type IS the Hero.

    // Strategy: If selected item is Espresso, the EspressoTypeGroup is the "Milk" (Hero) equivalent.
    let heroGroup = null;
    let heroType = 'none'; // 'milk' or 'coffee-type'

    if (selectedItem?.name?.includes('אספרסו') && espressoTypeGroup) {
      heroGroup = espressoTypeGroup;
      heroType = 'coffee-type';
      usedIds.add(espressoTypeGroup.id);
    } else {
      heroGroup = milk;
      heroType = 'milk';
      // milk IDs already added
    }


    // 3. Foam
    const foam = optionGroups.find(g => {
      if (usedIds.has(g.id)) return false;
      return checkGroup(g, ['קצף', 'foam'], 'texture') || hasValue(g, 'קצף');
    });
    if (foam) usedIds.add(foam.id);

    // 4. Temp
    const temp = optionGroups.find(g => {
      if (usedIds.has(g.id)) return false;
      return checkGroup(g, ['טמפרטורה', 'חום', 'temp'], 'temperature') ||
        hasValue(g, 'רותח') || hasValue(g, 'פושר');
    });
    if (temp) usedIds.add(temp.id);

    // 5. Base
    let base = optionGroups.find(g => {
      if (usedIds.has(g.id)) return false;
      return checkGroup(g, ['בסיס', 'base', 'water'], 'base') ||
        hasValue(g, 'בסיס') || hasValue(g, 'מים');
    });

    // Special verification for base
    if (base) {
      const isCoffeeItem = selectedItem?.name?.includes('קפה') ||
        selectedItem?.name?.includes('הפוך') ||
        selectedItem?.name?.includes('אספרסו') ||
        selectedItem?.name?.includes('נס') ||
        selectedItem?.name?.includes('מקיאטו');

      if (isCoffeeItem) {
        const hasWaterOrMilkBase = base.values.some(v =>
          v.name.includes('מים') || v.name.includes('חלב') || v.name.includes('סודה')
        );
        if (!hasWaterOrMilkBase) {
          base = null;
        }
      }
    }
    if (base) usedIds.add(base.id);

    // 6. Strength
    const strength = optionGroups.find(g => {
      if (usedIds.has(g.id)) return false;
      return checkGroup(g, ['חוזק', 'strength'], 'strength') ||
        hasValue(g, 'חזק') || hasValue(g, 'חלש');
    });
    if (strength) usedIds.add(strength.id);

    // 7. Others - Strictly everything else
    const others = optionGroups.filter(g => !usedIds.has(g.id));

    return {
      heroGroup, heroType, foamGroup: foam, tempGroup: temp,
      baseGroup: base, strengthGroup: strength, otherGroups: others
    };
  }, [optionGroups, selectedItem]);

  const unitPrice = useMemo(() => {
    if (!selectedItem) return 0;
    let sum = Number(selectedItem?.price || 0);

    (optionGroups || []).forEach(group => {
      const selectedId = optionSelections[group.id];
      if (!selectedId) return;

      const isMultipleSelect = group.is_multiple_select || group.type === 'multi';
      if (isMultipleSelect && Array.isArray(selectedId)) {
        selectedId.forEach(id => {
          const value = group.values?.find(v => String(v.id) === String(id));
          const effectivePrice = Number(value?.priceAdjustment || 0);
          if (effectivePrice > 0) sum += effectivePrice;
        });
      } else {
        const value = group.values?.find(v => String(v.id) === selectedId);
        const effectivePrice = Number(value?.priceAdjustment || 0);
        if (effectivePrice > 0) sum += effectivePrice;
      }
    });
    return sum;
  }, [selectedItem?.price, optionGroups, optionSelections]);

  const totalPrice = useMemo(() => {
    return unitPrice * itemQuantity;
  }, [unitPrice, itemQuantity]);

  const toggleOption = (groupId, valueId) => {
    if (!selectedItem) return;

    setOptionSelections(prev => {
      const group = (optionGroups || []).find(g => g.id === groupId);
      const current = prev[groupId];

      // 🥛 MILK RULE: Milk is ALWAYS single select, even if DB says otherwise
      const title = (group?.title || group?.name || '').toLowerCase();
      const isMilkGroup = ['חלב', 'milk', 'תחליף'].some(k => title.includes(k)) || 
                          group?.values?.some(v => (v.name || '').toLowerCase().includes('סויה') || (v.name || '').toLowerCase().includes('שיבולת'));

      // Strict Logic: 'replacement' type is ALWAYS single select
      const isReplacement = group?.type === 'replacement';
      const isMultipleSelect = !isMilkGroup && !isReplacement && (group?.is_multiple_select || group?.type === 'addition' || group?.type === 'multi');

      const isOptional = group?.min_selection === 0 && !group?.is_required;

      // MULTI SELECT
      if (isMultipleSelect) {
        const currentArray = Array.isArray(current) ? current : [];
        const valueIdStr = String(valueId);
        if (currentArray.includes(valueIdStr)) {
          return { ...prev, [groupId]: currentArray.filter(id => id !== valueIdStr) };
        }
        return { ...prev, [groupId]: [...currentArray, valueIdStr] };
      }

      // SINGLE SELECT
      const valueIdStr = String(valueId);

      // If clicking the ALREADY selected item...
      if (String(current) === valueIdStr) {
        // If optional, allow toggle OFF (deselect)
        if (isOptional) {
          return { ...prev, [groupId]: null };
        }
        // If mandatory, do nothing (keep selected)
        return prev;
      }

      // Select new item
      return { ...prev, [groupId]: valueIdStr };
    });
  };

  const handleAdd = () => {
    const selectedOptions = (optionGroups || []).flatMap(group => {
      const selId = optionSelections[group.id];
      if (!selId) return [];

      const isMultipleSelect = group.is_multiple_select || group.type === 'multi';
      if (isMultipleSelect && Array.isArray(selId)) {
        return selId.map(id => {
          const val = group.values.find(v => String(v.id) === String(id));
          if (!val) return null;
          const effectivePrice = Number(val.priceAdjustment || 0);
          return {
            groupId: group.id,
            groupName: group.title || group.name, // Use title
            valueId: val.id,
            valueName: val.name,
            priceAdjustment: effectivePrice
          };
        }).filter(Boolean);
      }

      const val = group.values.find(v => String(v.id) === selId);
      if (!val) return [];
      const effectivePrice = Number(val.priceAdjustment || 0);
      if (val.name?.includes('רגיל') && effectivePrice === 0) return [];

      return [{
        groupId: group.id,
        groupName: group.title || group.name, // Use title
        valueId: val.id,
        valueName: val.name,
        priceAdjustment: effectivePrice
      }];
    });

    if (isConditional && !clerkChoice) {
      // Shaky effect or notification could go here
      alert('יש לבחור סוג הכנה (לקוח קיבל/נדרשת הכנה) כדי להמשיך');
      return;
    }

    onAddItem?.({
      ...selectedItem,
      tempId: `${selectedItem.id}-${Date.now()}`,
      quantity: itemQuantity,
      selectedOptions,
      notes: orderNote, // Add the note here
      totalPrice,
      price: unitPrice,
      // **תיקון קריטי: עדכון ה-Logic לפי בחירת הקופאי**
      kds_routing_logic: isConditional ? clerkChoice : selectedItem.kds_routing_logic
    });
    onClose();
  };

  if (!isOpen || !selectedItem) return null;


  try {
    console.log('🚀 ModifierModal Reaching Return Statement - Rendering JSX');
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        dir="rtl"
        onClick={onClose}
      >
        {/* Backdrop */}
        {/* The backdrop is now part of the main container div */}

        {/* Modal */}
        <div
          className="relative w-auto max-w-[90vw] min-w-[420px] flex flex-col bg-[#FAFAFA] rounded-[2rem] shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center sticky top-0 z-20 border-b border-slate-100/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-inner">
                <Coffee size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  {selectedItem.name}
                  {itemQuantity > 1 && (
                    <span className="text-red-600 animate-pulse border-r-2 border-red-600/20 pr-2 mr-1">
                      x{itemQuantity}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-slate-400">התאמה אישית</p>
              </div>
            </div>

            {/* Quantity Selector - Styled like the modal */}
            <div className="mr-auto flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100/50 shadow-inner">
              <button
                onClick={() => setItemQuantity(prev => (prev > 1 ? prev - 1 : 1))}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 active:scale-90 transition-all shadow-sm"
              >
                <Minus size={18} strokeWidth={3} />
              </button>

              <div className="w-12 text-center text-lg font-black text-slate-800 tabular-nums">
                {itemQuantity}
              </div>

              <button
                onClick={() => setItemQuantity(prev => prev + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-black active:scale-90 transition-all shadow-md"
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px]">

            {/* 🔥 HERO: Clerk Selection (Mandatory for CONDITIONAL items) */}
            {isConditional && (
              <section className="mb-4 animate-in slide-in-from-top-2 duration-300">
                <div className="bg-orange-50/50 p-2.5 rounded-3xl border-2 border-orange-200/50 shadow-sm relative overflow-hidden">
                  {/* Subtle background glow */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-orange-400/10 blur-xl"></div>
                  
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">חובה: בחירת מצב הכנה</span>
                  </div>

                  <div className="flex gap-2">
                    <MilkCard
                      label="לקוח קיבל מוכן"
                      Icon={Package}
                      price={0}
                      isSelected={clerkChoice === 'prep_override'}
                      onClick={() => setClerkChoice('prep_override')}
                    />
                    <MilkCard
                      label="נדרשת הכנה"
                      Icon={ChefHat}
                      price={0}
                      isSelected={clerkChoice === 'MADE_TO_ORDER'}
                      onClick={() => setClerkChoice('MADE_TO_ORDER')}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* 1. Hero Section (Milk OR Coffee Type depending on item) */}
            {heroGroup && heroGroup.values && (
              <section className="order-first mb-4">
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex gap-2">
                    {(() => {
                      const seen = new Set();
                      let values = heroGroup.values?.filter(value => {
                        const name = (value.name || '').toLowerCase();

                        // Always filter out juices and chocolate drinks/mixes if it's milk
                        // BUT if it's Coffee Type (short/long), allow them.
                        if (heroType === 'milk') {
                          if (name.includes('תפוזים') || name.includes('לימונענע') || name.includes('גזר') || name.includes('תפוח')) return false;
                          if (name.includes('שוקו')) return false;
                          // Filter out special modifiers (decaf, dismantled) if they appear in milk group
                          if (name.includes('נטול קפאין') || name.includes('מפורק')) return false;
                          if (name.includes('ללא')) return false;
                        }

                        const shortName = name.includes('סויה') ? 'סויה' :
                          name.includes('שיבולת') ? 'שיבולת' :
                            name.includes('שקדים') ? 'שקדים' :
                              name.includes('רגיל') ? 'רגיל' : name;

                        if (heroType === 'milk') {
                          if (seen.has(shortName)) return false;
                          seen.add(shortName);
                        }
                        return true;
                      }) || [];

                      // Sort logic
                      values.sort((a, b) => {
                        const aName = (a.name || '').toLowerCase();
                        const bName = (b.name || '').toLowerCase();

                        const getScore = (n) => {
                          if (n.includes('רגיל')) return 10;
                          if (n.includes('שיבולת')) return 9;
                          if (n.includes('סויה')) return 8;
                          if (n.includes('שקדים')) return 7;

                          // Coffee Type scores
                          if (n.includes('קצר')) return 6;
                          if (n.includes('ארוך') && !n.includes('כפול')) return 5;
                          if (n.includes('כפול')) return 4;
                          return 0;
                        };

                        return getScore(bName) - getScore(aName); // Descending score
                      });

                      // Deterministic Layout Logic based on Type
                      const isEspressoLayout = heroType === 'coffee-type';

                      return (
                        <div className={isEspressoLayout ? "grid grid-cols-2 gap-2 w-full" : "flex gap-2 w-full"}>
                          {values.map(value => {
                            let displayName = value.name;
                            // Clean names for milk
                            if (heroType === 'milk') {
                              if (displayName.includes('סויה')) displayName = 'סויה';
                              else if (displayName.includes('שיבולת')) displayName = 'שיבולת';
                              else if (displayName.includes('שקדים')) displayName = 'שקדים';
                              else if (displayName.includes('רגיל')) displayName = 'רגיל';
                            }

                             // 🥛 MILK RULE: Forces single-select behavior for Milk
                             const groupTitle = (heroGroup?.title || heroGroup?.name || '').toLowerCase();
                             const isMilkLocal = ['חלב', 'milk', 'תחליף'].some(k => groupTitle.includes(k)) || 
                                               heroGroup?.values?.some(v => (v.name || '').toLowerCase().includes('סויה') || (v.name || '').toLowerCase().includes('שיבולת'));
                             
                             const isMulti = !isMilkLocal && (heroGroup?.is_multiple_select || heroGroup?.type === 'multi');
                             const currentSelection = optionSelections[heroGroup?.id];
                             const isSelected = isMulti 
                               ? (Array.isArray(currentSelection) && currentSelection.includes(String(value.id)))
                               : String(currentSelection) === String(value.id);
                             const IconComponent = getIconForValue(value.name, heroType === 'milk' ? 'milk' : 'general');
                             const effectivePrice = value.priceAdjustment || 0;

                             return (
                               <MilkCard
                                 key={value.id}
                                 label={displayName}
                                 Icon={IconComponent}
                                 price={effectivePrice}
                                 isSelected={isSelected}
                                 onClick={() => toggleOption(heroGroup?.id, String(value.id))}
                               />
                             );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </section>
            )}

            {/* Loading State */}
            {isLoadingOptions && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            )}

            {/* Empty State Message */}
            {(optionGroups || []).length === 0 && !isLoadingOptions && (
              <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 mb-4">
                <p className="font-medium">אין תוספות מובנות לפריט זה</p>
                <p className="text-xs mt-1">אבל אפשר לכתוב הערות חופשיות למטה 👇</p>
              </div>
            )}

            {/* 2. Modifiers Grid (Dynamic Columns) */}
            {(foamGroup || tempGroup || baseGroup || strengthGroup) && (
              <section>
                <div className={`grid gap-4 ${[foamGroup, tempGroup, baseGroup, strengthGroup].filter(Boolean).length === 1
                  ? 'grid-cols-1'
                  : [foamGroup, tempGroup, baseGroup, strengthGroup].filter(Boolean).length === 2
                    ? 'grid-cols-2'
                    : [foamGroup, tempGroup, baseGroup, strengthGroup].filter(Boolean).length === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-4'
                  }`}>

                  {/* Foam Column */}
                  {foamGroup && (
                    <div className="space-y-1.5 min-w-[140px]">
                      <p className="text-xs text-slate-400 text-center mb-1">קצף</p>
                      {foamGroup.values?.filter(v => {
                        const name = (v.name || '').toLowerCase();
                        return !name.includes('רגיל') && !name.includes('default');
                      }).map(value => {
                        const isMulti = foamGroup?.is_multiple_select || foamGroup?.type === 'multi';
                        const currentSelection = optionSelections[foamGroup?.id];
                        const isSelected = isMulti 
                          ? (Array.isArray(currentSelection) && currentSelection.includes(String(value.id)))
                          : String(currentSelection) === String(value.id);
                        const IconComponent = getIconForValue(value.name, 'foam');
                        const effectivePrice = value.priceAdjustment || 0;

                        return (
                          <ModifierPill
                            key={value.id}
                            label={value.name}
                            Icon={IconComponent}
                            isSelected={isSelected}
                            onClick={() => toggleOption(foamGroup.id, String(value.id))}
                            price={effectivePrice}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Temperature Column */}
                  {tempGroup && (
                    <div className="space-y-1.5 min-w-[140px]">
                      <p className="text-xs text-slate-400 text-center mb-1">טמפרטורה</p>
                      {tempGroup.values?.filter(v => {
                        const name = (v.name || '').toLowerCase();
                        return !name.includes('רגיל') && !name.includes('default');
                      }).map(value => {
                        const isMulti = tempGroup?.is_multiple_select || tempGroup?.type === 'multi';
                        const currentSelection = optionSelections[tempGroup?.id];
                        const isSelected = isMulti 
                          ? (Array.isArray(currentSelection) && currentSelection.includes(String(value.id)))
                          : String(currentSelection) === String(value.id);
                        const IconComponent = getIconForValue(value.name, 'temp');
                        const effectivePrice = value.priceAdjustment || 0;

                        return (
                          <ModifierPill
                            key={value.id}
                            label={value.name}
                            Icon={IconComponent}
                            isSelected={isSelected}
                            onClick={() => toggleOption(tempGroup.id, String(value.id))}
                            price={effectivePrice}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Base Column */}
                  {baseGroup && (
                    <div className="space-y-1.5 min-w-[140px]">
                      <p className="text-xs text-slate-400 text-center mb-1">בסיס</p>
                      {baseGroup.values?.filter(v => {
                        const name = (v.name || '').toLowerCase();
                        return !name.includes('רגיל') && !name.includes('default');
                      }).map(value => {
                        const isMulti = baseGroup?.is_multiple_select || baseGroup?.type === 'multi';
                        const currentSelection = optionSelections[baseGroup?.id];
                        const isSelected = isMulti 
                          ? (Array.isArray(currentSelection) && currentSelection.includes(String(value.id)))
                          : String(currentSelection) === String(value.id);
                        const IconComponent = getIconForValue(value.name, 'base');
                        const effectivePrice = value.priceAdjustment || 0;

                        return (
                          <ModifierPill
                            key={value.id}
                            label={value.name}
                            Icon={IconComponent}
                            isSelected={isSelected}
                            onClick={() => toggleOption(baseGroup.id, String(value.id))}
                            price={effectivePrice}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Strength Column */}
                  {strengthGroup && (
                    <div className="space-y-1.5 min-w-[140px]">
                      <p className="text-xs text-slate-400 text-center mb-1">חוזק</p>
                      {strengthGroup.values?.filter(v => {
                        const name = (v.name || '').toLowerCase();
                        return !name.includes('רגיל') && !name.includes('default');
                      }).map(value => {
                        const isMulti = strengthGroup?.is_multiple_select || strengthGroup?.type === 'multi';
                        const currentSelection = optionSelections[strengthGroup?.id];
                        const isSelected = isMulti 
                          ? (Array.isArray(currentSelection) && currentSelection.includes(String(value.id)))
                          : String(currentSelection) === String(value.id);
                        const IconComponent = getIconForValue(value.name, 'strength');
                        const effectivePrice = value.priceAdjustment || 0;

                        return (
                          <ModifierPill
                            key={value.id}
                            label={value.name}
                            Icon={IconComponent}
                            isSelected={isSelected}
                            onClick={() => toggleOption(strengthGroup.id, String(value.id))}
                            price={effectivePrice}
                          />
                        );
                      })}
                    </div>
                  )}

                </div>
              </section>
            )}

            {/* 4. Other Groups (Toppings, etc.) */}
            {otherGroups.length > 0 && (
              <div className="flex flex-col gap-4">
                {otherGroups.map((group) => {
                  const isMultipleSelect = group.is_multiple_select || group.type === 'multi';
                  const visibleOptions = (group.values || []).filter(v => {
                    if (!v.name) return false;
                    const lower = (v.name || '').toLowerCase();
                    // Keep 'מפורק' and 'נטול' filtering as they are handled in the special row
                    if (lower.includes('מפורק')) return false;
                    if (lower.includes('נטול')) return false;
                    return true;
                  });

                  if (visibleOptions.length === 0) return null;

                  return (
                    <div key={group.id} className="flex flex-col gap-2 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                      <h4 className="text-sm font-black text-slate-800 px-1">{group.name}</h4>
                      <div className={`grid gap-2 ${isMultipleSelect
                        ? (visibleOptions.length === 4 ? 'grid-cols-2' : 'grid-cols-3')
                        : (visibleOptions.length === 4 ? 'grid-cols-2' : visibleOptions.length <= 2 ? 'grid-cols-2' : 'grid-cols-3')
                        }`}>
                        {visibleOptions.map(value => {
                          const valueIdStr = String(value.id);
                          let isSelected;
                          if (isMultipleSelect) {
                            const selectedArray = Array.isArray(optionSelections[group.id])
                              ? optionSelections[group.id]
                              : [];
                            isSelected = selectedArray.some(id => String(id) === valueIdStr);
                          } else {
                            isSelected = String(optionSelections[group.id]) === valueIdStr;
                          }

                          const effectivePrice = value.priceAdjustment || 0;

                          return (
                            <button
                              key={value.id}
                              onClick={() => toggleOption(group.id, String(value.id))}
                              className={`
                                relative flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-2xl
                                font-semibold transition-all duration-200 touch-manipulation min-h-[88px] active:scale-95
                                ${isSelected
                                  ? "bg-orange-50 text-orange-600 ring-2 ring-orange-400 ring-offset-2 shadow-lg shadow-orange-100"
                                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md"
                                }
                              `}
                            >
                              {(() => {
                                const groupLower = (group.title || group.name || '').toLowerCase();
                                const valueName = (value.name || value.value_name || '').toLowerCase();

                                // Use emojis for toppings, icons for everything else
                                const IconComponent = getIconForValue(value.name || value.value_name, group.title || group.name);
                                return <IconComponent size={24} strokeWidth={isSelected ? 2.5 : 2} className={`transition-transform duration-200 ${isSelected ? "scale-110" : ""}`} />;
                              })()}
                              <span className="text-sm text-center">{value.name || value.value_name}</span>
                              {effectivePrice > 0 && (
                                <span className={`text-xs font-medium ${isSelected ? "text-orange-500" : "text-slate-400"}`}>
                                  +₪{effectivePrice}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Special Options Row: Decaf | Note - AT BOTTOM */}
            <section className="mt-2">
              {(() => {
                const specialOptions = [];
                const isCoffeeItem = selectedItem?.name?.includes('אספרסו') ||
                  selectedItem?.name?.includes('הפוך') ||
                  selectedItem?.name?.includes('מוקה') ||
                  selectedItem?.name?.includes('אמריקנו');

                [...(optionGroups || [])].forEach(group => {
                  group.values?.forEach(val => {
                    if (val.name?.includes('מפורק')) {
                      specialOptions.push({ ...val, groupId: group.id });
                    }
                    if (val.name?.includes('נטול') && isCoffeeItem) {
                      specialOptions.push({ ...val, groupId: group.id });
                    }
                  });
                });

                specialOptions.sort((a, b) => {
                  const aIsDecaf = a.name?.includes('נטול');
                  const bIsDecaf = b.name?.includes('נטול');
                  if (aIsDecaf && !bIsDecaf) return -1;
                  if (!aIsDecaf && bIsDecaf) return 1;
                  return 0;
                });

                const hasSpecialOptions = specialOptions.length > 0;
                const gridCols = hasSpecialOptions ? 'grid-cols-2' : 'grid-cols-1';

                return (
                  <div className={`grid gap-3 ${gridCols}`}>
                    {hasSpecialOptions && (
                      <div className="flex gap-2">
                         {specialOptions.map(value => {
                           const group = (optionGroups || []).find(g => String(g.id) === String(value.groupId));
                           const isMulti = group?.is_multiple_select || group?.type === 'multi';
                           const currentSelection = optionSelections[value.groupId];
                           const isSelected = isMulti 
                             ? (Array.isArray(currentSelection) && currentSelection.includes(String(value.id)))
                             : String(currentSelection) === String(value.id);
                           const IconComponent = getIconForValue(value.name || '', '');
                           const effectivePrice = value.priceAdjustment || 0;
                           const displayName = value.name.includes('נטול') ? 'נטול קפאין' : 'מפורק';

                           return (
                             <button
                               key={value.id}
                               onClick={() => toggleOption(value.groupId, String(value.id))}
                               className={`flex-1 relative flex items-center justify-center gap-2 h-[50px] rounded-xl border transition-all duration-200 ${isSelected
                                 ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-500'
                                 : 'bg-white border-slate-200 hover:border-slate-300'
                                 }`}
                             >
                               <IconComponent size={16} className={isSelected ? 'text-purple-600' : 'text-slate-400'} />
                              <span className={`text-sm font-bold ${isSelected ? 'text-purple-700' : 'text-slate-600'}`}>
                                {displayName}
                              </span>
                              {effectivePrice > 0 && (
                                <span className="text-[10px] text-slate-400 ml-1">+{effectivePrice}₪</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Note Input Pill - Only show if allow_notes is not false */}
                    {selectedItem?.allow_notes !== false && (
                      <div className={`relative flex items-center h-[50px] rounded-xl border transition-all duration-200 ${orderNote.length > 0
                        ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}>

                        <input
                          type="text"
                          value={orderNote}
                          onChange={(e) => setOrderNote(e.target.value)}
                          maxLength={50}
                          placeholder="הוסף הערה"
                          className={`w-full h-full bg-transparent text-center font-bold text-sm focus:outline-none px-2 placeholder:text-slate-400 ${orderNote.length > 0 ? 'text-orange-600' : 'text-slate-800'
                            }`}
                        />

                        {orderNote.length > 0 && (
                          <span className="absolute bottom-1 left-2 text-[9px] text-orange-400 font-medium">
                            {orderNote.length}/50
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </section>


          </div>
          <div className="p-3 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="w-1/3 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors active:scale-95"
              >
                ביטול
              </button>
              <button
                onClick={handleAdd}
                disabled={isConditional && !clerkChoice}
                className={`flex-1 h-12 rounded-2xl flex items-center justify-between px-6 text-base font-bold shadow-xl transition-all active:scale-98 ${
                  isConditional && !clerkChoice 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                  : "bg-slate-900 hover:bg-black text-white shadow-slate-300/50"
                }`}
              >
                <span>{isConditional && !clerkChoice ? "בחר מצב הכנה" : "הוסף להזמנה"}</span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-xl ${
                   isConditional && !clerkChoice ? "bg-slate-100" : "bg-white/15"
                }`}>
                  <span>₪{totalPrice}</span>
                  <Check size={16} />
                </div>
              </button>
            </div>
          </div>
        </div >
      </div >
    );
  } catch (error) {
    console.error("ModifierModal crashed:", error, error.message, error.stack);
    return null;
  }
};

export default React.memo(ModifierModal);
