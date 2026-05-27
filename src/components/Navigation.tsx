import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Heart, Menu, LogOut, X, ChevronLeft, Package, HelpCircle, LayoutGrid, User, Settings, ChevronDown } from 'lucide-react';
import { View } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentView: View;
  setView: (view: View) => void;
  goBack: () => void;
  hasHistory: boolean;
  cartCount: number;
  wishCount: number;
  onOpenAuth: () => void;
  isAdmin: boolean;
  siteConfig: any;
}

export function Navigation({
  currentView,
  setView,
  goBack,
  hasHistory,
  cartCount,
  wishCount,
  onOpenAuth,
  isAdmin,
  siteConfig
}: NavigationProps) {

  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isShopExpanded, setIsShopExpanded] = useState(false);

  // ✅ Fix: close menu/modals when back button is pressed
  useEffect(() => {
    const handleClose = () => {
      setIsMobileMenuOpen(false);
      setIsLogoutConfirmOpen(false);
    };
    window.addEventListener('popstate', handleClose);
    return () => window.removeEventListener('popstate', handleClose);
  }, []);

  // ✅ Fix: close menu when login/logout happens
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [user]);

  const navItems = [
    { label: 'Home', view: 'home' as View, icon: <LayoutGrid className="w-4 h-4" /> },
    { label: 'Shop', view: 'shop' as View, icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Vision', view: 'about' as View, icon: <User className="w-4 h-4" /> },
    { label: 'Cart', view: 'cart' as View, icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Wishlist', view: 'wishlist' as View, icon: <Heart className="w-4 h-4" /> },
    { label: 'Orders', view: 'orders' as View, icon: <Package className="w-4 h-4" />, auth: true },
    { label: 'Track Order', view: 'track' as View, icon: <Package className="w-4 h-4" /> },
    { label: 'Help', view: 'help' as View, icon: <HelpCircle className="w-4 h-4" /> },
  ];

  // ✅ Fix: avoid animation conflict
  const handleNav = (view: View) => {
    setIsMobileMenuOpen(false);
    setTimeout(() => setView(view), 100);
  };

  const confirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    setIsMobileMenuOpen(false);
    setTimeout(() => logout(), 100);
  };

  const categories = siteConfig?.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara'];

  return (
    <nav className="fixed top-0 inset-x-0 z-[1000] glass border-b border-gold/10">
      
      {/* ===== DESKTOP / TABLET (UNCHANGED) ===== */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">

        <div className="flex items-center gap-6">
          {hasHistory && currentView !== 'home' && (
            <button 
              onClick={goBack}
              className="p-2 -ml-2 text-dark hover:text-gold transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={() => handleNav('home')}
            className="font-serif text-2xl tracking-[0.1em] text-dark group transition-all"
          >
            THE PASTEL <span className="text-gold italic font-light group-hover:opacity-70 transition-opacity">STORY</span>
          </button>
        </div>

        <ul className="hidden md:flex items-center gap-4 lg:gap-8">
          {navItems.filter(i => i.label !== 'Cart' && (!i.auth || (i.auth && user))).map((item) => (
            <li key={item.label}>
              <button
                onClick={() => handleNav(item.view)}
                className={`text-[0.6rem] lg:text-[0.65rem] uppercase tracking-[0.2em] lg:tracking-[0.4em] font-bold transition-all hover:text-gold relative group py-2 flex items-center gap-1.5 ${
                  currentView === item.view ? 'text-gold' : 'text-mid/60'
                }`}
              >
                {item.label}
                <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ${currentView === item.view ? 'scale-x-100' : ''}`} />
                {item.label === 'Wishlist' && wishCount > 0 && (
                  <span className="bg-gold text-white text-[0.5rem] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                    {wishCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden md:flex items-center gap-4">
            {user ? (
               <div className="relative group">
                  <button 
                    onClick={() => handleNav('orders')}
                    className="flex items-center gap-2 p-1.5 hover:bg-gold/5 rounded-full transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-cream border border-gold/10 flex items-center justify-center overflow-hidden">
                       {user.photoURL ? (
                         <img src={user.photoURL} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
                       ) : (
                         <User className="w-4 h-4 text-gold/40" />
                       )}
                    </div>
                  </button>
                  {/* Small Dropdown on hover */}
                  <div className="absolute top-full right-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                    <div className="bg-white luxury-shadow border border-gold/10 p-4 rounded-xl min-w-[180px]">
                       <p className="text-[0.6rem] text-mid uppercase tracking-widest font-bold mb-3 border-b border-gold/5 pb-2">Account</p>
                       <div className="space-y-1">
                          <button onClick={() => handleNav('orders')} className="w-full text-left p-2 text-xs text-dark hover:bg-gold/5 rounded-lg transition-all flex items-center gap-3">
                             <Package className="w-3.5 h-3.5 text-gold/40" /> My Orders
                          </button>
                          <button onClick={() => handleNav('wishlist')} className="w-full text-left p-2 text-xs text-dark hover:bg-gold/5 rounded-lg transition-all flex items-center gap-3">
                             <Heart className="w-3.5 h-3.5 text-gold/40" /> Wishlist
                          </button>
                          {isAdmin && (
                            <button onClick={() => handleNav('admin')} className="w-full text-left p-2 text-xs text-dark hover:bg-gold/5 rounded-lg transition-all flex items-center gap-3">
                               <Settings className="w-3.5 h-3.5 text-gold/40" /> Admin Portal
                            </button>
                          )}
                          <button onClick={() => setIsLogoutConfirmOpen(true)} className="w-full text-left p-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center gap-3 mt-2 border-t border-gold/5 pt-3">
                             <LogOut className="w-3.5 h-3.5" /> Sign Out
                          </button>
                       </div>
                    </div>
                  </div>
               </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 p-2 px-4 border border-gold/20 rounded-full text-mid hover:bg-gold hover:text-white transition-all text-[0.65rem] uppercase tracking-widest font-bold"
              >
                <User className="w-4 h-4" />
                <span>Join Us</span>
              </button>
            )}
          </div>

          {/* CART */}
          <button
            onClick={() => handleNav('cart')}
            className="flex items-center gap-2 bg-gold text-white px-3 py-2 rounded text-xs uppercase"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{cartCount}</span>
          </button>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 border rounded"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ===== MOBILE MENU (FIXED) ===== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000]"
          >

            {/* BACKDROP */}
            <motion.div
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* RIGHT DRAWER */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 35, stiffness: 350 }}
              className="fixed top-0 right-0 w-[85%] max-w-sm h-screen bg-[#fdf6ee] flex flex-col z-[2001] shadow-2xl rounded-l-3xl"
            >

              {/* HEADER */}
              <div className="h-20 px-6 flex items-center justify-between border-b border-gold/10 bg-white">
                <button
                  onClick={() => handleNav('home')}
                  className="font-serif italic text-xl text-dark"
                >
                  The Pastel Story
                </button>

                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-7 h-7 text-dark" />
                </button>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* NAV */}
                <ul className="py-6 px-6 space-y-2">
                  {navItems.filter(i => !i.auth || (i.auth && user)).map((item) => (
                    <li key={item.label}>
                      {item.label === 'Shop' ? (
                        <div className="border-b border-gold/5 overflow-hidden">
                           <button
                            onClick={() => setIsShopExpanded(!isShopExpanded)}
                            className={`w-full flex items-center justify-between py-4 text-base font-serif italic tracking-wide group ${currentView === item.view ? 'text-gold' : 'text-dark'}`}
                          >
                            <div className="flex items-center gap-3">
                               <span className={currentView === item.view ? 'text-gold' : 'text-mid/50'}>
                                 {item.icon}
                               </span>
                               {item.label}
                            </div>
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isShopExpanded ? 'rotate-180 text-gold' : 'text-mid/30'}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isShopExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pl-12 pb-6 space-y-3"
                              >
                                <button
                                  onClick={() => {
                                    handleNav('shop');
                                    sessionStorage.setItem('pastel_filter_cat', 'all');
                                    // Trigger a custom event to update Shop if it's already open
                                    window.dispatchEvent(new CustomEvent('pastel_category_change', { detail: 'all' }));
                                  }}
                                  className="w-full text-left text-[0.7rem] uppercase tracking-widest font-bold text-mid hover:text-gold transition-colors"
                                >
                                  View All Collection
                                </button>
                                {categories.map((cat: string) => (
                                  <button
                                    key={cat}
                                    onClick={() => {
                                      handleNav('shop');
                                      sessionStorage.setItem('pastel_filter_cat', cat);
                                      window.dispatchEvent(new CustomEvent('pastel_category_change', { detail: cat }));
                                    }}
                                    className="w-full text-left text-[0.7rem] uppercase tracking-widest font-bold text-mid/60 hover:text-gold transition-colors capitalize"
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleNav(item.view)}
                          className={`w-full flex items-center justify-between py-4 border-b border-gold/5 text-base font-serif italic tracking-wide group ${currentView === item.view ? 'text-gold' : 'text-dark'}`}
                        >
                          <div className="flex items-center gap-6">
                             <span className={currentView === item.view ? 'text-gold' : 'text-mid/50'}>
                               {item.icon}
                             </span>
                             {item.label}
                          </div>
                          {item.label === 'Cart' && cartCount > 0 && (
                            <span className="bg-gold text-white text-[0.6rem] px-2 py-0.5 rounded-full font-bold">
                              {cartCount}
                            </span>
                          )}
                          {item.label === 'Wishlist' && wishCount > 0 && (
                            <span className="bg-[#e29578] text-white text-[0.6rem] px-2 py-0.5 rounded-full font-bold">
                              {wishCount}
                            </span>
                          )}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {/* ACCOUNT */}
                <div className="px-6 py-10">
                  {user ? (
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-5 p-5 bg-white rounded-3xl border border-gold/10 shadow-sm">
                        <div className="w-14 h-14 rounded-full bg-gold text-white flex items-center justify-center text-2xl font-serif italic shadow-lg shadow-gold/20">
                          {user.displayName?.[0] || user.email?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-dark truncate">
                            {user.displayName || user.email?.split('@')[0]}
                          </p>
                          <p className="text-[0.6rem] text-gold uppercase tracking-[0.2em] font-bold mt-0.5">Premium Member</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setIsLogoutConfirmOpen(true)}
                          className="flex items-center justify-center gap-3 py-4 text-[0.6rem] uppercase tracking-[0.2em] font-bold text-red-400 bg-red-50/50 rounded-2xl border border-red-100 active:scale-95 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                        
                        {isAdmin && (
                          <button
                            onClick={() => handleNav('admin')}
                            className="flex items-center justify-center gap-3 py-4 text-[0.6rem] uppercase tracking-[0.2em] font-bold text-dark bg-white rounded-2xl border border-gold/20 shadow-sm active:scale-95 transition-all"
                          >
                            <Settings className="w-4 h-4 text-gold" />
                            Admin
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full py-5 bg-dark text-white rounded-2xl text-xs uppercase tracking-[0.3em] font-bold shadow-2xl shadow-dark/20 hover:bg-gold transition-all flex items-center justify-center gap-4"
                    >
                      <User className="w-5 h-5" />
                      Sign In / Join Us
                    </button>
                  )}
                </div>

                {/* FOOTER */}
                <div className="p-10 text-center border-t border-gold/5 bg-white/30">
                  <p className="text-[0.7rem] text-dark font-bold tracking-[0.4em] uppercase mb-2">The Pastel Story</p>
                  <p className="text-[0.6rem] text-mid italic opacity-70">Boutique Collective • curated with love by shiwani</p>
                  <div className="flex justify-center gap-5 mt-8">
                     <div className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-pulse"></div>
                     <div className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-pulse delay-75"></div>
                     <div className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== LOGOUT CONFIRMATION MODAL ===== */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="font-serif text-2xl text-dark mb-2 italic">Sign Out?</h3>
              <p className="text-mid text-sm leading-relaxed mb-8 opacity-70">
                Are you sure you want to exit your session? Your wishlist and cart will be saved for your next visit.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="py-4 bg-cream text-dark rounded-xl font-bold text-[0.6rem] uppercase tracking-widest hover:bg-gold/10 transition-colors"
                >
                  Stay Here
                </button>
                <button
                  onClick={confirmLogout}
                  className="py-4 bg-red-500 text-white rounded-xl font-bold text-[0.6rem] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </nav>
  );
}