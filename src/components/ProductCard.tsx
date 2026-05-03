import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES, COLORS } from '../constants';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onOpen: (id: number) => void;
  onAddToCart: (id: number) => void;
  onWishlist: (id: number) => void;
  isWishlisted: boolean;
}

export function ProductCard({ product, onOpen, onAddToCart, onWishlist, isWishlisted }: ProductCardProps) {
  const offPct = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const img0 = product.imgs[0];
  const img1 = product.imgs[1];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-transparent cursor-pointer flex flex-col"
      onClick={() => onOpen(product.id)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#eeebe7] rounded-sm mb-4 group">
        {img0 ? (
          <>
            <img
              src={img0}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-0"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {img1 && (
              <img
                src={img1}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover object-top opacity-0 transition-all duration-1000 group-hover:scale-105 group-hover:opacity-100"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: COLORS[product.color as keyof typeof COLORS] || COLORS.blush }}>
            <span className="text-4xl opacity-40">{product.emoji}</span>
          </div>
        )}

        {product.badge && !product.oos && (
          <span className="absolute top-4 left-4 glass text-dark px-3 py-1 text-[0.55rem] tracking-[0.3em] uppercase font-bold z-10">
            {product.badge}
          </span>
        )}

        {product.oos && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-dark/20 backdrop-blur-[2px]">
            <span className="text-white text-[0.6rem] tracking-[0.4em] uppercase font-bold px-6 py-3 border border-white/40">
              Waitlist Only
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-dark/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWishlist(product.id);
          }}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
            isWishlisted ? 'glass text-dusty' : 'bg-white/40 backdrop-blur-sm text-dark opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="font-serif italic text-lg text-dark group-hover:text-gold transition-colors duration-500">
              {product.name}
            </h3>
            <p className="text-[0.6rem] tracking-[0.2em] uppercase text-mid font-semibold mt-0.5">
              {product.category}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-medium text-sm tracking-tight">₹{product.price.toLocaleString('en-IN')}</span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-[0.65rem] text-light line-through opacity-60">₹{product.oldPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>

        {!product.oos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            className="mt-4 w-full py-3 border border-dark/10 rounded-sm text-[0.6rem] tracking-[0.2em] font-bold uppercase transition-all hover:bg-dark hover:text-white flex items-center justify-center gap-2 group/btn"
          >
            <ShoppingBag className="w-3 h-3 transition-transform group-hover/btn:scale-110" />
            Add to Cart
          </button>
        )}
      </div>
    </motion.div>
  );
}
