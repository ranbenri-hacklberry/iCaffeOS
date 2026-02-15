import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Check, Upload, Trash2, Sparkles, Image as ImageIcon, Plus, Power, GripHorizontal, Search, PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MagicImageModal from './MagicImageModal';

const MenuEditModal = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
        image_url: '',
        is_in_stock: true,
        allow_notes: true
    });
    const [availableCategories, setAvailableCategories] = useState([]);
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Modifiers State
    const [allGroups, setAllGroups] = useState([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState(new Set());
    const [loadingModifiers, setLoadingModifiers] = useState(false);

    // New Modifiers / Groups State
    const [allOptionNames, setAllOptionNames] = useState([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Add/Edit Option State
    const [addingToGroupId, setAddingToGroupId] = useState(null);
    const [newOptionData, setNewOptionData] = useState({ name: '', price: '0', is_default: false });

    // Custom Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);
    const [showMagicModal, setShowMagicModal] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                price: item.price || 0,
                description: item.description || '',
                category: item.category || '',
                image_url: item.image_url || '',
                is_in_stock: item.is_in_stock !== false,
                allow_notes: item.allow_notes !== false
            });
            fetchCategories();
            fetchModifiers();
            fetchAllOptionNames();
        }

        // Click outside to close suggestions
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [item]);

    const fetchCategories = async () => {
        try {
            const { data } = await supabase
                .from('menu_items')
                .select('category')
                .not('category', 'is', null);

            if (data) {
                const uniqueCats = [...new Set(data.map(i => i.category))].sort();
                setAvailableCategories(uniqueCats);
            }
        } catch (e) {
            console.error('Error fetching categories:', e);
        }
    };

    const fetchAllOptionNames = async () => {
        try {
            const { data } = await supabase.from('optionvalues').select('value_name');
            if (data) {
                const names = [...new Set(data.map(d => d.value_name))].sort();
                setAllOptionNames(names);
            }
        } catch (e) {
            console.error('Error fetching option names:', e);
        }
    };

    const fetchModifiers = async () => {
        setLoadingModifiers(true);
        try {
            const { data: groups, error: groupsError } = await supabase
                .from('optiongroups')
                .select(`
                    *,
                    optionvalues (
                        id,
                        value_name,
                        price_adjustment,
                        is_default,
                        display_order
                    )
                `)
                .order('name');

            if (groupsError) throw groupsError;

            const processedGroups = groups?.map(g => ({
                ...g,
                optionvalues: g.optionvalues?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)) || []
            })) || [];

            setAllGroups(processedGroups);
            console.log('[MenuEditModal] Loaded', processedGroups.length, 'option groups');

            // Only fetch linked modifiers if we have an item ID (existing item)
            if (item?.id) {
                const { data: linked, error: linkedError } = await supabase
                    .from('menuitemoptions')
                    .select('group_id')
                    .eq('item_id', item.id);

                if (linkedError) throw linkedError;

                const linkedIds = new Set(linked?.map(l => l.group_id) || []);
                setSelectedGroupIds(linkedIds);
                console.log('[MenuEditModal] Item', item.id, 'has', linkedIds.size, 'linked modifiers');
            } else {
                // New item - no linked modifiers yet
                setSelectedGroupIds(new Set());
                console.log('[MenuEditModal] New item - no linked modifiers');
            }
        } catch (err) {
            console.error('Error fetching modifiers:', err);
        } finally {
            setLoadingModifiers(false);
        }
    };

    const sortedGroups = useMemo(() => {
        return [...allGroups].sort((a, b) => {
            const aSelected = selectedGroupIds.has(a.id);
            const bSelected = selectedGroupIds.has(b.id);
            if (aSelected === bSelected) return 0;
            return aSelected ? -1 : 1;
        });
    }, [allGroups, selectedGroupIds]);

    const handleModifierToggle = (groupId) => {
        console.log('[MenuEditModal] Toggle modifier group:', groupId);
        const newSelected = new Set(selectedGroupIds);
        if (newSelected.has(groupId)) {
            newSelected.delete(groupId);
            console.log('[MenuEditModal] Removed group', groupId, 'total:', newSelected.size);
        } else {
            newSelected.add(groupId);
            console.log('[MenuEditModal] Added group', groupId, 'total:', newSelected.size);
        }
        setSelectedGroupIds(newSelected);
    };

    const adjustPrice = (amount) => {
        setFormData(prev => ({
            ...prev,
            price: Math.max(0, parseFloat((Number(prev.price) + amount).toFixed(2)))
        }));
    };

    const adjustOptionPrice = (amount) => {
        setNewOptionData(prev => ({
            ...prev,
            price: Math.max(0, parseFloat((Number(prev.price) + amount).toFixed(2))).toString()
        }));
    };

    const handleCategoryChange = (e) => {
        const val = e.target.value;
        if (val === '__NEW__') {
            setIsNewCategory(true);
            setFormData(prev => ({ ...prev, category: '' }));
        } else {
            setIsNewCategory(false);
            setFormData(prev => ({ ...prev, category: val }));
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('menu-images')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('שגיאה בהעלאת תמונה: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const deleteImage = () => {
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const handleMagicEdit = () => {
        setShowMagicModal(true);
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        try {
            const { error } = await supabase.from('optiongroups').insert({ name: newGroupName.trim() });
            if (error) throw error;
            setNewGroupName('');
            setIsCreatingGroup(false);
            fetchModifiers();
        } catch (e) {
            console.error('Error creating group:', e);
            alert('שגיאה ביצירת קבוצה');
        }
    };

    const handleAddOptionClick = (groupId) => {
        setAddingToGroupId(groupId);
        setNewOptionData({ name: '', price: '0', is_default: false });
        setSearchTerm('');
        setShowSuggestions(false);
    };

    const handleDeleteOption = async (optionId) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק אפשרות זו?')) return;
        try {
            const { error } = await supabase.from('optionvalues').delete().eq('id', optionId);
            if (error) throw error;
            fetchModifiers();
            fetchAllOptionNames();
        } catch (e) {
            console.error('Error deleting option:', e);
            alert('שגיאה במחיקת האפשרות');
        }
    };

    const handleSaveNewOption = async () => {
        const nameToSave = searchTerm.trim() || newOptionData.name.trim();
        if (!addingToGroupId || !nameToSave) return;

        try {
            const { error } = await supabase.from('optionvalues').insert({
                group_id: addingToGroupId,
                value_name: nameToSave,
                price_adjustment: Number(newOptionData.price),
                is_default: newOptionData.is_default
            });

            if (error) throw error;

            setAddingToGroupId(null);
            fetchModifiers();
            fetchAllOptionNames();
        } catch (e) {
            alert('שגיאה בהוספת אפשרות. בדוק לוגים.');
            console.error(e);
        }
    };

    const handleSelectSuggestion = (name) => {
        setSearchTerm(name);
        setNewOptionData(prev => ({ ...prev, name }));
        setShowSuggestions(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Guard against double submission
        if (loading) {
            console.warn('[MenuEditModal] Already saving, ignoring duplicate submit');
            return;
        }

        // Ask for confirmation when editing an existing item
        if (item.id) {
            const confirmed = window.confirm(
                `האם אתה בטוח שברצונך לשמור את השינויים ב"${formData.name}"?`
            );
            if (!confirmed) {
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                price: Number(formData.price),
                category: formData.category,
                image_url: formData.image_url,
                is_in_stock: formData.is_in_stock,
                allow_notes: formData.allow_notes
            };

            console.log('[MenuEditModal] Saving item:', { itemId: item.id, payload });
            console.log('[MenuEditModal] Selected modifiers:', Array.from(selectedGroupIds));


            // onSave should return the saved item (with ID) if it's a new creation
            const savedItem = await onSave(item.id, payload);
            const targetId = item.id || savedItem?.id;

            console.log('[MenuEditModal] Saved with targetId:', targetId);

            if (!targetId) {
                throw new Error("Failed to resolve Item ID after save.");
            }

            // Handle Modifiers using the targetId
            console.log('[MenuEditModal] Deleting existing modifiers for item:', targetId);
            const { error: deleteError } = await supabase.from('menuitemoptions').delete().eq('item_id', targetId);
            if (deleteError) {
                console.error('[MenuEditModal] Error deleting modifiers:', deleteError);
            }

            if (selectedGroupIds.size > 0) {
                const rowsToInsert = Array.from(selectedGroupIds).map(groupId => ({
                    item_id: targetId,
                    group_id: groupId
                }));
                console.log('[MenuEditModal] Inserting modifiers:', rowsToInsert);
                const { error: insertError } = await supabase
                    .from('menuitemoptions')
                    .insert(rowsToInsert);

                if (insertError) {
                    console.error('[MenuEditModal] Error inserting modifiers:', insertError);
                    throw insertError;
                }
                console.log('[MenuEditModal] Successfully saved', rowsToInsert.length, 'modifiers');
            } else {
                console.log('[MenuEditModal] No modifiers selected to save');
            }

            onClose();
        } catch (error) {
            console.error('Error saving item:', error);
            alert('שגיאה בשמירת הפריט: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // KDS Logic 1:1 Map
    const getModClass = (text) => {
        if (!text) return 'mod-color-gray';
        const t = String(text).toLowerCase().trim();

        if (t.includes('בלי קצף') || t.includes('ללא קצף')) return 'mod-color-foam-none';
        if (t.includes('פחות קצף') || t.includes('מעט קצף')) return 'mod-color-foam-down';
        if (t.includes('הרבה קצף') || t.includes('אקסטרה קצף')) return 'mod-color-foam-up';

        if (t.includes('בלי') || t.includes('ללא') || t.includes('הורד')) return 'mod-color-red';

        if (t.includes('תוספת') || t.includes('אקסטרה') || t.includes('בצד') || t.includes('קצף')) return 'mod-color-lightgreen';

        if (t.includes('סויה') || t.includes('שיבולת שועל') || t.includes('שיבולת')) return 'mod-color-soy-oat';
        if (t.includes('שקדים')) return 'mod-color-almond';
        if (t.includes('נטול') || t.includes('דקף') || t.includes('ללא לקטוז')) return 'mod-color-lactose-free';

        if (t.includes('רותח') || t.includes('חם מאוד')) return 'mod-color-extra-hot';
        if (t.includes('חזק') || t.includes('כפול')) return 'mod-color-strong';
        if (t.includes('חלש') || t.includes('קל')) return 'mod-color-light';
        if (t.includes('דל') || t.includes('low')) return 'mod-color-purple';

        return 'mod-color-gray';
    };

    // Filter suggestions
    const filteredSuggestions = allOptionNames.filter(name =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-md overflow-hidden">
            <div className="bg-white lg:rounded-3xl w-full h-full lg:h-auto lg:max-h-[92vh] lg:max-w-5xl xl:max-w-6xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" dir="rtl">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10 shrink-0 shadow-sm sticky top-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors shrink-0 text-gray-500">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-black text-gray-800 truncate tracking-tight">
                            עריכה: <span className="text-blue-600">{formData.name}</span>
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar bg-white">
                    {/* Top Row: [Stock Toggle (Left)] ....... [Name Input (Right)] */}
                    <div className="flex flex-row-reverse items-center gap-3 lg:gap-6">
                        {/* Right: Name Input (Main) */}
                        <div className="flex-1">
                            <input
                                type="text"
                                value={formData.name}
                                placeholder="שם הפריט"
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 lg:px-6 py-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-black text-xl lg:text-2xl text-gray-800 bg-gray-50/50 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-300"
                                required
                            />
                        </div>

                        {/* Left: Stock Toggle */}
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, is_in_stock: !prev.is_in_stock }))}
                            className={`flex flex-col items-center justify-center w-20 lg:w-24 h-full min-h-[60px] rounded-2xl font-bold transition-all border-b-4 border-transparent active:border-none active:translate-y-1 shrink-0 ${formData.is_in_stock
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                        >
                            <Power size={24} strokeWidth={3} className="mb-1" />
                            <span className="text-[10px] lg:text-xs leading-none">{formData.is_in_stock ? 'זמין' : 'חסר'}</span>
                        </button>
                    </div>

                    {/* Second Row: Image, Category, Price - Stacked on mobile */}
                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6">
                        {/* Image */}
                        <div className="lg:col-span-3 flex items-start gap-4">
                            {/* Image Preview (Right side in RTL) */}
                            <div className="w-28 h-28 bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden shrink-0 flex items-center justify-center relative shadow-sm">
                                {formData.image_url ? (
                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon size={32} className="text-gray-300" />
                                )}
                            </div>

                            {/* Buttons Stack (Left side in RTL) */}
                            <div className="flex flex-col gap-2 flex-1">
                                <label className="flex items-center gap-2 px-3 py-2 bg-white text-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 hover:text-blue-600 transition shadow-sm border border-gray-200 text-sm font-bold justify-center active:scale-95">
                                    <Upload size={16} />
                                    <span>העלאה</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                </label>

                                {/* <button type="button" onClick={handleMagicEdit} className="flex items-center gap-2 px-3 py-2 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition shadow-sm border border-gray-200 text-sm font-bold justify-center active:scale-95">
                                    <Sparkles size={16} />
                                    <span>AI Magic</span>
                                </button> */}

                                {formData.image_url && (
                                    <button type="button" onClick={deleteImage} className="flex items-center gap-2 px-3 py-2 bg-white text-red-500 rounded-xl hover:bg-red-50 transition shadow-sm border border-gray-200 text-sm font-bold justify-center active:scale-95">
                                        <Trash2 size={16} />
                                        <span>מחיקה</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Category */}
                        <div className="lg:col-span-4">
                            {isNewCategory ? (
                                <div className="flex gap-2 h-14 lg:h-full">
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 h-full border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none text-base lg:text-lg bg-white"
                                        placeholder="קטגוריה חדשה"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsNewCategory(false)}
                                        className="px-3 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-600 font-bold"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <select
                                    value={formData.category}
                                    onChange={handleCategoryChange}
                                    className="w-full h-14 lg:h-20 px-4 lg:px-6 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none bg-gray-50 focus:bg-white appearance-none cursor-pointer text-lg lg:text-xl text-gray-800 font-bold"
                                >
                                    <option value="">בחר קטגוריה...</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    <option value="__NEW__" className="text-blue-600">+ קטגוריה חדשה</option>
                                </select>
                            )}
                        </div>

                        {/* Price */}
                        <div className="lg:col-span-5 bg-blue-50/50 rounded-2xl border border-blue-100 p-2 flex items-center justify-between gap-1 h-16 lg:h-auto">
                            <button type="button" onClick={() => adjustPrice(-10)} className="w-10 lg:w-12 h-full flex items-center justify-center bg-white text-red-500 rounded-xl hover:bg-red-50 font-black text-lg shadow-sm border border-gray-200">
                                -10
                            </button>
                            <button type="button" onClick={() => adjustPrice(-1)} className="w-8 lg:w-10 h-full flex items-center justify-center bg-white text-red-500 rounded-lg hover:bg-red-50 font-bold shadow-sm border border-gray-200">
                                -1
                            </button>

                            <div className="flex-1 h-full mx-1 lg:mx-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="0"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full h-full text-center font-black text-2xl lg:text-4xl bg-white rounded-xl shadow-inner outline-none text-gray-900 focus:ring-2 focus:ring-blue-500/20"
                                    required
                                />
                            </div>

                            <button type="button" onClick={() => adjustPrice(1)} className="w-8 lg:w-10 h-full flex items-center justify-center bg-white text-blue-500 rounded-lg hover:bg-blue-50 font-bold shadow-sm border border-gray-200">
                                +1
                            </button>
                            <button type="button" onClick={() => adjustPrice(10)} className="w-10 lg:w-12 h-full flex items-center justify-center bg-white text-blue-600 rounded-xl hover:bg-blue-50 font-black text-lg shadow-sm border border-gray-200">
                                +10
                            </button>
                        </div>
                    </div>

                    {/* Modifiers Section - Shows allow_notes toggle and selected groups only */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                <GripHorizontal size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800">אפשרויות ותוספות</h3>
                        </div>

                        <div className="space-y-3">
                            {/* Allow Notes Toggle - Always visible */}
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, allow_notes: !prev.allow_notes }))}
                                className={`border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${formData.allow_notes
                                    ? 'border-orange-400 bg-orange-50'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 transition-all ${formData.allow_notes ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
                                    }`}>
                                    {formData.allow_notes && <Check size={14} className="text-white" strokeWidth={3} />}
                                </div>
                                <span className="text-lg">📝</span>
                                <span className={`font-bold text-base flex-1 ${formData.allow_notes ? 'text-orange-800' : 'text-gray-700'}`}>
                                    הערה חופשית
                                </span>
                                <span className="text-xs text-gray-400">
                                    {formData.allow_notes ? 'מאפשר הערות' : 'ללא הערות'}
                                </span>
                            </div>

                            {/* Modifier Groups - Only show selected ones */}
                            <div className="space-y-3">
                                {loadingModifiers ? (
                                    <div className="text-center py-10 text-gray-400 col-span-full">טוען תוספות...</div>
                                ) : allGroups.length === 0 ? (
                                    <p className="text-center py-10 text-gray-400 text-sm col-span-full">לא נמצאו תוספות במערכת.</p>
                                ) : (
                                    <>
                                        {sortedGroups
                                            .filter(group => selectedGroupIds.has(group.id))
                                            .map(group => {
                                                const isEditing = addingToGroupId === group.id;

                                                return (
                                                    <div
                                                        key={group.id}
                                                        className="border border-blue-400 bg-blue-50/30 rounded-xl overflow-hidden"
                                                    >
                                                        {/* Header with Remove Button */}
                                                        <div className="p-3 flex items-center gap-3">
                                                            {/* Remove Button */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleModifierToggle(group.id)}
                                                                className="w-6 h-6 rounded bg-red-100 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors"
                                                            >
                                                                <X size={14} strokeWidth={3} />
                                                            </button>

                                                            {/* Name */}
                                                            <span className="font-bold text-base flex-1 text-blue-900">
                                                                {group.name}
                                                            </span>

                                                            {/* Add Option Trigger */}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleAddOptionClick(group.id); }}
                                                                className="px-3 py-1.5 bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-600 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors border border-gray-200"
                                                            >
                                                                <Plus size={14} strokeWidth={3} />
                                                                הוסף
                                                            </button>
                                                        </div>

                                                        {/* Modifiers List - KDS Style */}
                                                        <div className="px-3 pb-3 flex flex-wrap gap-2">
                                                            {group.optionvalues && group.optionvalues.map(ov => (
                                                                <div
                                                                    key={ov.id}
                                                                    className={`mod-label py-1 px-2 text-xs rounded-md border cursor-default flex items-center gap-1.5 ${getModClass(ov.value_name)}`}
                                                                >
                                                                    {/* Delete Button (Always Visible) */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteOption(ov.id); }}
                                                                        className="w-4 h-4 flex items-center justify-center rounded-full bg-black/10 hover:bg-red-500 hover:text-white transition-colors text-current"
                                                                    >
                                                                        <X size={10} strokeWidth={3} />
                                                                    </button>

                                                                    <span className="font-bold">{ov.value_name}</span>

                                                                    {ov.price_adjustment > 0 && (
                                                                        <span className="bg-black/5 px-1 rounded text-[10px] font-mono">+{ov.price_adjustment}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Inline Editor with Search */}
                                                        {isEditing && (
                                                            <div className="mx-3 mb-3 p-3 bg-white border border-blue-200 rounded-xl shadow-lg flex flex-col gap-3 animate-in slide-in-from-top-1 z-20 relative" onClick={e => e.stopPropagation()}>
                                                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                                                    <span className="font-bold text-blue-800 text-xs">הוספת אפשרות ל{group.name}</span>
                                                                    <button onClick={() => setAddingToGroupId(null)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                                                                </div>

                                                                {/* Search Box / New Name */}
                                                                <div className="relative" ref={searchRef}>
                                                                    <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 bg-gray-50">
                                                                        <div className="p-2 text-gray-400"><Search size={16} /></div>
                                                                        <input
                                                                            type="text"
                                                                            value={searchTerm}
                                                                            onChange={e => {
                                                                                setSearchTerm(e.target.value);
                                                                                setShowSuggestions(true);
                                                                            }}
                                                                            onFocus={() => setShowSuggestions(true)}
                                                                            className="w-full py-2 bg-transparent outline-none text-sm font-bold"
                                                                            placeholder="חפש או הקלד שם חדש..."
                                                                            autoFocus
                                                                        />
                                                                    </div>

                                                                    {/* Custom Suggestions Dropdown */}
                                                                    {showSuggestions && (
                                                                        <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                                                                            {filteredSuggestions.map((name, i) => (
                                                                                <button
                                                                                    key={i}
                                                                                    type="button"
                                                                                    onClick={() => handleSelectSuggestion(name)}
                                                                                    className="w-full text-right px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 block border-b border-gray-50 last:border-0 truncate"
                                                                                >
                                                                                    {name}
                                                                                </button>
                                                                            ))}
                                                                            {searchTerm && !filteredSuggestions.includes(searchTerm) && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleSelectSuggestion(searchTerm)}
                                                                                    className="w-full text-right px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 font-bold block"
                                                                                >
                                                                                    + צור חדש: "{searchTerm}"
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Price & Default */}
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                                                        <button type="button" onClick={() => adjustOptionPrice(-1)} className="w-8 h-8 flex items-center justify-center text-red-500 font-bold hover:bg-white rounded-r-lg">-</button>
                                                                        <input
                                                                            type="number"
                                                                            value={newOptionData.price}
                                                                            onChange={e => setNewOptionData({ ...newOptionData, price: e.target.value })}
                                                                            className="w-12 text-center text-sm font-black bg-transparent outline-none"
                                                                        />
                                                                        <button type="button" onClick={() => adjustOptionPrice(1)} className="w-8 h-8 flex items-center justify-center text-blue-500 font-bold hover:bg-white rounded-l-lg">+</button>
                                                                    </div>

                                                                    <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-200">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={newOptionData.is_default}
                                                                            onChange={e => setNewOptionData({ ...newOptionData, is_default: e.target.checked })}
                                                                            className="w-4 h-4 accent-blue-600 rounded"
                                                                        />
                                                                        <span className="font-bold text-xs text-gray-500">ברירת מחדל</span>
                                                                    </label>

                                                                    <button
                                                                        onClick={handleSaveNewOption}
                                                                        className="flex-1 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow text-sm"
                                                                    >
                                                                        שמור
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                        <button
                                            type="button"
                                            onClick={isCreatingGroup ? () => { } : () => setIsCreatingGroup(true)}
                                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-blue-500 hover:border-blue-400 transition-all font-bold text-sm bg-gray-50/50"
                                        >
                                            {isCreatingGroup ? (
                                                <div className="flex items-center gap-2 w-full px-2">
                                                    <input
                                                        value={newGroupName}
                                                        onChange={e => setNewGroupName(e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white text-black text-sm"
                                                        placeholder="שם קבוצה..."
                                                        autoFocus
                                                        onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                                                    />
                                                    <button onClick={handleCreateGroup} className="p-2 bg-blue-600 text-white rounded-lg"><Check size={16} /></button>
                                                    <button onClick={() => setIsCreatingGroup(false)} className="p-2 bg-gray-200 rounded-lg"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <PlusCircle size={18} />
                                                    צור קבוצה חדשה
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-gray-100 bg-white z-10 lg:rounded-b-3xl">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 lg:py-4 bg-slate-900 text-white font-black rounded-xl lg:rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 text-lg lg:text-2xl"
                    >
                        {loading ? 'שומר...' : 'שמור שינויים'}
                    </button>
                </div>
            </div>

            {
                showMagicModal && (
                    <MagicImageModal
                        productName={formData.name}
                        onClose={() => setShowMagicModal(false)}
                        onImageGenerated={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                    />
                )
            }
        </div >
    );
};

export default MenuEditModal;
