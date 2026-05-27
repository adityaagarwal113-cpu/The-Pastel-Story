import React, { useState, useRef, CSSProperties, MouseEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, Star, X, Info, MessageSquare, CheckCircle2, ChevronRight } from 'lucide-react';
import { Product, View, CartItem } from '../types';
import { CATEGORIES, COLORS } from '../constants';
import { Footer } from '../components/Footer';
import { ReviewSection } from '../components/ReviewSection';

interface ProductDetailProps {
  product: Product;
  siteConfig: any;
  onAddToCart: (id: number, size: string, customization?: string) => void;
  onWishlist: (id: number) => void;
  isWishlisted: boolean;
  setView: (view: View) => void;
  initialEditItem?: CartItem;
}

export function ProductDetail({ product, siteConfig, onAddToCart, onWishlist, isWishlisted, setView, initialEditItem }: ProductDetailProps) {
  const [mainImg, setMainImg] = useState<string | null>(product.imgs[0]);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedSize, setSelectedSize] = useState(initialEditItem?.size || product.sizes[0] || 'One Size');
  const [addedToCart, setAddedToCart] = useState(false);
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
    <div className="bg-[#faf8f6] min-h-screen pt-24">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-12">
        {/* Breadcrumb - Minimal */}
        <div className="flex items-center gap-3 text-micro text-mid/50 mb-16">
          <button onClick={() => setView('home')} className="hover:text-gold transition-colors">Archivio</button>
          <span>/</span>
          <button onClick={() => setView('shop')} className="hover:text-gold transition-colors">Selection</button>
          <span>/</span>
          <span className="text-dark font-bold font-serif italic lowercase">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          {/* Gallery UI - High Resolution Vertical Grid focus */}
          <div className="lg:col-span-7 flex flex-col md:flex-row gap-6">
            {(product.imgs.length > 1 || product.videoUrl) && (
              <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scroller-hidden shrink-0">
                {product.imgs.map((img, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                        setMainImg(img);
                        setShowVideo(false);
                    }}
                    className={`relative w-20 aspect-[3/4] overflow-hidden transition-all duration-700 ${
                      !showVideo && mainImg === img ? 'ring-1 ring-gold shadow-lg grayscale-0' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover object-top" alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                  </button>
                ))}
                {product.videoUrl && (
                  <button 
                    onClick={() => setShowVideo(true)}
                    className={`relative w-20 aspect-[3/4] overflow-hidden transition-all duration-700 bg-black flex items-center justify-center ${
                      showVideo ? 'ring-1 ring-gold shadow-lg' : 'opacity-40 hover:opacity-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1" />
                    </div>
                  </button>
                )}
              </div>
            )}
            
            <div className="flex-1 space-y-6">
              <div 
                ref={zoomRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setZoomStyle({ display: 'none' })}
                className="relative aspect-[3/4] bg-[#eeebe7] overflow-hidden cursor-zoom-in luxury-shadow group"
              >
                {showVideo && product.videoUrl ? (
                    <video 
                        src={product.videoUrl} 
                        className="w-full h-full object-cover" 
                        autoPlay 
                        muted 
                        loop 
                        controls 
                    />
                ) : (
                    <>
                        <img 
                        src={mainImg || ''} 
                        className="w-full h-full object-cover object-top transition-all duration-1000 grayscale-[10%] group-hover:grayscale-0" 
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        />
                        <div 
                        className="absolute inset-0 pointer-events-none" 
                        style={zoomStyle}
                        />
                    </>
                )}
                <div className="absolute inset-0 bg-dark/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </div>
            </div>
          </div>

          {/* Info UI - Elegant Typography & Controls */}
          <div className="lg:col-span-5 flex flex-col gap-12 sticky top-48">
            <div className="space-y-4">
              <span className="text-micro text-gold">The Pastel Story / SS '25</span>
              <h1 className="font-serif text-5xl sm:text-7xl text-dark leading-[0.9] tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-baseline gap-4">
                   <span className="font-serif text-3xl text-dark">₹{product.price.toLocaleString('en-IN')}</span>
                   {product.oldPrice && (
                      <span className="text-lg text-light line-through font-light opacity-50">₹{product.oldPrice.toLocaleString('en-IN')}</span>
                   )}
                </div>
                <button 
                  onClick={scrollToReviews}
                  className="text-micro text-gold underline underline-offset-8 decoration-gold/20 hover:decoration-gold transition-all"
                >
                  Read Feedback
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-gold/10" />

            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-micro text-dark">Silhouette Size</h3>
                <button 
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-micro text-gold hover:opacity-70 transition-opacity flex items-center gap-2"
                >
                  <Info className="w-3 h-3" /> Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-4">
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
                      className={`relative min-w-[64px] h-16 border transition-all duration-700 flex items-center justify-center text-[0.7rem] font-bold ${
                        !isAvailable 
                          ? 'opacity-20 cursor-not-allowed line-through' 
                          : selectedSize === size 
                            ? 'bg-dark text-white border-dark luxury-shadow' 
                            : 'border-gold/10 text-mid/60 hover:border-gold hover:text-gold'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                {selectedSize === 'Custom' && (
                    <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                    >
                    <div className="flex justify-between items-center">
                        <h3 className="text-micro text-gold">Custom Measurements</h3>
                        <button 
                        onClick={() => setMeasurements('')}
                        className="text-micro text-red-400 hover:underline"
                        >
                        Clear
                        </button>
                    </div>
                    <textarea
                        value={measurements}
                        onChange={(e) => setMeasurements(e.target.value)}
                        placeholder="Bust, Waist, Hip, Length in inches..."
                        className="w-full p-6 bg-white border border-gold/10 focus:border-gold/30 outline-none transition-all font-serif italic text-base min-h-[120px] resize-none luxury-shadow"
                    />
                    </motion.div>
                )}
                </AnimatePresence>

                <AnimatePresence>
                {showAdditional && (
                    <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                    >
                    <div className="flex justify-between items-center">
                        <h3 className="text-micro text-gold">Design Preferences</h3>
                        <button 
                        onClick={() => {
                            setAdditionalRequests('');
                            setShowAdditional(false);
                        }}
                        className="text-micro text-red-400 hover:underline"
                        >
                        Remove
                        </button>
                    </div>
                    <textarea
                        value={additionalRequests}
                        onChange={(e) => setAdditionalRequests(e.target.value)}
                        placeholder="Any specific design changes..."
                        className="w-full p-6 bg-white border border-gold/10 focus:border-gold/30 outline-none transition-all font-serif italic text-base min-h-[100px] resize-none luxury-shadow"
                    />
                    </motion.div>
                )}
                </AnimatePresence>

                {!showAdditional && (
                  <button 
                      onClick={() => setShowAdditional(true)}
                      className="text-micro text-mid/40 hover:text-gold transition-colors italic lowercase"
                  >
                      + add customization details
                  </button>
                )}
            </div>

            <div className="flex flex-col gap-4">
              <button 
                disabled={product.oos || (selectedSize === 'Custom' && !measurements.trim())}
                onClick={() => {
                    const combined = [
                        measurements.trim(),
                        additionalRequests.trim() ? `\n--- Additional Requests ---\n${additionalRequests.trim()}` : ''
                    ].filter(Boolean).join('');
                    onAddToCart(product.id, selectedSize, combined);
                    setAddedToCart(true);
                }}
                className={`w-full py-6 rounded-sm font-bold text-micro tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-6 disabled:bg-gray-100 disabled:text-light/30 ${
                    addedToCart ? 'bg-green-600 text-white' : 'bg-dark text-white hover:bg-gold hover:luxury-shadow'
                }`}
              >
                {product.oos ? 'Sold Out' : (
                   <>
                    {addedToCart ? <CheckCircle2 className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />} 
                    {addedToCart ? 'Preserved in Bag' : initialEditItem ? 'Update Story' : 'Reserve to Bag'}
                   </>
                )}
              </button>
              
              <AnimatePresence>
                {addedToCart && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={() => setView('cart')}
                    className="w-full py-5 bg-white border border-gold/10 text-dark font-bold text-micro tracking-[0.3em] uppercase flex items-center justify-center gap-4 group"
                  >
                    View Bag <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                )}
              </AnimatePresence>

              <button 
                onClick={() => onWishlist(product.id)}
                className={`w-full py-5 text-micro tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-4 ${
                  isWishlisted ? 'text-dusty font-bold' : 'text-mid/60 hover:text-gold'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} /> {isWishlisted ? 'Saved in Journal' : 'Add to Journal'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-t border-gold/5 opacity-60">
              <div className="flex flex-col items-center text-center gap-3">
                  <Truck className="w-4 h-4 text-gold-d" />
                  <p className="text-micro">Artisanal Shipping</p>
              </div>
              <div className="flex flex-col items-center text-center gap-3 border-x border-gold/10">
                  <RotateCcw className="w-4 h-4 text-gold-d" />
                  <p className="text-micro">7 Day Exchange</p>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-gold-d" />
                  <p className="text-micro">Fair Trade Cloth</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-32 max-w-4xl mx-auto" ref={reviewsRef}>
          <div className="flex items-center gap-8 mb-16">
            <h2 className="font-serif text-4xl text-dark">Stories from users</h2>
            <div className="h-px flex-1 bg-gold/10" />
          </div>
          <ReviewSection productId={product.id} />
        </div>
      </div>

      <Footer setView={setView} siteConfig={siteConfig} />

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
