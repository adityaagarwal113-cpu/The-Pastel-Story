/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation } from './components/Navigation';
import { DEFAULT_PRODUCTS } from './constants';
import { Product, CartItem, View } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { useSiteData } from './hooks/useSiteData';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Views (to be created)
import { Home } from './views/Home';
import { Shop } from './views/Shop';
import { ProductDetail } from './views/ProductDetail';
import { Cart } from './views/Cart';
import { Payment } from './views/Payment';
import { Wishlist } from './views/Wishlist';
import { TrackOrder } from './views/TrackOrder';
import { Help } from './views/Help';
import { AdminPortal } from './views/AdminPortal';
import { Orders } from './views/Orders';

const CART_STORAGE_KEY = 'pastel_cart_v1';
const WISH_STORAGE_KEY = 'pastel_wish_v1';

function AppContent() {
  const { products, siteConfig, loading } = useSiteData();
  const { user } = useAuth();
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<number[]>(() => {
    const saved = localStorage.getItem(WISH_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [viewStack, setViewStack] = useState<View[]>(['home']);
  const currentView = viewStack[viewStack.length - 1];

  // Browser behavior: Sync view stack with history
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.viewStack) {
        setViewStack(event.state.viewStack);
      } else {
        setViewStack(['home']);
      }
    };

    window.addEventListener('popstate', handlePopState);
    // Initial state
    window.history.replaceState({ viewStack: ['home'] }, '');

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: View) => {
    setViewStack(prev => {
      // If already on this view, don't push
      if (prev[prev.length - 1] === view) return prev;
      
      const nextStack = [...prev, view];
      window.history.pushState({ viewStack: nextStack }, '', `#${view}`);
      return nextStack;
    });
  };

  const goBack = () => {
    if (viewStack.length > 1) {
      window.history.back();
    } else {
      // Just in case, ensure we are at home
      navigateTo('home');
    }
  };

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);

  // Cloud Sync: Load on login
  useEffect(() => {
    if (user) {
      const loadCloud = async () => {
        try {
          // Sync Cart
          const cartRef = doc(db, 'carts', user.uid);
          const cartSnap = await getDoc(cartRef);
          let masterCart = [...cart];
          
          if (cartSnap.exists()) {
            const cloudItems = cartSnap.data().items || [];
            cloudItems.forEach((c: CartItem) => {
              if (!masterCart.find(l => l.id === c.id && l.size === c.size)) {
                masterCart.push(c);
              }
            });
          }

          // Sync Wishlist
          const wishRef = doc(db, 'wishlists', user.uid);
          const wishSnap = await getDoc(wishRef);
          let masterWish = [...wishlist];

          if (wishSnap.exists()) {
            const cloudWish = wishSnap.data().items || [];
            cloudWish.forEach((id: number) => {
              if (!masterWish.includes(id)) {
                masterWish.push(id);
              }
            });
          }
          
          setCart(masterCart);
          setWishlist(masterWish);
          setHasLoadedCloud(true);

          // Update cloud with merged results
          await Promise.all([
            setDoc(cartRef, { items: masterCart, updatedAt: serverTimestamp() }),
            setDoc(wishRef, { items: masterWish, updatedAt: serverTimestamp() })
          ]);
        } catch (e) {
          console.error("Sync error:", e);
        }
      };
      loadCloud();
    } else {
      setHasLoadedCloud(false);
    }
  }, [user?.uid]);

  // Persistence (Local + Cloud)
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    if (user && hasLoadedCloud) {
       setDoc(doc(db, 'carts', user.uid), { 
         items: cart, 
         updatedAt: serverTimestamp() 
       }).catch(() => {});
    }
  }, [cart, user, hasLoadedCloud]);

  useEffect(() => {
    localStorage.setItem(WISH_STORAGE_KEY, JSON.stringify(wishlist));
    if (user && hasLoadedCloud) {
       setDoc(doc(db, 'wishlists', user.uid), { 
         items: wishlist, 
         updatedAt: serverTimestamp() 
       }).catch(() => {});
    }
  }, [wishlist, user, hasLoadedCloud]);

  // Toast handler
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Actions
  const addToCart = (id: number, size?: string) => {
    const product = products.find(p => p.id === id);
    if (!product || product.oos) return;

    const selectedSize = size || (product.sizes[0] || 'One Size');
    
    setCart(prev => {
      const existing = prev.find(item => item.id === id && item.size === selectedSize);
      if (existing) {
        return prev.map(item => 
          (item.id === id && item.size === selectedSize) ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        emoji: product.emoji,
        color: product.color,
        img: product.imgs[0],
        size: selectedSize,
        qty: 1
      }];
    });
    showToast(`✦ ${product.name} added to cart`);
  };

  const toggleWishlist = (id: number) => {
    setWishlist(prev => {
      if (prev.includes(id)) {
        showToast('Removed from wishlist');
        return prev.filter(wishId => wishId !== id);
      }
      showToast('✦ Added to wishlist');
      return [...prev, id];
    });
  };

  const updateCartQty = (id: number, size: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id && item.size === size) {
          const newQty = Math.max(0, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const removeFromCart = (id: number, size: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.size === size)));
    showToast('Item removed from cart');
  };

  const openProduct = (id: number) => {
    setSelectedProductId(id);
    navigateTo('pdp');
  };

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);

  const isAdmin = user?.email === 'adityaagarwal113@gmail.com';

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-serif italic text-dark opacity-40">Loading your story...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream selection:bg-gold/20">
      <Navigation 
        currentView={currentView} 
        setView={navigateTo} 
        goBack={goBack}
        hasHistory={viewStack.length > 1}
        cartCount={cartCount}
        wishCount={wishlist.length}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isAdmin={isAdmin}
        siteConfig={siteConfig}
      />

      <main className="pt-16 min-h-[calc(100vh-64px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (selectedProductId || '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'home' && (
              <Home 
                products={products} 
                siteConfig={siteConfig}
                onOpen={openProduct} 
                setView={navigateTo} 
                onAddToCart={addToCart}
                onWishlist={toggleWishlist}
                wishlist={wishlist}
              />
            )}
            {currentView === 'shop' && (
              <Shop 
                products={products} 
                siteConfig={siteConfig}
                onOpen={openProduct} 
                onAddToCart={addToCart}
                onWishlist={toggleWishlist}
                wishlist={wishlist}
              />
            )}
            {currentView === 'pdp' && selectedProductId && (
              <ProductDetail 
                product={products.find(p => p.id === selectedProductId)!} 
                onAddToCart={addToCart}
                onWishlist={toggleWishlist}
                isWishlisted={wishlist.includes(selectedProductId)}
                setView={navigateTo}
              />
            )}
            {currentView === 'cart' && (
              <Cart 
                cart={cart} 
                onUpdateQty={updateCartQty} 
                onRemove={removeFromCart}
                onClear={() => setCart([])}
                setView={navigateTo}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                setCheckoutData={setCheckoutData}
              />
            )}
            {currentView === 'payment' && checkoutData && (
              <Payment 
                checkoutData={checkoutData}
                onClearCart={() => setCart([])}
                setView={navigateTo}
              />
            )}
            {currentView === 'track' && <TrackOrder />}
            {currentView === 'wishlist' && (
              <Wishlist 
                products={products} 
                wishlist={wishlist} 
                onOpen={openProduct} 
                onWishlist={toggleWishlist} 
                onAddToCart={addToCart}
              />
            )}
            {currentView === 'help' && <Help />}
            {currentView === 'admin' && <AdminPortal setView={navigateTo} />}
            {currentView === 'orders' && (
              <Orders 
                products={products} 
                onOpenProduct={openProduct} 
                onAddToCart={addToCart}
                setView={navigateTo}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Admin Link */}
      {isAdmin && currentView !== 'admin' && (
        <button
          onClick={() => navigateTo('admin')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-dark text-gold rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-[100]"
        >
          <span className="text-2xl">⚙</span>
        </button>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-dark text-white px-6 py-3 rounded-full shadow-2xl z-[200] text-sm tracking-widest font-medium pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

