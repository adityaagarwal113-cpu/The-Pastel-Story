import React, { useState, useRef, CSSProperties, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, Star } from 'lucide-react';
import { Product, View } from '../types';
import { CATEGORIES, COLORS } from '../constants';
import { Footer } from '../components/Footer';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (id: number, size: string) => void;
  onWishlist: (id: number) => void;
  isWishlisted: boolean;
  setView: (view: View) => void;
}

export function ProductDetail({ product, onAddToCart, onWishlist, isWishlisted, setView }: ProductDetailProps) {
  const [mainImg, setMainImg] = useState(product.imgs[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'One Size');
  const [zoomStyle, setZoomStyle] = useState<CSSProperties>({ display: 'none' });
  const zoomRef = useRef<HTMLDivElement>(null);

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
              <div className="flex items-center gap-4 text-sm text-mid opacity-70">
                 <div className="flex text-gold">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                 </div>
                 <span>(124 Reviews)</span>
              </div>
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
                <button className="text-[0.6rem] uppercase tracking-widest text-gold hover:underline font-bold">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[56px] h-14 border rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                      selectedSize === size ? 'bg-dark text-white border-dark shadow-xl shadow-dark/20' : 'border-gold/20 text-mid hover:border-gold'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <button 
                disabled={product.oos}
                onClick={() => onAddToCart(product.id, selectedSize)}
                className="w-full py-5 bg-gold text-white rounded-xl font-bold text-xs tracking-[0.2em] uppercase shadow-[0_20px_40px_rgba(201,169,110,0.3)] hoverScale active:scale-95 transition-all flex items-center justify-center gap-4 disabled:bg-gray-200 disabled:shadow-none"
              >
                {product.oos ? '❌ Out of Stock' : (
                   <>
                    <ShoppingBag className="w-5 h-5" /> Add to Bag
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
      </div>

      <Footer />
    </div>
  );
}
