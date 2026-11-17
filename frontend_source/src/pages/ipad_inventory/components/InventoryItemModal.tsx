import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, Save, Pencil, Check, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { InventoryItem, Supplier, PackagingLevel } from "@/pages/ipad_inventory/types";
import { sanitizeNumeric } from "@/pages/ipad_inventory/utils/packagingUtils";

const MotionDiv = motion.div as any;

const SelectWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`relative ${className || ""}`}>
        {children}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown size={16} />
        </div>
    </div>
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface InventoryItemModalProps {
    isOpen: boolean;
    item: InventoryItem | null;
    initialData?: {
        invoiceName?: string;
        supplierId?: string;
        unit?: string;
        price?: number;
    };
    suppliers: Supplier[];
    categories: string[];
    businessId: string;
    onClose: () => void;
    onSaved: () => void;
}

interface FormData {
    name: string;
    supplier_product_name: string[];
    manufacturer_name: string;
    supplier_id: string;
    category: string;
    unit: string;
    current_stock: number | "";
    weight_per_unit: number | "";
    packaging_levels: PackagingLevel[];
    packaging_countLevel: number;
    count_step: number;
    recipe_step: number;
    cost_per_unit: number | "";
    low_stock_threshold_units: number | "";
    target_stock: number | "";
    yield_percentage: number | "";
    location: string;
    min_order: number | "";
    order_step: number | "";
}

const UNITS = [
    "יח׳",
    "שקית",
    "מארז",
    "חבילה",
    "קופסה",
    "בקבוק",
    "פחית",
    "קרטון",
    "דלי",
    "צנצנת",
    "ק\"ג",
    "גרם",
    "ליטר",
    "מ\"ל"
];

const PACKAGING_TYPES = ["קרטון", "שרוול", "שקית", "קופסה", "חבילה", "מארז", "מגש", "דלי", "צנצנת", "פאלט"];
const CATEGORIES = ["ירקות", "פירות", "פירות קפואים", "חלבים", "מוצרי חלב", "יבשים", "תבלינים", "שימורים", "חד פעמי", "ממרחים", "מרכיבי פיצה", "מאפים", "שוקולד", "שונות", "כללי", "coffee"];

// ─── Price & Unit helpers ───────────────────────────────────────────────────

const isWeightUnit = (u: string) => ["גרם", "ק\"ג", "מ\"ל", "ליטר", "L", "grams"].includes(u);
const isLiquidUnit = (u: string) => ["מ\"ל", "ליטר", "L"].includes(u);

const getAvailableCountSteps = (unit: string) => {
    if (unit === "גרם" || unit === "grams") {
        return [
            { label: "100 גרם", value: 100 },
            { label: "50 גרם", value: 50 },
            { label: "10 גרם", value: 10 },
            { label: "1 גרם", value: 1 }
        ];
    }
    if (unit === "ק\"ג" || unit === "ליטר" || unit === "L") {
        return [
            { label: "1 שלם", value: 1 },
            { label: "½ חצי (0.5)", value: 0.5 },
            { label: "0.1 (100 גרם/מ״ל)", value: 0.1 }
        ];
    }
    return [
        { label: "1 שלם", value: 1 },
        { label: "½ חצי", value: 0.5 },
        { label: "¼ רבע", value: 0.25 }
    ];
};

const parseSupplierProductNames = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
            } catch {
                // ignore
            }
        }
        if (trimmed && trimmed !== "[]") return [trimmed];
    }
    return [];
};

// ─── Component ───────────────────────────────────────────────────────────────

const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
    isOpen, item, initialData, suppliers, categories: existingCategories, businessId, onClose, onSaved
}) => {
    const isEditMode = !!item;
    const allCategories = useMemo(() => {
        const set = new Set([...CATEGORIES, ...existingCategories]);
        return Array.from(set).sort();
    }, [existingCategories]);

    // ─── Form State ──────────────────────────────────────────────────────────
    const buildInitialFormData = (): FormData => {
        if (item) {
            const currentUnit = item.unit || (item.base_unit && item.base_unit !== "g" && item.base_unit !== "ml" ? item.base_unit : "יח׳");
            const pkg = item.packaging || item.settings?.packaging;
            const levels: PackagingLevel[] = pkg?.levels?.length
                ? pkg.levels
                : [{ name: currentUnit, qty: 1, count_step: item.count_step || item.inventory_count_step || 1 }];
            const defaultRecipeStep = isWeightUnit(currentUnit) ? 10 : 1;
            return {
                name: item.name || "",
                supplier_product_name: parseSupplierProductNames(item.supplier_product_name),
                manufacturer_name: item.manufacturer_name || "",
                supplier_id: item.supplier_id ? String(item.supplier_id) : "",
                category: item.category || "",
                unit: currentUnit,
                current_stock: item.current_stock ?? 0,
                weight_per_unit: item.weight_per_unit || "",
                packaging_levels: levels,
                packaging_countLevel: pkg?.countLevel ?? 0,
                count_step: item.count_step ?? item.inventory_count_step ?? 1,
                recipe_step: item.recipe_step ?? defaultRecipeStep,
                cost_per_unit: item.cost_per_unit || "",
                low_stock_threshold_units: item.low_stock_threshold_units || "",
                target_stock: item.target_stock || "",
                yield_percentage: item.yield_percentage ?? 100,
                location: item.location || "",
                min_order: item.min_order || "",
                order_step: item.order_step || "",
            };
        }
        const initialUnit = initialData?.unit || "יח׳";
        const defaultRecipeStep = isWeightUnit(initialUnit) ? 10 : 1;
        return {
            name: "",
            supplier_product_name: initialData?.invoiceName ? [initialData.invoiceName] : [],
            manufacturer_name: "",
            supplier_id: initialData?.supplierId || "",
            category: "",
            unit: initialUnit,
            current_stock: 0,
            weight_per_unit: "",
            packaging_levels: [{ name: initialUnit, qty: 1, count_step: 1 }],
            packaging_countLevel: 0,
            count_step: 1,
            recipe_step: defaultRecipeStep,
            cost_per_unit: initialData?.price || "",
            low_stock_threshold_units: "",
            target_stock: "",
            yield_percentage: 100,
            location: "",
            min_order: "",
            order_step: "",
        };
    };

    const [formData, setFormData] = useState<FormData>(buildInitialFormData);
    const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState("");
    const [newTagInput, setNewTagInput] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [customCategory, setCustomCategory] = useState("");
    const [showCustomCategory, setShowCustomCategory] = useState(false);

    // ─── Tab state ───────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<"details" | "advanced">("details");

    // ─── Price editing state ─────────────────────────────────────────────────
    const [isPriceEditing, setIsPriceEditing] = useState(false);
    const [editPkgPrice, setEditPkgPrice] = useState<number | "">("");
    const [editPkgQty, setEditPkgQty] = useState<number | "">("");
    const [priceViewMode, setPriceViewMode] = useState<"kg" | "package" | "gram" | "unit">("unit");
    const [advPillLevel, setAdvPillLevel] = useState<number>(0);

    useEffect(() => {
        if (isOpen) {
            const initialForm = buildInitialFormData();
            setFormData(initialForm);
            setIsCreatingSupplier(false);
            setNewSupplierName("");
            setNewTagInput("");
            setIsSaving(false);
            setCustomCategory("");
            setShowCustomCategory(false);
            setActiveTab("details");
            setIsPriceEditing(false);
            const levels = initialForm.packaging_levels;
            setAdvPillLevel(levels.length > 1 ? levels.length - 1 : 0);
            const unit = initialForm.unit;
            setPriceViewMode(isWeightUnit(unit) ? "kg" : "unit");
        }
    }, [isOpen, item?.id]);

    const updateField = (field: keyof FormData, value: any) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const handleCategoryChange = (cat: string) => {
        if (cat === "__custom__") {
            setShowCustomCategory(true);
            return;
        }
        updateField("category", cat);
    };

    // ─── Price calculations ──────────────────────────────────────────────────

    const openPriceEdit = () => {
        const cpu = Number(formData.cost_per_unit) || 0;
        const levels = formData.packaging_levels;
        const mainLevel = levels[levels.length - 1];
        const mainQty = mainLevel?.qty || 1;
        const pkgTotal = cpu * mainQty;
        setEditPkgPrice(pkgTotal > 0 ? pkgTotal : "");
        setEditPkgQty(cpu > 0 ? mainQty : "");
        setIsPriceEditing(true);
    };

    const confirmPriceEdit = () => {
        const price = Number(editPkgPrice) || 0;
        const qty = Number(editPkgQty) || 1;
        if (qty <= 0) return;
        const newCostPerUnit = price / qty;
        const roundedQty = Math.max(1, Math.round(qty));

        const newLevels = [...formData.packaging_levels];
        if (newLevels.length > 1) {
            newLevels[newLevels.length - 1] = { ...newLevels[newLevels.length - 1], qty: roundedQty };
        } else if (roundedQty > 1) {
            newLevels.push({ name: "מארז", qty: roundedQty, count_step: 1 });
        }

        setFormData(prev => ({
            ...prev,
            cost_per_unit: Number(newCostPerUnit.toFixed(4)),
            packaging_levels: newLevels,
        }));
        setIsPriceEditing(false);
    };

    const computePriceDisplay = () => {
        const cpu = Number(formData.cost_per_unit) || 0;
        const unit = formData.unit;
        const isWeight = isWeightUnit(unit);
        const isLiquid = isLiquidUnit(unit);
        const wpu = Number(formData.weight_per_unit) || 0;
        const levels = formData.packaging_levels;
        const mainLevel = levels[levels.length - 1];
        const baseQty = mainLevel?.qty || 1;
        const pkgPrice = cpu * baseQty;

        switch (priceViewMode) {
            case "kg": {
                if (unit === "גרם" || unit === "grams") return { price: cpu * 1000, label: "לק\"ג" };
                if (unit === "מ\"ל") return { price: cpu * 1000, label: "לליטר" };
                if (isLiquid) return { price: cpu, label: "לליטר" };
                if (wpu > 0 && !isWeight) return { price: cpu / (wpu / 1000), label: "לק\"ג" };
                return { price: cpu, label: "לק\"ג" };
            }

            case "package": {
                const pkgLabel = (() => {
                    if (baseQty <= 1) return `ל${unit}`;
                    if ((unit === "גרם" || unit === "grams") && baseQty >= 1000)
                        return `לאריזה (${(baseQty / 1000).toFixed(2)} ק\"ג)`;
                    if (unit === "מ\"ל" && baseQty >= 1000)
                        return `לאריזה (${(baseQty / 1000).toFixed(2)} ליטר)`;
                    return `לאריזה (${baseQty} ${unit})`;
                })();
                return { price: pkgPrice, label: pkgLabel };
            }

            case "gram":
                if (unit === "ק\"ג") return { price: cpu / 1000, label: "לגרם" };
                if (unit === "גרם" || unit === "grams") return { price: cpu, label: "לגרם" };
                if (unit === "L" || unit === "ליטר") return { price: cpu / 1000, label: "למ\"ל" };
                if (unit === "מ\"ל") return { price: cpu, label: "למ\"ל" };
                if (wpu > 0) return { price: cpu / wpu, label: "לגרם" };
                return { price: cpu, label: "לגרם" };

            case "unit":
            default:
                return { price: cpu, label: `ל${unit}` };
        }
    };

    const getAvailableViewModes = () => {
        const unit = formData.unit;
        const isWeight = isWeightUnit(unit);
        const isLiquid = isLiquidUnit(unit);
        const wpu = Number(formData.weight_per_unit) || 0;
        const cpuLocal = Number(formData.cost_per_unit) || 0;

        const modes: { key: string; label: string; price: number; subLabel?: string }[] = [];
        const levels = formData.packaging_levels;

        if (isWeight) {
            modes.push({ key: "kg", label: isLiquid ? "ליטר" : "ק\"ג", price: (unit === "גרם" || unit === "מ\"ל") ? cpuLocal * 1000 : cpuLocal });
            for (let i = levels.length - 1; i >= 1; i--) {
                const l = levels[i];
                if (l.name) modes.push({ key: `pkg_${i}`, label: l.name, price: cpuLocal * l.qty, subLabel: `${l.qty} ${levels[0].name}` });
            }
            modes.push({ key: "gram", label: isLiquid ? "מ\"ל" : "גרם", price: (unit === "ק\"ג" || unit === "L" || unit === "ליטר") ? cpuLocal / 1000 : cpuLocal });
        } else {
            // Discrete item (יח׳, שקית, מארז...)
            modes.push({ key: "unit", label: `ל${unit}`, price: cpuLocal });
            for (let i = levels.length - 1; i >= 1; i--) {
                const l = levels[i];
                if (l.name) modes.push({ key: `pkg_${i}`, label: l.name, price: cpuLocal * l.qty, subLabel: `${l.qty} ${levels[0].name}` });
            }
            if (wpu > 0 && cpuLocal > 0) {
                const pricePerKg = cpuLocal / (wpu / 1000);
                modes.push({ key: "kg", label: "לק\"ג", price: pricePerKg, subLabel: `${wpu} גרם ל${unit}` });
            }
        }

        return modes;
    };

    // ─── Packaging ───────────────────────────────────────────────────────────

    const addPackagingLevel = () => {
        if (formData.packaging_levels.length >= 3) return;
        const newLevels = [...formData.packaging_levels, { name: "", qty: 0, count_step: 1 }];
        setFormData(prev => ({ ...prev, packaging_levels: newLevels, packaging_countLevel: newLevels.length - 1 }));
    };

    const removePackagingLevel = (index: number) => {
        if (index === 0) return;
        const newLevels = formData.packaging_levels.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, packaging_levels: newLevels, packaging_countLevel: Math.min(prev.packaging_countLevel, newLevels.length - 1) }));
    };

    const updatePackagingLevel = (index: number, field: "name" | "qty", value: any) => {
        const newLevels = [...formData.packaging_levels];
        newLevels[index] = { ...newLevels[index], [field]: field === "qty" ? (parseInt(value) || 0) : value };
        updateField("packaging_levels", newLevels);
    };

    const handleUnitChange = (newUnit: string) => {
        const wasWeight = isWeightUnit(formData.unit);
        const willBeWeight = isWeightUnit(newUnit);
        const defaultRecipeStep = willBeWeight ? 10 : 1;
        const newLevels = [...formData.packaging_levels];
        newLevels[0] = { ...newLevels[0], name: newUnit };
        const availableSteps = getAvailableCountSteps(newUnit);
        const defaultCountStep = availableSteps[0]?.value || 1;

        let adjustedCurrentStock = formData.current_stock;
        const wpu = Number(formData.weight_per_unit) || 0;
        if (wasWeight && !willBeWeight && typeof formData.current_stock === "number" && formData.current_stock > 50) {
            if (wpu > 0) {
                adjustedCurrentStock = Math.round((formData.current_stock / wpu) * 10) / 10;
            } else if (formData.current_stock >= 1000) {
                adjustedCurrentStock = Math.round(formData.current_stock / 1000);
            }
        }

        setFormData(prev => ({
            ...prev,
            unit: newUnit,
            current_stock: adjustedCurrentStock,
            packaging_levels: newLevels,
            recipe_step: defaultRecipeStep,
            count_step: defaultCountStep
        }));
        setPriceViewMode(willBeWeight ? "kg" : "unit");
    };

    // ─── Tags ────────────────────────────────────────────────────────────────

    const addTag = () => {
        const tag = newTagInput.trim();
        const currentTags = parseSupplierProductNames(formData.supplier_product_name);
        if (!tag || currentTags.includes(tag)) return;
        updateField("supplier_product_name", [...currentTags, tag]);
        setNewTagInput("");
    };

    const removeTag = (index: number) => {
        const currentTags = parseSupplierProductNames(formData.supplier_product_name);
        updateField("supplier_product_name", currentTags.filter((_, i) => i !== index));
    };

    // ─── Create Supplier ─────────────────────────────────────────────────────

    const handleCreateSupplier = async () => {
        if (!newSupplierName.trim()) return;
        const { data, error } = await supabase
            .from("suppliers")
            .insert({ name: newSupplierName.trim(), business_id: businessId })
            .select("id")
            .single();
        if (error) { alert("שגיאה ביצירת ספק: " + error.message); return; }
        if (data) {
            updateField("supplier_id", String(data.id));
            setIsCreatingSupplier(false);
            setNewSupplierName("");
        }
    };

    // ─── Validation ──────────────────────────────────────────────────────────

    const validatePackaging = (): string | null => {
        const levels = formData.packaging_levels;
        if (!Number.isInteger(levels[0].qty) || levels[0].qty <= 0) return "רמת בסיס: הכמות חייבת להיות מספר שלם וחיובי";
        for (let i = 1; i < levels.length; i++) {
            if (!levels[i].name.trim()) return `רמה ${i + 1}: יש להזין שם`;
            if (!Number.isInteger(levels[i].qty) || levels[i].qty <= 0) return `רמה ${i + 1}: הכמות חייבת להיות מספר שלם וחיובי`;
        }
        return null;
    };

    // ─── Save ────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!formData.name.trim()) { alert("יש להזין שם פריט"); return; }

        const packagingError = validatePackaging();
        if (packagingError) { alert(packagingError); return; }

        console.log("💾 [InventoryModal] Starting save...");
        setIsSaving(true);

        try {
            const levels = formData.packaging_levels;
            const packaging = levels.length > 1
                ? { levels, countLevel: formData.packaging_countLevel }
                : (levels[0].qty !== 1 ? { levels, countLevel: 0 } : null);

            const case_quantity = levels.length >= 2 ? levels[1].qty : levels[0].qty;
            const category = showCustomCategory ? customCategory.trim() : formData.category;

            const selectedSupplierObj = suppliers.find(s => String(s.id) === String(formData.supplier_id));
            const supplierName = selectedSupplierObj?.name || (item?.supplier_id === formData.supplier_id ? item?.supplier : null);

            const isWeight = isWeightUnit(formData.unit);
            const isLiquid = isLiquidUnit(formData.unit);
            const baseUnitVal = isWeight ? "g" : (isLiquid ? "ml" : null);

            const payload: any = {
                name: formData.name.trim(),
                supplier_id: formData.supplier_id ? String(formData.supplier_id) : null,
                supplier: supplierName || null,
                category: category || "כללי",
                unit: formData.unit,
                base_unit: baseUnitVal,
                current_stock: sanitizeNumeric(formData.current_stock, 0),
                weight_per_unit: sanitizeNumeric(formData.weight_per_unit),
                case_quantity,
                packaging,
                count_step: sanitizeNumeric(formData.count_step, 1),
                inventory_count_step: sanitizeNumeric(formData.count_step, 1),
                recipe_step: sanitizeNumeric(formData.recipe_step, 10),
                cost_per_unit: sanitizeNumeric(formData.cost_per_unit),
                low_stock_threshold_units: sanitizeNumeric(formData.low_stock_threshold_units),
                target_stock: sanitizeNumeric(formData.target_stock, 0),
                yield_percentage: sanitizeNumeric(formData.yield_percentage, 100),
                location: formData.location || null,
                min_order: sanitizeNumeric(formData.min_order, 1),
                order_step: sanitizeNumeric(formData.order_step, 1),
                manufacturer_name: formData.manufacturer_name || null,
                supplier_product_name: parseSupplierProductNames(formData.supplier_product_name).length > 0
                    ? JSON.stringify(parseSupplierProductNames(formData.supplier_product_name))
                    : null,
                business_id: businessId,
            };

            if (isEditMode && item) {
                const { error } = await supabase.from("inventory_items").update(payload).eq("id", item.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("inventory_items").insert(payload);
                if (error) throw error;
            }

            console.log("✅ [InventoryModal] Save successful");
            onSaved();
            onClose();
        } catch (err: any) {
            console.error("❌ [InventoryModal] Save error:", err);
            alert("שגיאה בשמירה: " + (err?.message || "שגיאה לא ידועה"));
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Delete ──────────────────────────────────────────────────────────────

    const handleDelete = async () => {
        if (!item) return;
        if (!window.confirm(`האם למחוק את "${item.name}" מהמלאי? פעולה זו בלתי הפיכה.`)) return;
        try {
            const { error } = await supabase.from("inventory_items").delete().eq("id", item.id);
            if (error) throw error;
            onSaved();
            onClose();
        } catch (err: any) {
            alert("שגיאה במחיקה: " + err.message);
        }
    };

    if (!isOpen) return null;

    // ─── Computed helpers ────────────────────────────────────────────────────

    const { price: displayPrice, label: displayLabel } = computePriceDisplay();
    const viewModes = getAvailableViewModes();

    const yieldNum = Number(formData.yield_percentage) || 100;
    const yieldHint = yieldNum < 100
        ? `${100 - yieldNum}% פחת — מ-1 ק\"ג תשתמש ב-${yieldNum * 10} גרם`
        : "ללא פחת — 100% מהמוצר בשימוש";

    const isWeight = isWeightUnit(formData.unit);
    const recipeSteps = isWeight
        ? [{ label: "1 גרם", value: 1 }, { label: "5 גרם", value: 5 }, { label: "10 גרם", value: 10 }]
        : [{ label: `1 ${formData.unit}`, value: 1 }, { label: `0.5 ${formData.unit}`, value: 0.5 }, { label: `0.25 ${formData.unit}`, value: 0.25 }];

    const countStepHint = `ספירה באייפד תעלה/תרד בקפיצות של ${formData.count_step} ${formData.unit}`;
    const recipeStepHint = isWeight
        ? `מתכונים יחשבו בקפיצות של ${formData.recipe_step} גרם`
        : `מתכונים יחשבו בקפיצות של ${formData.recipe_step} ${formData.unit}`;

    const wpuNum = Number(formData.weight_per_unit) || 0;
    const cpu = Number(formData.cost_per_unit) || 0;
    const wpuHint = (() => {
        if (wpuNum <= 0) return "💡 הגדר משקל/תכולה ליחידה לצורך דיוק בפודקוסט ובמתכונים";
        if (cpu > 0) {
            const pricePerKg = cpu / (wpuNum / 1000);
            const agorotPerGram = (pricePerKg / 1000) * 100;
            return `💡 משקל יחידה: ${wpuNum} ${isLiquidUnit(formData.unit) ? "מ״ל" : "גרם"} • = ₪${pricePerKg.toFixed(2)} לק\"ג (${agorotPerGram.toFixed(1)} אג׳ לגרם)`;
        }
        return `💡 משקל יחידה: ${wpuNum} ${isLiquidUnit(formData.unit) ? "מ״ל" : "גרם"} (הספירה עצמה מתבצעת ב${formData.unit})`;
    })();

    // ─── Render helpers ──────────────────────────────────────────────────────

    const renderPricePills = () => {
        if (cpu <= 0) return null;
        return (
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {viewModes.length > 0 && viewModes.map(m => (
                    <button
                        key={m.key}
                        onClick={() => setPriceViewMode(m.key as any)}
                        className={`flex flex-col items-center px-3 py-1 rounded-xl transition min-w-0 ${priceViewMode === m.key ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                        <span className="text-xs font-bold leading-tight">{m.label}</span>
                        {priceViewMode === m.key && m.subLabel && (
                            <span className="text-[9px] font-medium opacity-90 leading-tight">{m.subLabel}</span>
                        )}
                    </button>
                ))}
                <span className="text-lg md:text-xl font-black text-emerald-700 leading-none mr-2">
                    ₪{(viewModes.find(m => m.key === priceViewMode)?.price ?? cpu).toFixed(2)}
                </span>
                <button onClick={openPriceEdit} className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition border border-emerald-200 shrink-0">
                    <Pencil size={13} />
                </button>
            </div>
        );
    };

    // ─── Advanced tab calculations ───────────────────────────────────────────
    const levels = formData.packaging_levels;
    const currentLvl = levels[advPillLevel] || levels[0] || { name: formData.unit || "יח׳", qty: 1 };
    const maxLvl = levels[levels.length - 1] || levels[0] || { name: formData.unit || "יח׳", qty: 1 };

    const countLvlIdx = formData.packaging_countLevel || 0;
    const countLvlQty = levels[countLvlIdx]?.qty || 1;

    const rawThreshold = Number(formData.low_stock_threshold_units) || 0;
    const thresholdInBase = rawThreshold * countLvlQty;
    const displayedThreshold = thresholdInBase / currentLvl.qty;
    const handleThresholdChange = (val: number) => {
        const baseVal = val * currentLvl.qty;
        updateField("low_stock_threshold_units", baseVal / countLvlQty);
    };

    const rawTarget = Number(formData.target_stock) || 0;
    const targetInBase = rawTarget * countLvlQty;
    const displayedTarget = targetInBase / currentLvl.qty;
    const handleTargetChange = (val: number) => {
        const baseVal = val * currentLvl.qty;
        updateField("target_stock", baseVal / countLvlQty);
    };

    const rawMinOrder = Number(formData.min_order) || 0;
    const displayedMinOrder = rawMinOrder / maxLvl.qty;
    const handleMinOrderChange = (val: number) => {
        updateField("min_order", val * maxLvl.qty);
    };

    const rawOrderStep = Number(formData.order_step) || 0;
    const displayedOrderStep = rawOrderStep / maxLvl.qty;
    const handleOrderStepChange = (val: number) => {
        updateField("order_step", val * maxLvl.qty);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <MotionDiv
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center"
                    onClick={onClose}
                >
                    <MotionDiv
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className="w-full h-full md:w-full md:max-w-2xl md:h-auto md:max-h-[90vh] bg-slate-50 md:rounded-3xl md:shadow-2xl flex flex-col overflow-hidden"
                        dir="rtl"
                    >
                        {/* ─── Sticky Header ───────────────────────────── */}
                        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm shrink-0 px-4 md:px-5 pt-3 md:pt-4 pb-3">
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => updateField("name", e.target.value)}
                                    placeholder={isEditMode ? "שם הפריט" : "שם הפריט החדש *"}
                                    className="flex-1 text-lg md:text-xl font-black text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-300 min-w-0"
                                    autoFocus={!isEditMode}
                                />
                                <div className="hidden md:block">
                                    {renderPricePills()}
                                </div>
                                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition text-slate-400 shrink-0">
                                    <X size={18} />
                                </button>
                            </div>

                            {!isPriceEditing && cpu > 0 && (
                                <div className="block md:hidden mb-3.5 mt-0">
                                    {renderPricePills()}
                                </div>
                            )}

                            {isPriceEditing && (
                                <div className="mb-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-3">
                                    <div>
                                        <span className="text-xs font-black text-emerald-700 block mb-2">מחיר קנייה ואריזה ראשית</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-emerald-600 mb-1">סוג אריזה</label>
                                                <SelectWrapper>
                                                    <select
                                                        value={formData.packaging_levels.length > 1 ? (formData.packaging_levels[formData.packaging_levels.length - 1]?.name || "") : ""}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (formData.packaging_levels.length <= 1) {
                                                                const newLevels = [...formData.packaging_levels, { name: val, qty: Number(editPkgQty) || 0, count_step: 1 }];
                                                                updateField("packaging_levels", newLevels);
                                                            } else {
                                                                updatePackagingLevel(formData.packaging_levels.length - 1, "name", val);
                                                            }
                                                        }}
                                                        className="w-full h-10 bg-white border border-emerald-300 rounded-lg pr-2 pl-8 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 appearance-none"
                                                    >
                                                        <option value="">ללא אריזת אב</option>
                                                        {PACKAGING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </SelectWrapper>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-emerald-600 mb-1">כמות ב{formData.unit}</label>
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    value={editPkgQty}
                                                    onChange={e => {
                                                        const val = e.target.value === "" ? "" : Number(e.target.value);
                                                        setEditPkgQty(val);
                                                        if (formData.packaging_levels.length > 1) {
                                                            updatePackagingLevel(formData.packaging_levels.length - 1, "qty", val || 0);
                                                        }
                                                    }}
                                                    placeholder="1"
                                                    className="w-full h-10 bg-white border border-emerald-300 rounded-lg px-3 text-sm font-bold text-slate-700 [appearance:textfield] focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-emerald-600 mb-1">מחיר לאריזה (₪)</label>
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    value={editPkgPrice}
                                                    onChange={e => setEditPkgPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                                    placeholder="0.00"
                                                    className="w-full h-10 bg-white border border-emerald-300 rounded-lg px-3 text-sm font-bold text-slate-700 [appearance:textfield] focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>
                                        {Number(editPkgPrice) > 0 && Number(editPkgQty) > 0 && (
                                            <p className="text-xs text-emerald-600 font-medium mt-1">
                                                = ₪{(Number(editPkgPrice) / Number(editPkgQty)).toFixed(2)} ל{formData.unit}
                                            </p>
                                        )}
                                    </div>

                                    <div className="border-t border-emerald-200 pt-3">
                                        <span className="text-xs font-black text-teal-700 block mb-2">תת-אריזות (אופציונלי)</span>
                                        {formData.packaging_levels.slice(1, -1).map((level, idx) => {
                                            const realIdx = idx + 1;
                                            const cpu = Number(formData.cost_per_unit) || (Number(editPkgPrice) / (Number(editPkgQty) || 1));
                                            const subPrice = cpu * level.qty;
                                            return (
                                                <div key={realIdx} className="grid grid-cols-3 gap-2 mb-2 items-center">
                                                    <SelectWrapper>
                                                        <select value={level.name} onChange={e => updatePackagingLevel(realIdx, "name", e.target.value)} className="w-full h-10 bg-white border border-teal-200 rounded-lg pr-2 pl-8 text-sm font-bold text-slate-700 focus:outline-none focus:border-teal-400 appearance-none">
                                                            <option value="">בחר...</option>
                                                            {PACKAGING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </SelectWrapper>
                                                    <div className="flex items-center gap-1">
                                                        <input type="number" inputMode="numeric" value={level.qty || ""} onChange={e => updatePackagingLevel(realIdx, "qty", e.target.value)} placeholder="כמות" className="w-full h-10 bg-white border border-teal-200 rounded-lg px-2 text-sm font-bold text-slate-700 [appearance:textfield] focus:outline-none focus:border-teal-400" />
                                                        <span className="text-[10px] text-slate-400 shrink-0">{formData.packaging_levels[0]?.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {level.qty > 0 && cpu > 0 && <span className="text-xs font-bold text-emerald-600">₪{subPrice.toFixed(2)}</span>}
                                                        <button onClick={() => removePackagingLevel(realIdx)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 mr-auto shrink-0"><X size={14} /></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {formData.packaging_levels.length < 4 && (
                                            <button onClick={() => {
                                                const newLevels = [...formData.packaging_levels];
                                                const insertIdx = Math.max(1, newLevels.length - 1);
                                                newLevels.splice(insertIdx, 0, { name: "", qty: 0, count_step: 1 });
                                                updateField("packaging_levels", newLevels);
                                            }} className="w-full h-8 flex items-center justify-center gap-1.5 text-teal-600 font-bold text-xs bg-teal-50 hover:bg-teal-100 rounded-lg border border-dashed border-teal-200 transition">
                                                <Plus size={14} /> הוסף תת-אריזה
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button onClick={confirmPriceEdit} className="h-9 px-4 bg-emerald-600 text-white rounded-lg font-black text-sm flex items-center gap-1.5 hover:bg-emerald-700 transition">
                                            <Check size={14} /> אישור
                                        </button>
                                        <button onClick={() => setIsPriceEditing(false)} className="h-9 px-3 text-slate-500 rounded-lg font-bold text-sm hover:bg-white transition">ביטול</button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                                <button
                                    onClick={() => setActiveTab("details")}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "details" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
                                >
                                    פרטים
                                </button>
                                <button
                                    onClick={() => setActiveTab("advanced")}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "advanced" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
                                >
                                    מתקדם
                                </button>
                            </div>
                        </div>

                        {/* ─── Content ──────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto px-3 md:px-5 py-3 md:py-4 space-y-3 md:space-y-4 pb-24">

                            {activeTab === "details" ? (
                                /* ═══ DETAILS TAB ═══ */
                                <>
                                    {/* Supplier product names */}
                                    <FieldLabel label="שמות בתעודות ספק" helper="כדי לזהות את הפריט אוטומטית מתעודות משלוח">
                                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                                            {parseSupplierProductNames(formData.supplier_product_name).map((tag, i) => (
                                                <span key={i} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-100">
                                                    {tag}
                                                    <button onClick={() => removeTag(i)} className="hover:text-rose-500 transition"><X size={12} /></button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-1.5">
                                            <input type="text" value={newTagInput} onChange={e => setNewTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="הוסף שם..." className="modal-input flex-1 !h-10 text-xs" />
                                            <button onClick={addTag} className="h-10 px-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition shrink-0"><Plus size={14} /></button>
                                        </div>
                                    </FieldLabel>

                                    {/* Row: Supplier + Category */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <FieldLabel label="ספק">
                                            {!isCreatingSupplier ? (
                                                <SelectWrapper>
                                                    <select value={formData.supplier_id} onChange={e => { if (e.target.value === "__new__") { setIsCreatingSupplier(true); return; } updateField("supplier_id", e.target.value); }} className="modal-input appearance-none pr-4 pl-10">
                                                        <option value="">ללא ספק</option>
                                                        {suppliers.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                                                        <option value="__new__">+ הוסף ספק חדש</option>
                                                    </select>
                                                </SelectWrapper>
                                            ) : (
                                                <div className="flex gap-1.5">
                                                    <input type="text" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreateSupplier()} placeholder="שם הספק..." className="modal-input flex-1" autoFocus />
                                                    <button onClick={handleCreateSupplier} className="h-12 px-4 bg-amber-500 text-white rounded-xl font-black text-sm shrink-0">צור</button>
                                                    <button onClick={() => setIsCreatingSupplier(false)} className="h-12 px-2 text-slate-400 rounded-xl text-sm shrink-0">✕</button>
                                                </div>
                                            )}
                                        </FieldLabel>
                                        <FieldLabel label="קטגוריה">
                                            {!showCustomCategory ? (
                                                <SelectWrapper>
                                                    <select value={formData.category} onChange={e => handleCategoryChange(e.target.value)} className="modal-input appearance-none pr-4 pl-10">
                                                        <option value="">בחר קטגוריה...</option>
                                                        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                        <option value="__custom__">+ חדשה</option>
                                                    </select>
                                                </SelectWrapper>
                                            ) : (
                                                <div className="flex gap-1.5">
                                                    <input type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="שם הקטגוריה..." className="modal-input flex-1" autoFocus />
                                                    <button onClick={() => setShowCustomCategory(false)} className="h-12 px-2 text-slate-400 rounded-xl text-sm shrink-0">✕</button>
                                                </div>
                                            )}
                                        </FieldLabel>
                                    </div>

                                    {/* Row: Basic Unit + Weight / Volume per unit */}
                                    <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                                        <FieldLabel label="יחידת ספירה" helper="היחידה בה נספר המלאי באייפד">
                                            <SelectWrapper>
                                                <select
                                                    value={formData.unit}
                                                    onChange={e => handleUnitChange(e.target.value)}
                                                    className="modal-input appearance-none pr-4 pl-10 font-black text-slate-800"
                                                >
                                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                            </SelectWrapper>
                                        </FieldLabel>

                                        <FieldLabel
                                            label="משקל / תכולה ליחידה"
                                            helper={isLiquidUnit(formData.unit) ? "במ״ל (לחישוב פודקוסט)" : "בגרמים (לחישוב פודקוסט)"}
                                        >
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    value={formData.weight_per_unit}
                                                    onChange={e => updateField("weight_per_unit", e.target.value === "" ? "" : Number(e.target.value))}
                                                    placeholder={formData.unit === "שקית" ? "1000" : "150"}
                                                    className="modal-input [appearance:textfield] font-black text-slate-800 pr-3 pl-12"
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 select-none">
                                                    {isLiquidUnit(formData.unit) ? "מ״ל" : "גרם"}
                                                </span>
                                            </div>
                                        </FieldLabel>
                                    </div>

                                    {/* Foodcost helper info banner */}
                                    <p className="text-[11.5px] text-slate-500 font-medium px-1">
                                        {wpuHint}
                                    </p>

                                    {/* Counting Steps Steppers */}
                                    <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-600">קפיצת ספירה באייפד</span>
                                            <span className="text-[11px] font-bold text-indigo-600">
                                                {countStepHint}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {getAvailableCountSteps(formData.unit).map(s => (
                                                <button
                                                    key={s.value}
                                                    type="button"
                                                    onClick={() => {
                                                        updateField("count_step", s.value);
                                                        const newLevels = [...formData.packaging_levels];
                                                        if (newLevels.length > 0) {
                                                            newLevels[0] = { ...newLevels[0], count_step: s.value };
                                                            updateField("packaging_levels", newLevels);
                                                        }
                                                    }}
                                                    className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all ${formData.count_step === s.value ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Row: Current Stock & Location */}
                                    <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                                        <FieldLabel label="מלאי נוכחי בספירה" helper="ניתן לערוך ישירות או לאפס">
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        value={formData.current_stock === "" ? "" : formData.current_stock}
                                                        onChange={e => updateField("current_stock", e.target.value === "" ? "" : Number(e.target.value))}
                                                        placeholder="0"
                                                        className="modal-input [appearance:textfield] font-black text-slate-800 text-lg pr-3 pl-10"
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 select-none">
                                                        {formData.unit}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateField("current_stock", 0)}
                                                    className="h-12 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl font-bold text-xs transition"
                                                    title="אפס מלאי ל-0"
                                                >
                                                    איפוס
                                                </button>
                                            </div>
                                        </FieldLabel>

                                        <FieldLabel label="מיקום במחסן">
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={e => updateField("location", e.target.value)}
                                                placeholder="מקרר 1, מקפיא פירות, מדף יבשים..."
                                                className="modal-input font-medium"
                                            />
                                        </FieldLabel>
                                    </div>
                                </>
                            ) : (
                                /* ═══ ADVANCED TAB ═══ */
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FieldLabel label="קפיצת מתכון" helper={recipeStepHint}>
                                            <div className="flex gap-1 flex-wrap">
                                                {recipeSteps.map(s => (
                                                    <button key={s.value} type="button" onClick={() => updateField("recipe_step", s.value)} className={`flex-1 min-w-[40px] h-10 rounded-xl text-xs font-black transition ${formData.recipe_step === s.value ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </FieldLabel>
                                        <FieldLabel label="אחוז ניצולת %" helper={yieldHint}>
                                            <input type="number" inputMode="decimal" value={formData.yield_percentage} onChange={e => updateField("yield_percentage", e.target.value)} placeholder="100" className="modal-input [appearance:textfield]" />
                                        </FieldLabel>
                                    </div>

                                    {/* Row 1: Low stock threshold & Target Stock (Par Level) */}
                                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                                        {formData.packaging_levels.length > 1 && (
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                                <span className="text-xs font-bold text-slate-500">יחידת מידה להגדרות מלאי</span>
                                                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                                    {formData.packaging_levels.map((level, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setAdvPillLevel(idx)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${advPillLevel === idx ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"}`}
                                                        >
                                                            {level.name || `רמה ${idx + 1}`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            <StepperInput
                                                label="מלאי מינימום (סף התראה)"
                                                value={displayedThreshold}
                                                onChange={handleThresholdChange}
                                                step={1}
                                                min={0}
                                                suffix={currentLvl.name || formData.unit}
                                            />
                                            <StepperInput
                                                label="מלאי יעד להשלמה (Par Level)"
                                                value={displayedTarget}
                                                onChange={handleTargetChange}
                                                step={1}
                                                min={0}
                                                suffix={currentLvl.name || formData.unit}
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            💡 מלאי היעד ישמש להפקת הזמנות רכש אוטומטיות מול הספק לפי ספירת המלאי (כמות להזמנה = יעד פחות מלאי נוכחי והזמנות פתוחות).
                                        </p>
                                    </div>

                                    {/* Row 2: Min order and Order step steppers */}
                                    <div className="grid grid-cols-2 gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                        <StepperInput
                                            label="מינימום הזמנה מספק"
                                            value={displayedMinOrder}
                                            onChange={handleMinOrderChange}
                                            step={1}
                                            min={0}
                                            suffix={maxLvl.name || formData.unit}
                                        />
                                        <StepperInput
                                            label="קפיצת הזמנה (מכפיל)"
                                            value={displayedOrderStep}
                                            onChange={handleOrderStepChange}
                                            step={1}
                                            min={1}
                                            suffix={maxLvl.name || formData.unit}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ─── Sticky Footer ────────────────────────────── */}
                        <div className="sticky bottom-0 z-10 bg-white border-t border-slate-100 px-4 md:px-5 py-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] shrink-0">
                            {isEditMode && (
                                <button onClick={handleDelete} className="h-10 px-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition flex items-center gap-2">
                                    <Trash2 size={16} />
                                    <span className="hidden md:inline">מחק</span>
                                </button>
                            )}
                            <div className="flex-1" />
                            <button onClick={onClose} className="h-10 px-4 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition">ביטול</button>
                            <button onClick={handleSave} disabled={isSaving} className="h-10 px-6 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50">
                                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                {isEditMode ? "שמור" : "צור פריט"}
                            </button>
                        </div>
                    </MotionDiv>
                </MotionDiv>
            )}
        </AnimatePresence>
    );
};

// ─── Helper Components ───────────────────────────────────────────────────────

const FieldLabel: React.FC<{ label: string; helper?: string; children: React.ReactNode }> = ({ label, helper, children }) => (
    <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
        {children}
        {helper && <p className="text-xs text-slate-400 font-medium mt-1">{helper}</p>}
    </div>
);

const StepperInput: React.FC<{
    label: string;
    value: number;
    onChange: (val: number) => void;
    step?: number;
    min?: number;
    suffix?: string;
}> = ({ label, value, onChange, step = 1, min = 0, suffix = "" }) => {
    const formatValue = (val: number) => {
        if (val === 0) return "0";
        return val % 1 === 0 ? val.toString() : parseFloat(val.toFixed(2)).toString();
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-bold text-slate-500 block truncate">{label}</label>
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 h-12">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(min, value - step))}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-red-500 transition active:scale-95 shrink-0"
                >
                    <Minus size={16} strokeWidth={3} />
                </button>
                <div className="flex-1 flex flex-col justify-center items-center leading-none min-w-0">
                    <input
                        type="number"
                        inputMode="decimal"
                        value={value === 0 ? "" : formatValue(value)}
                        onChange={e => {
                            const parsed = parseFloat(e.target.value);
                            onChange(isNaN(parsed) ? 0 : Math.max(min, parsed));
                        }}
                        className="w-full bg-transparent border-none text-center font-black text-slate-800 focus:outline-none focus:ring-0 text-[15.5px] p-0 h-6 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                    />
                    {suffix && (
                        <span className="text-[9px] text-slate-400 font-bold uppercase select-none mt-0.5 leading-none">
                            {suffix}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => onChange(value + step)}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-emerald-500 transition active:scale-95 shrink-0"
                >
                    <Plus size={16} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};

export default InventoryItemModal;
