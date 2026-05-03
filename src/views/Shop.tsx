import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { Product, View } from '../types';
import { CATEGORIES } from '../constants';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';

interface ShopProps {
  products: Product[];
  siteConfig: any;
  onOpen: (id: number) => void;
  onAddToCart: (id: number) => void;
  onWishlist: (id: number) => void;
  wishlist: number[];
}

export function Shop({ products, siteConfig, onOpen, onAddToCart, onWishlist, wishlist }: ShopProps) {
  const categories = siteConfig?.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara'];
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>(() => {
    return sessionStorage.getItem('pastel_filter_cat') || 'all';
  });
  
  useEffect(() => {
    const handleCatChange = (e: any) => {
      setSelectedCategory(e.detail);
    };
    window.addEventListener('pastel_category_change', handleCatChange as EventListener);
    return () => window.removeEventListener('pastel_category_change', handleCatChange as EventListener);
  }, []);
  
  // Clear filter after reading it to avoid persistence on fresh mounts if not intended
  useEffect(() => {
    sessionStorage.removeItem('pastel_filter_cat');
  }, []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<'relevance' | 'low' | 'high' | 'new'>('relevance');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.desc?.toLowerCase().includes(q));
    }

    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedSizes.size > 0) {
      list = list.filter(p => p.sizes.some(s => selectedSizes.has(s)));
    }

    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    else if (sort === 'high') list.sort((a, b) => b.price - a.price);
    else if (sort === 'new') list.sort((a, b) => b.id - a.id);

    return list;
  }, [products, search, selectedCategory, priceRange, selectedSizes, sort]);

  const toggleSize = (size: string) => {
    const next = new Set(selectedSizes);
    if (next.has(size)) next.delete(size);
    else next.add(size);
    setSelectedSizes(next);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, 5000]);
    setSelectedSizes(new Set());
    setSearch('');
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="pt-20 pb-12 px-4 text-center bg-gradient-to-b from-blush/10 to-transparent">
        <h1 className="font-serif text-5xl text-dark mb-4 tracking-tight">The Collection</h1>
        <p className="text-light text-sm tracking-widest max-w-sm mx-auto uppercase">Discover our curated silhouettes in signature pastels</p>
      </header>

      {/* Controls Bar */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-y border-gold/5 py-4 px-4 overflow-x-auto scroller-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 min-w-max md:min-w-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cream rounded border border-gold/10 text-[0.7rem] uppercase tracking-widest font-semibold text-dark hover:bg-gold hover:text-white transition-all shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters {filteredProducts.length !== products.length && `(${products.length - filteredProducts.length} filtered)`}
            </button>
            <div className="relative group min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light group-focus-within:text-gold transition-colors" />
              <input 
                type="text" 
                placeholder="Search styles..."
                className="w-full pl-10 pr-4 py-2 bg-cream rounded border border-transparent focus:border-gold/30 outline-none text-xs transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[0.65rem] text-light uppercase tracking-widest hidden sm:inline">Sort by:</span>
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="bg-transparent text-[0.7rem] uppercase tracking-widest font-semibold text-dark outline-none cursor-pointer hover:text-gold border-none pr-6 py-1"
            >
              <option value="relevance">Relevance</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
              <option value="new">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-12">
           {/* Desktop Sidebar Filters */}
           <aside className="hidden md:block space-y-10 sticky top-40 h-fit">
             <section>
                <h3 className="text-[0.65rem] uppercase tracking-[0.3em] text-gold font-bold mb-6 border-b border-gold/10 pb-2">Categories</h3>
                <div className="space-y-4">
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`block w-full text-left text-sm transition-colors ${selectedCategory === 'all' ? 'text-dark font-semibold' : 'text-light hover:text-gold'}`}
                  >
                    All Collection <span className="text-[0.6rem] float-right opacity-30">({products.length})</span>
                  </button>
                  {categories.map((cat: string) => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`block w-full text-left text-sm transition-colors uppercase tracking-widest ${selectedCategory === cat ? 'text-dark font-semibold font-serif italic text-base' : 'text-light hover:text-gold'}`}
                    >
                      {cat} <span className="text-[0.6rem] float-right opacity-30">({products.filter(p => p.category === cat).length})</span>
                    </button>
                  ))}
                </div>
             </section>

             <section>
                <h3 className="text-[0.65rem] uppercase tracking-[0.3em] text-gold font-bold mb-6 border-b border-gold/10 pb-2">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`w-10 h-10 border rounded flex items-center justify-center text-xs tracking-tighter transition-all ${
                        selectedSizes.has(size) ? 'bg-dark text-white border-dark' : 'border-gold/20 text-mid hover:border-gold'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
             </section>

             <section>
                <h3 className="text-[0.65rem] uppercase tracking-[0.3em] text-gold font-bold mb-6 border-b border-gold/10 pb-2">Price Range</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-[0.7rem] font-bold text-dark">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-gold bg-gold/10 rounded-lg cursor-pointer appearance-none h-1"
                  />
                </div>
             </section>

             <button 
              onClick={clearFilters}
              className="text-[0.6rem] uppercase tracking-widest text-gold hover:underline font-bold"
             >
                Reset All Filters
             </button>
           </aside>

           {/* Results Grid */}
           <div>
             <div className="mb-6 flex items-center justify-between">
                <span className="text-light text-[0.7rem] uppercase tracking-[0.2em]">
                  Showing <strong>{filteredProducts.length}</strong> styles
                </span>
             </div>

             {filteredProducts.length > 0 ? (
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredProducts.map((p) => (
                  <ProductCard 
                    key={p.id} 
                    product={p} 
                    onOpen={onOpen} 
                    onAddToCart={onAddToCart}
                    onWishlist={onWishlist}
                    isWishlisted={wishlist.includes(p.id)}
                  />
                ))}
              </div>
             ) : (
               <div className="text-center py-32 bg-cream/20 rounded-xl border border-dashed border-gold/20">
                  <div className="text-4xl mb-4 opacity-30">🔍</div>
                  <h3 className="font-serif text-2xl text-mid mb-2 italic">Nothing matches your filters</h3>
                  <p className="text-light text-sm mb-8">Try adjusting your search or resetting categories.</p>
                  <button 
                    onClick={clearFilters}
                    className="bg-dark text-white px-8 py-3 rounded text-xs tracking-widest uppercase hover:bg-gold transition-colors"
                  >
                    Clear All Filters
                  </button>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-dark/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[85%] bg-white z-[110] p-8 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-gold/10">
                <h2 className="text-[0.7rem] uppercase tracking-[0.4em] text-gold font-bold">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="text-mid"><X /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-12">
                 <section>
                    <h3 className="text-[0.6rem] uppercase tracking-widest text-mid font-bold mb-4">Category</h3>
                    <div className="flex flex-wrap gap-2">
                        <button 
                         onClick={() => setSelectedCategory('all')}
                         className={`px-4 py-2 rounded text-[0.65rem] tracking-widest uppercase transition-all ${selectedCategory === 'all' ? 'bg-gold text-white' : 'bg-cream text-mid border border-gold/10'}`}
                       >
                         All
                       </button>
                       {categories.map((cat: string) => (
                         <button 
                           key={cat}
                           onClick={() => setSelectedCategory(cat)}
                           className={`px-4 py-2 rounded text-[0.65rem] tracking-widest uppercase transition-all ${selectedCategory === cat ? 'bg-gold text-white' : 'bg-cream text-mid border border-gold/10'}`}
                         >
                           {cat}
                         </button>
                       ))}
                    </div>
                 </section>

                 <section>
                    <h3 className="text-[0.6rem] uppercase tracking-widest text-mid font-bold mb-4">Select Sizes</h3>
                    <div className="flex flex-wrap gap-2">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`w-12 h-12 border rounded flex items-center justify-center text-xs transition-all ${
                            selectedSizes.has(size) ? 'bg-dark text-white border-dark' : 'bg-cream border-transparent text-mid'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                 </section>

                 <section>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Max Price</h3>
                    </div>
                    <div className="bg-cream p-6 rounded-lg">
                      <div className="text-xl font-serif text-dark mb-4">₹{priceRange[1]}</div>
                      <input 
                        type="range" 
                        min="0" 
                        max="5000" 
                        step="100"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full h-1 bg-gold/20 rounded-lg cursor-pointer appearance-none accent-gold"
                      />
                    </div>
                 </section>
              </div>

              <div className="pt-8 border-t border-gold/10 grid grid-cols-2 gap-4">
                 <button 
                  onClick={clearFilters}
                  className="py-4 border border-gold/20 text-[0.65rem] uppercase tracking-widest font-bold text-mid rounded active:bg-cream"
                 >
                   Clear All
                 </button>
                 <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="py-4 bg-dark text-white text-[0.65rem] uppercase tracking-widest font-bold rounded shadow-xl shadow-dark/20 active:scale-95 transition-transform"
                 >
                   Apply
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
