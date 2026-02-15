import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { supabase } from '@/lib/supabase';
import MenuManagerCard from './MenuManagerCard';
import { Search, Coffee, GlassWater, Croissant, Leaf, Sandwich, IceCream, Utensils, ArrowRight, ChevronRight, Grid, Plus, X } from 'lucide-react';

// Lazy load the heavy MenuEditModal for faster initial load
const MenuEditModal = lazy(() => import('./MenuEditModal'));

const CATEGORY_ICONS = {
  'שתיה חמה': Coffee,
  'hot-drinks': Coffee,
  'שתיה קרה': GlassWater,
  'cold-drinks': GlassWater,
  'מאפים': Croissant,
  'pastries': Croissant,
  'סלטים': Leaf,
  'salads': Leaf,
  'כריכים וטוסטים': Sandwich,
  'sandwiches': Sandwich,
  'קינוחים': IceCream,
  'desserts': IceCream,
  'תוספות': Utensils,
  'אחר': Utensils
};

const MenuDisplay = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null); // null = Show Category Grid
  const [searchTerm, setSearchTerm] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSaveItem = async (id, updates) => {
    try {
      if (id) {
        // Update existing
        const { error } = await supabase
          .from('menu_items')
          .update(updates)
          .eq('id', id);

        if (error) throw error;

        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, ...updates } : item
        ));
        return { id, ...updates };
      } else {
        // Create new
        const { data, error } = await supabase
          .from('menu_items')
          .insert([updates])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setItems(prev => [...prev, data]);
        }
        return data; // Return the new item with ID
      }
    } catch (err) {
      console.error('Error saving item:', err);
      throw err;
    }
  };

  const handleToggleAvailability = async (item) => {
    const newStatus = item.is_in_stock === false ? true : false;
    try {
      await handleSaveItem(item.id, { is_in_stock: newStatus });
    } catch (e) {
      alert('יש להריץ את סקריפט עדכון הסכמה (add_menu_columns.sql) כדי ולעדכן זמינות');
    }
  };

  // Group Items by Category
  const groupedCategories = useMemo(() => {
    const groups = items.reduce((acc, item) => {
      // Normalize category if needed, assuming DB has Hebrew names mostly
      const cat = item.category || 'אחר';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    return groups;
  }, [items]);

  // Derived list of categories
  const categoriesList = useMemo(() => Object.keys(groupedCategories), [groupedCategories]);

  // Filter Items for the ACTIVE view (either all for search, or specific category)
  const displayItems = useMemo(() => {
    let relevantItems = activeCategory
      ? groupedCategories[activeCategory] || []
      : items;

    if (searchTerm.trim()) {
      relevantItems = relevantItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return relevantItems;
  }, [items, groupedCategories, activeCategory, searchTerm]);


  // Loading skeleton for better UX
  if (loading) return (
    <div className="h-full flex flex-col bg-gray-50 p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 font-heebo">

      {/* 1. Global Search Header */}
      <div className="bg-white p-4 pb-2 shadow-sm shrink-0 z-10 sticky top-0">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="חיפוש פריט..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 text-gray-800 rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">

        {/* VIEW A: Category Grid (Home) - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
        {!activeCategory && !searchTerm && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-6xl mx-auto">
            {categoriesList.map(cat => {
              const Icon = CATEGORY_ICONS[cat] || Utensils;
              const count = groupedCategories[cat]?.length || 0;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:shadow-md hover:border-blue-200 transition-all active:scale-[0.98] h-32 lg:h-40"
                >
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                    <Icon size={24} className="lg:w-8 lg:h-8" strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <div className="font-black text-gray-800 text-sm lg:text-base mb-0.5">{cat}</div>
                    <div className="text-xs lg:text-sm text-gray-400 font-medium">{count} פריטים</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* VIEW B: Items List (Selected Category OR Search Results) */}
        {(activeCategory || searchTerm) && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {/* Header for Category View */}
            {!searchTerm && activeCategory && (
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowRight size={20} />
                </button>
                <div className="text-xl font-black text-gray-800">
                  {activeCategory}
                </div>

                {/* NEW: Add Item Button (Replaced Count Badge) */}
                <button
                  onClick={() => setSelectedItem({ name: '', price: '', category: activeCategory, is_in_stock: true })}
                  className="mr-auto flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Plus size={18} strokeWidth={3} />
                  <span>הוסף חדש</span>
                </button>
              </div>
            )}

            {/* If Searching, show explicit back to grid */}
            {searchTerm && !activeCategory && (
              <div className="mb-4 text-sm text-gray-500 font-medium">
                תוצאות חיפוש עבור: <span className="text-gray-800 font-bold">"{searchTerm}" (נמצאו {displayItems.length})</span>
              </div>
            )}

            {/* The Items List - Responsive Grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 max-w-6xl mx-auto">
              {displayItems.length === 0 ? (
                <div className="text-center py-10 text-gray-400 col-span-full">
                  לא נמצאו פריטים...
                </div>
              ) : (
                displayItems.map(item => (
                  <MenuManagerCard
                    key={item.id}
                    item={item}
                    onClick={setSelectedItem}
                    onToggleAvailability={handleToggleAvailability}
                  />
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Lazy loaded modal with Suspense fallback */}
      {selectedItem && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <MenuEditModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onSave={handleSaveItem}
          />
        </Suspense>
      )}
    </div>
  );
};

export default React.memo(MenuDisplay);
