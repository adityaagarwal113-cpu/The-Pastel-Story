import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { Heart } from 'lucide-react';
import { Footer } from '../components/Footer';

interface WishlistProps {
  products: Product[];
  wishlist: number[];
  onOpen: (id: number) => void;
  onWishlist: (id: number) => void;
  onAddToCart: (id: number) => void;
  onMoveToCart: (id: number) => void;
  siteConfig: any;
}

export function Wishlist({ products, wishlist, onOpen, onWishlist, onAddToCart, onMoveToCart, siteConfig }: WishlistProps) {
  const wishItems = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="bg-[#faf8f6] min-h-screen pt-24">
      <header className="pt-20 pb-16 px-6 text-center">
        <span className="text-micro text-gold mb-4 block">Your Wishlist</span>
        <h1 className="font-serif text-5xl sm:text-7xl text-dark mb-4 italic tracking-tight">
          My <span className="text-gold-d not-italic font-medium">Wishlist</span>
        </h1>
        <div className="h-px w-20 bg-gold/10 mx-auto my-10" />
      </header>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-12">
        {wishItems.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-20">
            {wishItems.map((p) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onOpen={onOpen} 
                onAddToCart={onMoveToCart}
                onWishlist={onWishlist}
                isWishlisted={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-white/40 border border-gold/5 luxury-shadow max-w-2xl mx-auto rounded-sm">
             <div className="text-2xl mb-6 opacity-30 italic font-serif">Wishlist is empty</div>
             <p className="text-mid/60 text-sm mb-12 max-w-xs mx-auto leading-relaxed">Your wishlist is currently empty. Browse the shop to add items you love.</p>
             <button 
              onClick={() => window.dispatchEvent(new CustomEvent('pastel_nav', { detail: 'shop' }))}
              className="text-micro bg-dark text-white px-10 py-5 hover:bg-gold transition-all"
             >
               Browse Collection
             </button>
          </div>
        )}
      </div>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
