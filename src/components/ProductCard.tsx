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
      className="group bg-white rounded-lg overflow-hidden cursor-pointer flex flex-col transition-shadow duration-300 hover:shadow-xl hover:shadow-gold/10"
      onClick={() => onOpen(product.id)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-blush/20">
        {img0 ? (
          <>
            <img
              src={img0}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110 group-hover:opacity-0"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {img1 && (
              <img
                src={img1}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover object-top opacity-0 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
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

        {product.badge && (
          <span className={`absolute top-2 left-2 px-2 py-0.5 text-[0.6rem] tracking-widest uppercase rounded-sm z-10 ${product.oos ? 'bg-mid text-white' : 'bg-gold text-white'}`}>
            {product.oos ? 'Sold Out' : product.badge}
          </span>
        )}

        {product.stock && !product.oos && product.stock <= 3 && (
          <span className="absolute bottom-2 left-2 bg-red-500/90 text-white text-[0.55rem] font-medium tracking-wider px-2 py-0.5 rounded-sm backdrop-blur-sm z-10 uppercase animate-pulse">
            Only {product.stock} left!
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onWishlist(product.id);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
            isWishlisted ? 'bg-dusty/20 text-dusty' : 'bg-white/90 text-mid hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-[0.6rem] tracking-widest uppercase text-gold font-medium">
          {CATEGORIES[product.category as keyof typeof CATEGORIES] || product.category}
        </p>
        <h3 className="font-medium text-sm text-dark line-clamp-1 group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <p className="text-[0.7rem] text-light line-clamp-1 italic">
          {product.desc}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-semibold text-base">₹{product.price.toLocaleString('en-IN')}</span>
            {product.oldPrice && (
              <>
                <span className="text-[0.7rem] text-light line-through">₹{product.oldPrice.toLocaleString('en-IN')}</span>
                <span className="text-[0.6rem] text-green-600 font-medium whitespace-nowrap">({offPct}% OFF)</span>
              </>
            )}
          </div>
          <button
            disabled={product.oos}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            className="p-1.5 bg-dark text-white rounded hover:bg-gold transition-colors disabled:bg-gray-200 disabled:text-light disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
