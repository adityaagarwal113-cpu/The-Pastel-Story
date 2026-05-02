import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Heart, Menu, LogOut, X, ChevronLeft, Package, HelpCircle, LayoutGrid, User, Settings } from 'lucide-react';
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

  const navItems = [
    { label: 'Home', view: 'home' as View, icon: <LayoutGrid className="w-4 h-4" /> },
    { label: 'Shop', view: 'shop' as View, icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Cart', view: 'cart' as View, icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Wishlist', view: 'wishlist' as View, icon: <Heart className="w-4 h-4" /> },
    { label: 'Track Order', view: 'track' as View, icon: <Package className="w-4 h-4" /> },
    { label: 'Help', view: 'help' as View, icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const handleNav = (view: View) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  const categories = siteConfig?.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara'];

  return (
    <nav className="fixed top-0 inset-x-0 z-[1000] bg-[#fdf6ee]/90 backdrop-blur-xl border-b border-gold/10">

      {/* TOP BAR */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        <div className="flex items-center gap-4">
          {hasHistory && currentView !== 'home' && (
            <button onClick={goBack} className="p-2 -ml-2 text-dark hover:text-gold">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={() => handleNav('home')}
            className="font-serif text-xl tracking-widest text-dark"
          >
            The Pastel <span className="text-gold italic">Story</span>
          </button>
        </div>

        <ul className="hidden md:flex items-center gap-8">
          {navItems.filter(i => i.label !== 'Cart').map((item) => (
            <li key={item.label}>
              <button
                onClick={() => handleNav(item.view)}
                className={`text-[0.7rem] uppercase tracking-[0.2em] font-medium transition-colors hover:text-gold flex items-center gap-1 ${
                  currentView === item.view ? 'text-gold' : 'text-mid'
                }`}
              >
                {item.label}
                {item.label === 'Wishlist' && wishCount > 0 && (
                  <span className="bg-[#e29578] text-white text-[0.55rem] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 mr-2">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[0.6rem] text-mid uppercase tracking-widest font-bold">Welcome</span>
                  <span className="text-[0.65rem] text-dark font-medium">{user.displayName?.split(' ')[0]}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-mid hover:text-gold transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-mid hover:text-gold transition-colors text-[0.7rem] uppercase tracking-widest font-bold"
              >
                Sign In
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

          {/* MENU BUTTON */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 border rounded"
          >
            <Menu className="w-5 h-5" />
          </button>

        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] overflow-hidden"
          >
            {/* BACKDROP */}
            <div 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
            />

            {/* ✅ FULL SCREEN MOBILE MENU */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 35, stiffness: 350, mass: 0.8 }}
              className="absolute inset-y-0 right-0 w-full bg-[#fdf6ee] flex flex-col z-[2001] shadow-2xl"
            >

              {/* HEADER */}
              <div className="h-20 px-6 flex items-center justify-between border-b border-gold/10 bg-white">
                <button
                  onClick={() => handleNav('home')}
                  className="font-serif italic text-2xl text-dark tracking-tight"
                >
                  The Pastel <span className="text-gold">Story</span>
                </button>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 hover:bg-gold/5 rounded-full transition-colors"
                >
                  <X className="w-8 h-8 text-dark" />
                </button>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* NAV ITEMS */}
                <ul className="py-6 px-6 space-y-2">
                  {navItems.map((item) => (
                    <li key={item.label}>
                      <button
                        onClick={() => handleNav(item.view)}
                        className={`w-full flex items-center justify-between py-5 border-b border-gold/5 text-xl font-serif italic tracking-wide group ${
                          currentView === item.view ? 'text-gold' : 'text-dark'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <span className={`transition-transform group-active:scale-110 ${currentView === item.view ? 'text-gold' : 'text-mid/50'}`}>
                            {item.icon}
                          </span>
                          {item.label}
                        </div>
                        {item.label === 'Cart' && cartCount > 0 && (
                          <span className="bg-gold text-white text-xs px-2.5 py-1 rounded-full font-bold">
                            {cartCount}
                          </span>
                        )}
                        {item.label === 'Wishlist' && wishCount > 0 && (
                          <span className="bg-[#e29578] text-white text-xs px-2.5 py-1 rounded-full font-bold">
                            {wishCount}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* COLLECTIONS */}
                <div className="py-8 px-6 bg-white/50 backdrop-blur-sm border-y border-gold/5">
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] font-bold text-mid mb-6 flex items-center gap-3">
                    <span className="h-[1px] flex-1 bg-gold/10"></span>
                    Curations
                    <span className="h-[1px] flex-1 bg-gold/10"></span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat: string) => (
                      <button
                        key={cat}
                        onClick={() => handleNav('shop')}
                        className="bg-white border border-gold/10 p-5 text-left capitalize hover:border-gold/30 transition-all rounded-2xl text-sm font-medium text-dark shadow-sm active:scale-95"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACCOUNT */}
                <div className="py-10 px-6">
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
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center justify-center gap-3 py-4 text-[0.65rem] uppercase tracking-[0.2em] font-bold text-red-400 bg-red-50/50 rounded-2xl border border-red-100 active:scale-95 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                        
                        {isAdmin && (
                          <button
                            onClick={() => handleNav('admin')}
                            className="flex items-center justify-center gap-3 py-4 text-[0.65rem] uppercase tracking-[0.2em] font-bold text-dark bg-white rounded-2xl border border-gold/20 shadow-sm active:scale-95 transition-all"
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
                        onOpenAuth();
                        setIsMobileMenuOpen(false);
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

    </nav>
  );
}