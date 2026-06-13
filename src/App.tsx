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
import { Analytics } from '@vercel/analytics/react';

// Views (to be created)
import { Home } from './views/Home';
import { Shop } from './views/Shop';
import { About } from './views/About';
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
  const { products, siteConfig, loading, usingContentful } = useSiteData();
  const { user } = useAuth();
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(item => ({
        ...item,
        selected: item.selected !== undefined ? item.selected : true
      })) : [];
    } catch {
      return [];
    }
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
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  // Handle Firestore Quota Exceeded event
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setIsQuotaExceeded(true);
    };

    window.addEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('firestore-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Global Scroll Reset on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProductId]);

  // Parse deep product links from URL query parameters (e.g. ?product=123)
  useEffect(() => {
    if (products && products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const prodIdStr = params.get('product');
      if (prodIdStr) {
        const prodId = parseInt(prodIdStr, 10);
        const prod = products.find(p => p.id === prodId);
        if (prod) {
          setSelectedProductId(prodId);
          setViewStack(['home', 'pdp']);
          
          // Clean up the URL query parameter so going back or reloading doesn't trap the user
          const newUrl = window.location.origin + window.location.pathname + window.location.hash;
          window.history.replaceState({ viewStack: ['home', 'pdp'] }, '', newUrl);
        }
      }
    }
  }, [products]);

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
              const normalizedC = { 
                ...c, 
                customization: c.customization || '', 
                selected: c.selected !== undefined ? c.selected : true 
              };
              if (!masterCart.find(l => 
                l.id === normalizedC.id && 
                l.size === normalizedC.size && 
                (l.customization || '') === normalizedC.customization
              )) {
                masterCart.push(normalizedC);
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
          
          // Force deduplication and normalization of masterCart
          const uniqueCart: CartItem[] = [];
          masterCart.forEach(item => {
            const normalized = { 
              ...item, 
              customization: item.customization || '',
              selected: item.selected !== undefined ? item.selected : true
            };
            const existing = uniqueCart.find(u => 
              u.id === normalized.id && 
              u.size === normalized.size && 
              (u.customization || '') === normalized.customization
            );
            if (existing) {
              existing.qty += normalized.qty;
              // If cloud version was unselected, keep it unselected
              if (normalized.selected === false) existing.selected = false;
            } else {
              uniqueCart.push(normalized);
            }
          });
          
          setCart(uniqueCart);
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
  const addToCart = (id: number, size?: string, customization?: string) => {
    const product = products.find(p => p.id === id);
    if (!product || product.oos) return;

    const selectedSize = size || (product.sizes[0] || 'One Size');
    const normalizedCustomization = customization || '';
    
    setCart(prev => {
      // If we were editing, remove the old version first
      let baseCart = prev;
      if (editingCartItem) {
        baseCart = prev.filter(item => !(
          item.id === editingCartItem.id && 
          item.size === editingCartItem.size && 
          (item.customization || '') === (editingCartItem.customization || '')
        ));
      }

      const existing = baseCart.find(item => 
        item.id === id && 
        item.size === selectedSize && 
        (item.customization || '') === normalizedCustomization
      );

      if (existing) {
        return baseCart.map(item => 
          (item.id === id && item.size === selectedSize && (item.customization || '') === normalizedCustomization) 
            ? { ...item, qty: item.qty + 1 } 
            : item
        );
      }
      return [...baseCart, {
        id: product.id,
        name: product.name,
        price: product.price,
        emoji: product.emoji,
        color: product.color,
        img: product.imgs[0],
        size: selectedSize,
        qty: 1,
        customization: normalizedCustomization,
        selected: true
      }];
    });
    
    if (editingCartItem) {
      showToast('✦ Order updated');
      setEditingCartItem(null);
    } else {
      showToast(`✦ ${product.name} added to cart`);
    }
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

  const updateCartQty = (id: number, size: string, delta: number, customization?: string) => {
    const normalizedCustomization = customization || '';
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id && item.size === size && (item.customization || '') === normalizedCustomization) {
          const newQty = Math.max(0, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const removeFromCart = (id: number, size: string, customization?: string) => {
    const normalizedCustomization = customization || '';
    setCart(prev => prev.filter(item => !(item.id === id && item.size === size && (item.customization || '') === normalizedCustomization)));
    showToast('Item removed from cart');
  };

  const toggleCartSelection = (id: number, size: string, customization?: string) => {
    const normalizedCustomization = customization || '';
    setCart(prev => prev.map(item => {
      if (item.id === id && item.size === size && (item.customization || '') === normalizedCustomization) {
        return { ...item, selected: !item.selected };
      }
      return item;
    }));
  };

  const moveToWishlist = (id: number, size: string, customization?: string) => {
    const item = cart.find(i => i.id === id && i.size === size && (i.customization || '') === (customization || ''));
    if (!item) return;
    
    removeFromCart(id, size, customization);
    if (!wishlist.includes(id)) {
      toggleWishlist(id);
    } else {
      showToast('✦ Moved to wishlist');
    }
  };

  const moveFromWishlistToCart = (id: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    addToCart(id, product.sizes[0] || 'One Size');
    toggleWishlist(id);
    showToast('✦ Moved to cart');
  };

  const openProduct = (id: number, editItem?: CartItem) => {
    setSelectedProductId(id);
    setEditingCartItem(editItem || null);
    navigateTo('pdp');
  };

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);

  const isAdmin = user?.email === 'adityaagarwal113@gmail.com' || user?.email === 'shiwaniag456@gmail.com';

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

      {isQuotaExceeded && currentView === 'admin' && (
        <div id="quota-exceeded-banner" className="fixed top-16 left-0 right-0 z-40 bg-[#FFF4E5] border-b border-[#FFE0B2] px-4 py-2 text-[#E65100] text-center text-xs font-bold font-sans tracking-wide shadow-sm animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-4 md:h-8">
            <span className="flex items-center gap-1.5 font-black uppercase text-[10px] tracking-widest"><span className="text-base">⚠️</span> Firestore Daily Resource Limit Reached</span>
            <span className="opacity-95 text-[11px] font-medium leading-normal">
              The daily free quota is exceeded. Live cloud changes may take time to apply or fallback until limits reset tomorrow.
            </span>
            <div className="flex gap-2 text-[10px] uppercase tracking-widest font-bold mt-1 md:mt-0">
              <a 
                href="https://console.firebase.google.com/project/the-pastel-story/firestore/databases/ai-studio-356527bc-3f4e-4a51-a1b1-2dc4c86f6aef/data?openUpgradeDialog=true" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#FFE0B2] hover:bg-[#FFCC80] px-3 py-1 rounded-full text-[#E65100] transition-colors"
                id="view-db-btn"
              >
                Inspect Database
              </a>
              <a 
                href="https://firebase.google.com/pricing#cloud-firestore" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#F5F2EB] hover:bg-[#EAE6DD] px-3 py-1 rounded-full text-[#5D554D] transition-colors"
                id="view-pricing-btn"
              >
                Pricing Info
              </a>
            </div>
          </div>
        </div>
      )}

      <main className={`${isQuotaExceeded && currentView === 'admin' ? 'pt-[115px] md:pt-24' : 'pt-16'} min-h-[calc(100vh-64px)] transition-all`}>
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
            {currentView === 'about' && <About setView={navigateTo} siteConfig={siteConfig} />}
            {currentView === 'pdp' && selectedProductId && (
              <ProductDetail 
                product={products.find(p => p.id === selectedProductId)!} 
                products={products}
                onOpenProduct={openProduct}
                wishlist={wishlist}
                siteConfig={siteConfig}
                onAddToCart={addToCart} 
                onWishlist={toggleWishlist}
                isWishlisted={wishlist.includes(selectedProductId)}
                setView={navigateTo}
                initialEditItem={editingCartItem || undefined}
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
                onEditItem={(item) => openProduct(item.id, item)}
                onToggleSelection={toggleCartSelection}
                onMoveToWishlist={moveToWishlist}
                siteConfig={siteConfig}
              />
            )}
            {currentView === 'payment' && checkoutData && (
              <Payment 
                checkoutData={checkoutData}
                onClearCart={() => {
                  const itemsToStay = cart.filter(i => !i.selected);
                  setCart(itemsToStay);
                }}
                setView={navigateTo}
              />
            )}
            {currentView === 'track' && <TrackOrder siteConfig={siteConfig} />}
            {currentView === 'wishlist' && (
              <Wishlist 
                products={products} 
                wishlist={wishlist} 
                onOpen={openProduct} 
                onWishlist={toggleWishlist} 
                onAddToCart={addToCart}
                onMoveToCart={moveFromWishlistToCart}
                siteConfig={siteConfig}
              />
            )}
            {currentView === 'help' && <Help siteConfig={siteConfig} />}
            {currentView === 'admin' && <AdminPortal setView={navigateTo} />}
            {currentView === 'orders' && (
              <Orders 
                products={products} 
                onOpenProduct={openProduct} 
                onAddToCart={addToCart}
                setView={navigateTo}
                siteConfig={siteConfig}
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
      <Analytics />
    </AuthProvider>
  );
}

