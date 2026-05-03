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
    <div className="bg-[#faf8f6] min-h-screen">
      {/* Editorial Header */}
      <header className="pt-32 pb-16 px-6 text-center">
        <span className="text-micro text-gold mb-4 block">The Collection</span>
        <h1 className="font-serif text-5xl sm:text-7xl text-dark mb-4 tracking-tight italic">
          Boutique <span className="text-gold-d not-italic font-medium">Curations</span>
        </h1>
        <div className="h-px w-24 bg-gold/20 mx-auto my-8" />
        <p className="text-mid text-sm tracking-widest max-w-sm mx-auto uppercase opacity-60">Discover our signature pastel silhouettes</p>
      </header>

      {/* Modern Controls Bar */}
      <div className="sticky top-20 z-30 bg-white/60 backdrop-blur-xl border-y border-gold/10 py-6 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8 w-full md:w-auto">
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-3 text-micro text-dark hover:text-gold transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" /> 
              <span>Filters {filteredProducts.length !== products.length && `(${products.length - filteredProducts.length})`}</span>
            </button>
            
            <div className="flex-1 md:w-64 relative group border-l border-gold/10 pl-8">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-light/40 group-focus-within:text-gold transition-colors" />
              <input 
                type="text" 
                placeholder="Search Archive..."
                className="w-full pl-6 pr-4 py-1 bg-transparent outline-none text-xs tracking-widest uppercase placeholder:text-light/30 transition-all font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 text-micro">
            <span className="text-light/50 hidden sm:inline">Order by</span>
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="bg-transparent outline-none cursor-pointer hover:text-gold border-none pr-4 font-bold"
            >
              <option value="relevance">Default</option>
              <option value="low">Price: Low</option>
              <option value="high">Price: High</option>
              <option value="new">Newest</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-20">
           {/* Boutique Sidebar */}
           <aside className="hidden lg:block space-y-16 sticky top-48 h-fit">
             <section>
                <div className="flex items-center gap-4 mb-10">
                  <span className="text-micro text-gold">Archives</span>
                  <div className="h-px flex-1 bg-gold/10" />
                </div>
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`block w-full text-left text-xs uppercase tracking-[0.2em] transition-all hover:pl-2 ${selectedCategory === 'all' ? 'text-dark font-bold' : 'text-mid/50 hover:text-gold'}`}
                  >
                    All Collection <span className="text-[0.6rem] ml-2 opacity-30">({products.length})</span>
                  </button>
                  {categories.map((cat: string) => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`block w-full text-left text-xs uppercase tracking-[0.2em] transition-all hover:pl-2 ${selectedCategory === cat ? 'text-gold font-bold italic translate-x-2' : 'text-mid/50 hover:text-gold'}`}
                    >
                      {cat} <span className="text-[0.6rem] ml-2 opacity-30">({products.filter(p => p.category === cat).length})</span>
                    </button>
                  ))}
                </div>
             </section>

             <section>
                <div className="flex items-center gap-4 mb-10">
                  <span className="text-micro text-gold">Sizing</span>
                  <div className="h-px flex-1 bg-gold/10" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`w-12 h-12 border transition-all duration-500 rounded-sm flex items-center justify-center text-[0.65rem] font-bold ${
                        selectedSizes.has(size) ? 'bg-dark text-white border-dark' : 'border-gold/10 text-mid/40 hover:border-gold'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
             </section>

             <section>
                <div className="flex items-center gap-4 mb-10">
                  <span className="text-micro text-gold">Price Cap</span>
                  <div className="h-px flex-1 bg-gold/10" />
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between text-micro text-dark">
                    <span>₹0</span>
                    <span className="text-gold">₹{priceRange[1]}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-gold bg-gold/10 rounded-full cursor-pointer appearance-none h-1"
                  />
                </div>
             </section>

             <button 
              onClick={clearFilters}
              className="text-micro text-red-400 group flex items-center gap-3 hover:opacity-70 transition-opacity"
             >
                <X className="w-3 h-3" /> Reset Criteria
             </button>
           </aside>

           {/* Results Grid - High Density */}
           <div>
             <div className="mb-12 flex items-center justify-between border-b border-gold/5 pb-6">
                <span className="text-mid/40 text-micro">
                  Selection / <strong>{filteredProducts.length}</strong> Results
                </span>
             </div>

             {filteredProducts.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-20">
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
               <div className="text-center py-40 border border-gold/10 bg-white/40">
                  <h3 className="font-serif text-3xl text-dark mb-4 italic">The archive is empty.</h3>
                  <p className="text-mid text-sm mb-10 opacity-60">Try adjusting your criteria to find something beautiful.</p>
                  <button 
                    onClick={clearFilters}
                    className="text-micro bg-dark text-white px-10 py-5 hover:bg-gold transition-all"
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

      <Footer setView={() => {}} siteConfig={siteConfig} />
    </div>
  );
}
