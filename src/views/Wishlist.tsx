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
}

export function Wishlist({ products, wishlist, onOpen, onWishlist, onAddToCart, onMoveToCart }: WishlistProps) {
  const wishItems = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="bg-white min-h-screen">
      <header className="pt-20 pb-12 px-4 text-center">
        <div className="w-16 h-16 bg-dusty/10 rounded-full flex items-center justify-center mx-auto mb-6">
           <Heart className="w-8 h-8 text-dusty fill-current" />
        </div>
        <h1 className="font-serif text-4xl text-dark mb-4 italic">Saved Pieces</h1>
        <p className="text-light text-sm tracking-widest max-w-sm mx-auto uppercase">Your personal boutique of favorites</p>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {wishItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
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
          <div className="text-center py-32">
             <div className="text-4xl mb-4 opacity-30">🤍</div>
             <h3 className="font-serif text-2xl text-mid mb-2 italic">Your wishlist is empty</h3>
             <p className="text-light text-sm mb-8">Save your favorite styles to access them quickly.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
