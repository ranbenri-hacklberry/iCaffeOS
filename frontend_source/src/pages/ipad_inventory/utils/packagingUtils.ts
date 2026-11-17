import { PackagingLevel } from "@/pages/ipad_inventory/types";

/**
 * Convert a quantity at a given packaging level to base units.
 * e.g. convertToBase(3, 2, levels) where levels[2].qty=1000 -> 3000
 */
export const convertToBase = (
    qty: number,
    levelIndex: number,
    levels: PackagingLevel[]
): number => qty * (levels[levelIndex]?.qty ?? 1);

/**
 * Convert base units to a quantity at a given packaging level.
 * e.g. convertFromBase(3000, 2, levels) where levels[2].qty=1000 -> 3
 */
export const convertFromBase = (
    baseQty: number,
    levelIndex: number,
    levels: PackagingLevel[]
): number => baseQty / (levels[levelIndex]?.qty ?? 1);

/**
 * Get packaging levels from an inventory item, with fallback for items
 * that don't have the packaging JSON set.
 */
export const getPackagingLevels = (item: any): { levels: PackagingLevel[]; countLevel: number } => {
    // 1. If the item has explicit packaging JSON, use it directly
    const pkg = item?.packaging || item?.settings?.packaging;
    if (pkg?.levels?.length) {
        return {
            levels: pkg.levels,
            countLevel: pkg.countLevel ?? 0
        };
    }

    const itemName = (item?.name || "").trim();
    const itemUnit = (item?.unit || "").trim();
    const rawUnit = (item?.unit || item?.base_unit || "").trim().toLowerCase();
    const caseQty = Number(item?.case_quantity) || 1;
    const countStep = Number(item?.count_step || item?.inventory_count_step) || 1;

    // 2. Special handling for Cups & Lids (שרוול + קרטון - ספירה לעולם לא בכוסות בודדות)
    const isCupItem = itemName.includes("כוס") || itemName.includes("כוסות");
    const isLidItem = itemName.includes("מכסה") || itemName.includes("מכסים");
    if (isCupItem || isLidItem) {
        let sleeveQty = 50;
        let cartonQty = caseQty > 1 ? caseQty : 1000;

        if (cartonQty === 960) {
            sleeveQty = 40; // 24 שרוולים של 40 = 960
        } else if (isLidItem && cartonQty === 1000) {
            sleeveQty = 100; // 10 שרוולים של 100 = 1000
        } else if (cartonQty >= 500) {
            sleeveQty = 50;
        } else if (cartonQty > 50) {
            sleeveQty = Math.round(cartonQty / 10);
        }

        const levels: PackagingLevel[] = [
            { name: "יח׳", qty: 1, count_step: 1 },
            { name: "שרוול", qty: sleeveQty, count_step: 1 },
            { name: "קרטון", qty: cartonQty, count_step: 1 }
        ];

        return { levels, countLevel: 1 };
    }

    // 3. Special handling for Coffee Beans (קפה אספרסו פולים / קפה ללא קפאין - שקיות קילו, קפיצות 100 גרם)
    const isCoffeeBeans = (itemName.includes("קפה") || itemName.includes("אספרסו") || itemName.includes("פולי")) && 
                          (rawUnit.includes("גרם") || rawUnit === "g" || rawUnit.includes("ק\"ג"));
    if (isCoffeeBeans) {
        const levels: PackagingLevel[] = [
            { name: "גרם", qty: 1, count_step: 100 },       // קפיצות 100 גרם
            { name: "ק\"ג", qty: 1000, count_step: 0.1 },    // קפיצות 0.1 ק\"ג (= 100 גרם)
            { name: "שקית (1 ק\"ג)", qty: 1000, count_step: 1 }
        ];
        return { levels, countLevel: 1 };
    }

    // 4. Standard Discrete/Packaged Items (שקית, יח׳, מארז, קופסה, בקבוק, פחית, חבילה, קרטון, דלי...)
    const isDiscreteUnit = !["גרם", "g", "grams", "מ\"ל", "ml"].includes(rawUnit);
    if (isDiscreteUnit) {
        const unitName = itemUnit || item?.display_unit || item?.base_unit || "יח׳";
        const levels: PackagingLevel[] = [{ name: unitName, qty: 1, count_step: countStep }];
        if (caseQty > 1) {
            levels.push({ name: "קרטון", qty: caseQty, count_step: 1 });
        }
        return { levels, countLevel: 0 };
    }

    // 5. Weight & Liquid Items (גרמים / מ\"ל)
    const isGramBased = rawUnit.includes("גרם") || rawUnit === "g" || rawUnit === "grams";
    const smallUnit = isGramBased ? "גרם" : "מ\"ל";
    const largeUnit = isGramBased ? "ק\"ג" : "ליטר";
    const levels: PackagingLevel[] = [
        { name: smallUnit, qty: 1, count_step: 100 },
        { name: largeUnit, qty: 1000, count_step: 0.1 }
    ];
    if (caseQty > 1 && caseQty !== 1000) {
        levels.push({ name: "מארז", qty: caseQty, count_step: 1 });
    }
    return { levels, countLevel: 1 };
};

/**
 * Sanitize a value for numeric DB columns.
 * Converts empty strings, null, undefined to a fallback value.
 */
export const sanitizeNumeric = (val: any, fallback: number | null = 0): number | null => {
    if (val === "" || val === null || val === undefined) return fallback;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
};
