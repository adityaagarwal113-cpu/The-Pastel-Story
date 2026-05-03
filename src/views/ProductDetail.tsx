import React, { useState, useRef, CSSProperties, MouseEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, Star, X, Info, MessageSquare } from 'lucide-react';
import { Product, View, CartItem } from '../types';
import { CATEGORIES, COLORS } from '../constants';
import { Footer } from '../components/Footer';
import { ReviewSection } from '../components/ReviewSection';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (id: number, size: string, customization?: string) => void;
  onWishlist: (id: number) => void;
  isWishlisted: boolean;
  setView: (view: View) => void;
  initialEditItem?: CartItem;
}

export function ProductDetail({ product, onAddToCart, onWishlist, isWishlisted, setView, initialEditItem }: ProductDetailProps) {
  const [mainImg, setMainImg] = useState(product.imgs[0]);
  const [selectedSize, setSelectedSize] = useState(initialEditItem?.size || product.sizes[0] || 'One Size');
  const [measurements, setMeasurements] = useState('');
  const [additionalRequests, setAdditionalRequests] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'measure'>('chart');
  const [zoomStyle, setZoomStyle] = useState<CSSProperties>({ display: 'none' });
  const zoomRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialEditItem) {
        setSelectedSize(initialEditItem.size);
        const [m, a] = (initialEditItem.customization || '').split('\n--- Additional Requests ---\n');
        setMeasurements(m || '');
        if (a) {
            setAdditionalRequests(a);
            setShowAdditional(true);
        }
    }
  }, [initialEditItem]);

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!zoomRef.current) return;
    const { left, top, width, height } = zoomRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${mainImg})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '250%'
    });
  };

  const offPct = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-widest text-light mb-12">
          <button onClick={() => setView('home')} className="hover:text-gold transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => setView('shop')} className="hover:text-gold transition-colors">Shop</button>
          <span>/</span>
          <span className="text-dark font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Gallery UI */}
          <div className="space-y-6">
             <div 
              ref={zoomRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setZoomStyle({ display: 'none' })}
              className="relative aspect-[3/4] bg-blush/20 rounded-xl overflow-hidden cursor-zoom-in group shadow-2xl shadow-gold/5"
            >
              <img 
                src={mainImg} 
                className="w-full h-full object-cover object-top transition-transform duration-500 hover:opacity-0" 
                alt={product.name}
                referrerPolicy="no-referrer"
              />
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={zoomStyle}
              />
              <div className="absolute bottom-4 right-4 bg-dark/40 backdrop-blur-md px-3 py-1 rounded text-[0.6rem] text-white tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                Hover to zoom
              </div>
            </div>

            {product.imgs.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scroller-hidden">
                {product.imgs.map((img, i) => (
                  <button 
                    key={i}
                    onClick={() => setMainImg(img)}
                    className={`relative w-20 aspect-[3/4] rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      mainImg === img ? 'border-gold scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover object-top" alt="" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info UI */}
          <div className="space-y-8 py-4">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.4em] text-gold font-bold mb-4">
                {CATEGORIES[product.category as keyof typeof CATEGORIES] || product.category}
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl text-dark mb-4 leading-tight">{product.name}</h1>
              <button 
                onClick={scrollToReviews}
                className="flex items-center gap-4 text-sm text-mid opacity-70 hover:opacity-100 transition-opacity"
              >
                 <div className="flex text-gold">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                 </div>
                 <span className="underline decoration-gold/30 underline-offset-4">See Reviews</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-4">
                 <span className="font-serif text-4xl font-semibold text-dark">₹{product.price.toLocaleString('en-IN')}</span>
                 {product.oldPrice && (
                    <span className="text-xl text-light line-through font-light italic">₹{product.oldPrice.toLocaleString('en-IN')}</span>
                 )}
                 {offPct > 0 && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">
                      {offPct}% Off
                    </span>
                 )}
              </div>
              <p className="text-[0.65rem] text-light uppercase tracking-widest">Inclusve of all taxes</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[0.65rem] uppercase tracking-widest text-dark font-bold">Select Size</h3>
                <button 
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-[0.6rem] uppercase tracking-widest text-gold hover:underline font-bold flex items-center gap-1"
                >
                  <Info className="w-3 h-3" /> Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'].map(size => {
                  const isAvailable = size === 'Custom' || (product.sizes || []).includes(size);
                  return (
                    <button
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => {
                          setSelectedSize(size);
                          if (size !== 'Custom') setMeasurements('');
                      }}
                      className={`relative min-w-[56px] h-14 border rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                        !isAvailable 
                          ? 'border-gray-100 text-gray-300 cursor-not-allowed overflow-hidden opacity-60' 
                          : selectedSize === size 
                            ? 'bg-dark text-white border-dark shadow-xl shadow-dark/20' 
                            : 'border-gold/20 text-mid hover:border-gold'
                      }`}
                    >
                      {size}
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-full h-[1px] bg-red-400/50 -rotate-45" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customization / Custom Size Specification Box */}
            <div className="space-y-6 pt-4">
                <AnimatePresence>
                {selectedSize === 'Custom' && (
                    <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                    >
                    <div className="flex justify-between items-center">
                        <h3 className="text-[0.65rem] uppercase tracking-widest text-dark font-bold">Size Specifications</h3>
                        <button 
                        onClick={() => setMeasurements('')}
                        className="text-[0.6rem] text-red-400 font-bold uppercase tracking-widest hover:underline"
                        >
                        Clear
                        </button>
                    </div>
                    <textarea
                        value={measurements}
                        onChange={(e) => setMeasurements(e.target.value)}
                        placeholder="Please provide measurements for: Bust, Waist, Hip, and Length here..."
                        className={`w-full p-4 bg-cream/30 border rounded-xl outline-none transition-all font-serif italic text-sm min-h-[120px] resize-none ${
                            !measurements.trim() ? 'border-red-200 focus:border-red-300' : 'border-gold/10 focus:border-gold/30'
                        }`}
                    />
                    <p className="text-[0.6rem] text-light leading-relaxed">
                        * Please provide exact measurements in inches for a perfect fit.
                    </p>
                    </motion.div>
                )}
                </AnimatePresence>

                <AnimatePresence>
                {showAdditional && (
                    <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden border-t border-gold/5 pt-4"
                    >
                    <div className="flex justify-between items-center">
                        <h3 className="text-[0.65rem] uppercase tracking-widest text-dark font-bold">Additional Customization</h3>
                        <button 
                        onClick={() => {
                            setAdditionalRequests('');
                            setShowAdditional(false);
                        }}
                        className="text-[0.6rem] text-red-400 font-bold uppercase tracking-widest hover:underline"
                        >
                        Remove
                        </button>
                    </div>
                    <textarea
                        value={additionalRequests}
                        onChange={(e) => setAdditionalRequests(e.target.value)}
                        placeholder="Please specify your custom requests, design changes, or special preferences here..."
                        className="w-full p-4 bg-cream/30 border border-gold/10 focus:border-gold/30 rounded-xl outline-none transition-all font-serif italic text-sm min-h-[100px] resize-none"
                    />
                    </motion.div>
                )}
                </AnimatePresence>

                {!showAdditional && (
                <div className="pt-2">
                    <div 
                        onClick={() => setShowAdditional(true)}
                        className="text-[0.6rem] uppercase tracking-[0.2em] font-bold text-mid/60 hover:text-gold transition-colors flex items-center gap-2 cursor-pointer group"
                    >
                        <Star className="w-3 h-3 group-hover:rotate-12 transition-transform" /> + Add Additional Customization / Requests
                    </div>
                </div>
                )}
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <button 
                disabled={product.oos || (selectedSize === 'Custom' && !measurements.trim())}
                onClick={() => {
                    const combined = [
                        measurements.trim(),
                        additionalRequests.trim() ? `\n--- Additional Requests ---\n${additionalRequests.trim()}` : ''
                    ].filter(Boolean).join('');
                    onAddToCart(product.id, selectedSize, combined);
                }}
                className="w-full py-5 bg-gold text-white rounded-xl font-bold text-xs tracking-[0.2em] uppercase shadow-[0_20px_40px_rgba(201,169,110,0.3)] hoverScale active:scale-95 transition-all flex items-center justify-center gap-4 disabled:bg-gray-200 disabled:shadow-none"
              >
                {product.oos ? '❌ Out of Stock' : (
                   <>
                    <ShoppingBag className="w-5 h-5" /> 
                    {initialEditItem ? 'Update Order' : 'Add to Bag'}
                   </>
                )}
              </button>
              <button 
                onClick={() => onWishlist(product.id)}
                className={`w-full py-4 border rounded-xl font-bold text-[0.65rem] tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${
                  isWishlisted ? 'bg-dusty/10 border-dusty text-dusty' : 'border-gold/20 text-mid hover:border-gold/60'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} /> {isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
              </button>
            </div>

            <div className="border-t border-gold/10 pt-10 space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-gold" />
                     </div>
                     <div>
                        <p className="text-[0.65rem] uppercase font-bold text-dark">Fast Delivery</p>
                        <p className="text-[0.6rem] text-light">3-5 Banking days</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0">
                        <RotateCcw className="w-4 h-4 text-gold" />
                     </div>
                     <div>
                        <p className="text-[0.65rem] uppercase font-bold text-dark">Easy Exchange</p>
                        <p className="text-[0.6rem] text-light">7-day hassle free</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-gold" />
                     </div>
                     <div>
                        <p className="text-[0.65rem] uppercase font-bold text-dark">100% Cotton</p>
                        <p className="text-[0.6rem] text-light">Premium fabric</p>
                     </div>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <h4 className="text-[0.7rem] uppercase tracking-widest text-gold font-bold">Product Story</h4>
                  <p className="text-sm text-mid leading-relaxed opacity-70 italic font-serif">
                    {product.desc}
                  </p>
               </div>
            </div>
          </div>
        </div>

        <div ref={reviewsRef}>
          <ReviewSection productId={product.id} />
        </div>
      </div>

      <Footer />

      {/* Size Guide Modal */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute inset-0 bg-dark/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gold/10"
            >
              <div className="p-6 border-b border-gold/10 flex justify-between items-center bg-white">
                <h2 className="text-[0.7rem] uppercase tracking-[0.2em] font-bold text-dark">Size Recommendation</h2>
                <button 
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="p-1.5 hover:bg-cream rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-dark" />
                </button>
              </div>

              <div className="flex border-b border-gold/10">
                <button 
                  onClick={() => setActiveTab('chart')}
                  className={`flex-1 py-4 text-[0.6rem] uppercase tracking-widest font-bold transition-all relative ${activeTab === 'chart' ? 'text-gold' : 'text-mid/60'}`}
                >
                  Size Chart
                  {activeTab === 'chart' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
                </button>
                <button 
                  onClick={() => setActiveTab('measure')}
                  className={`flex-1 py-4 text-[0.6rem] uppercase tracking-widest font-bold transition-all relative ${activeTab === 'measure' ? 'text-gold' : 'text-mid/60'}`}
                >
                  How to measure
                  {activeTab === 'measure' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {activeTab === 'chart' ? (
                    <motion.div
                      key="chart"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[0.55rem] uppercase tracking-widest text-mid font-bold">
                            <th className="pb-3 px-1">Size</th>
                            <th className="pb-3 text-center">Waist (in)</th>
                            <th className="pb-3 text-right">Inseam (in)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gold/5">
                          {[
                            { s: '30', w: '30.0', i: '33.0' },
                            { s: '32', w: '32.0', i: '33.0' },
                            { s: '34', w: '34.0', i: '33.0' },
                            { s: '36', w: '36.0', i: '33.0' },
                            { s: '38', w: '38.0', i: '33.0' }
                          ].map(row => (
                            <tr key={row.s} className="text-sm">
                              <td className="py-3 px-1 font-bold text-dark">{row.s}</td>
                              <td className="py-3 text-center text-mid">{row.w}</td>
                              <td className="py-3 text-right text-mid">{row.i}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="measure"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[0.6rem] font-bold shrink-0">1</div>
                          <div>
                            <p className="text-[0.65rem] uppercase font-bold text-dark mb-1">Waist</p>
                            <p className="text-[0.7rem] text-mid leading-relaxed italic">Measure around the narrowest part of your waistline, keeping the tape a bit loose.</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[0.6rem] font-bold shrink-0">2</div>
                          <div>
                            <p className="text-[0.65rem] uppercase font-bold text-dark mb-1">Inseam</p>
                            <p className="text-[0.7rem] text-mid leading-relaxed italic">Measure from the top of your inner leg to the floor.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6 bg-cream/10 border-t border-gold/5 flex justify-center">
                 <button 
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="px-8 py-3 bg-dark text-white rounded-full text-[0.6rem] uppercase tracking-widest font-bold hover:scale-105 transition-all shadow-lg shadow-dark/20"
                 >
                   Continue Shopping
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
