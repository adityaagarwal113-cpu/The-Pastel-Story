import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronLeft, Trash2, Plus, Minus, CreditCard, Gift, Truck } from 'lucide-react';
import { CartItem, View } from '../types';
import { Footer } from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

interface CartProps {
  cart: CartItem[];
  onUpdateQty: (id: number, size: string, delta: number, customization?: string) => void;
  onRemove: (id: number, size: string, customization?: string) => void;
  onClear: () => void;
  setView: (view: View) => void;
  onOpenAuth: () => void;
  setCheckoutData: (data: any) => void;
  onEditItem: (item: CartItem) => void;
  onToggleSelection: (id: number, size: string, customization?: string) => void;
  onMoveToWishlist: (id: number, size: string, customization?: string) => void;
  siteConfig: any;
}

export function Cart({ 
  cart, 
  onUpdateQty, 
  onRemove, 
  onClear, 
  setView, 
  onOpenAuth, 
  setCheckoutData, 
  onEditItem,
  onToggleSelection,
  onMoveToWishlist,
  siteConfig
}: CartProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    pincode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItems = useMemo(() => cart.filter(i => i.selected), [cart]);
  const subtotal = useMemo(() => selectedItems.reduce((acc, item) => acc + item.price * item.qty, 0), [selectedItems]);
  const shipping = subtotal > 0 && subtotal >= 999 ? 0 : (subtotal > 0 ? 99 : 0);
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (selectedItems.length === 0) {
      alert('Please select at least one item to proceed to checkout');
      return;
    }

    if (!formData.name || !formData.phone || !formData.address || !formData.pincode) {
       alert('Please fill in your delivery details (Name, Phone, Address, and Pincode)');
       return;
    }

    const itemsString = JSON.stringify(selectedItems);
    
    setCheckoutData({
      ...formData,
      total,
      items: itemsString
    });
    
    setView('payment');
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
            <div className="w-24 h-24 bg-cream rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-10 h-10 text-gold/40" />
            </div>
            <h2 className="font-serif text-4xl text-dark mb-4 italic">Your cart is empty</h2>
            <p className="text-light text-sm mb-10 max-w-xs mx-auto">Looks like you haven't added anything to your cart yet!</p>
            <button 
              onClick={() => setView('shop')}
              className="bg-dark text-white px-10 py-4 rounded-xl font-bold text-xs tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-dark/20"
            >
              Start Shopping
            </button>
        </div>
        <Footer siteConfig={siteConfig} />
      </div>
    );
  }

  return (
    <div className="bg-[#faf8f6] min-h-screen pt-24">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 border-b border-gold/10 pb-12">
          <div>
            <span className="text-micro text-gold mb-2 block">Order Items</span>
            <h1 className="font-serif text-5xl text-dark italic">Shopping Cart</h1>
          </div>
          <button 
            onClick={() => setView('shop')}
            className="text-micro text-dark/40 hover:text-gold transition-colors flex items-center gap-2 italic lowercase"
          >
            <Plus className="w-3 h-3" /> back to shop
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
          {/* Items List - Minimal Editorial Style */}
          <div className="lg:col-span-7 space-y-12">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={`${item.id}-${item.size}-${item.customization || ''}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr] gap-8 group pb-12 border-b border-gold/5"
                >
                  <div className="absolute -left-4 top-0 h-full flex flex-col justify-start pt-2">
                    <button 
                      onClick={() => onToggleSelection(item.id, item.size, item.customization)}
                      className={`w-4 h-4 transition-all duration-500 rounded-sm overflow-hidden flex items-center justify-center ${
                        item.selected ? 'bg-gold border border-gold' : 'border border-gold/20 hover:border-gold/50'
                      }`}
                    >
                      {item.selected && <span className="text-[8px] text-white font-bold">✓</span>}
                    </button>
                  </div>

                  <div 
                    onClick={() => onEditItem(item)}
                    className="aspect-[3/4] overflow-hidden bg-[#eeebe7] cursor-pointer"
                  >
                    <img src={item.img} className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-1000" alt={item.name} />
                  </div>
                  
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="font-serif italic text-2xl text-dark group-hover:text-gold transition-colors duration-500 cursor-pointer" onClick={() => onEditItem(item)}>
                            {item.name}
                          </h3>
                          <p className="text-micro text-mid/40 mt-1">Silhouette: {item.size}</p>
                        </div>
                        <p className="font-medium text-lg tracking-tight">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                      </div>

                      {item.customization && (
                        <div className="bg-white/40 p-4 mb-4 border-l border-gold/30">
                          <p className="text-micro text-gold mb-2 italic lowercase font-bold">bespoke details:</p>
                          <p className="text-xs text-mid leading-relaxed italic line-clamp-2">{item.customization}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-6">
                          <div className="flex items-center border border-gold/10 px-2 py-1 rounded-sm">
                            <button 
                              onClick={() => onUpdateQty(item.id, item.size, -1, item.customization)}
                              className="p-1 hover:text-gold transition-colors text-mid/40"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                            <button 
                              onClick={() => onUpdateQty(item.id, item.size, 1, item.customization)}
                              className="p-1 hover:text-gold transition-colors text-mid/40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => onMoveToWishlist(item.id, item.size, item.customization)}
                            className="text-micro text-mid/40 hover:text-gold transition-colors italic lowercase border-b border-transparent hover:border-gold/20"
                          >
                            move to wishlist
                          </button>
                       </div>

                       <button 
                        onClick={() => onRemove(item.id, item.size, item.customization)}
                        className="text-red-300 hover:text-red-500 transition-colors p-2"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <button
              onClick={() => setView('shop')}
              className="w-full py-6 border border-dashed border-gold/20 text-micro text-mid/40 hover:border-gold/40 hover:text-gold transition-all italic lowercase flex items-center justify-center gap-3"
            >
              <Plus className="w-3 h-3" /> find more beauty
            </button>
          </div>

          {/* Checkout UI - Floating Modern Box */}
          <div className="lg:col-span-5 space-y-8 sticky top-48">
            <div className="bg-white p-10 luxury-shadow space-y-10">
              <h2 className="text-micro text-gold mb-8">Cart Summary</h2>
              
              <div className="space-y-6">
                <div className="flex justify-between text-xs tracking-widest uppercase text-mid/60">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs tracking-widest uppercase text-mid/60">
                  <span>Shipping</span>
                  <span className="text-gold font-bold">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                
                <div className="pt-8 border-t border-gold/5 flex justify-between items-baseline">
                  <span className="font-serif text-3xl font-light italic">Total</span>
                  <span className="font-serif text-4xl font-bold text-dark">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-4 pt-10 border-t border-gold/5">
                 <div className="space-y-6">
                   <div className="space-y-3">
                     <label className="text-micro text-gold">Full Name</label>
                     <input 
                      type="text" 
                      placeholder="Enter your name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-transparent border-b border-gold/10 py-2 text-sm outline-none focus:border-gold transition-all placeholder:text-mid/20 italic font-serif"
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                       <label className="text-micro text-gold">Phone Number</label>
                       <input 
                        type="tel" 
                        placeholder="10-digit mobile number" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-transparent border-b border-gold/10 py-2 text-sm outline-none focus:border-gold transition-all placeholder:text-mid/20 italic font-serif"
                       />
                     </div>
                     <div className="space-y-3">
                       <label className="text-micro text-gold">Pincode</label>
                       <input 
                        type="text" 
                        placeholder="6-digit area code" 
                        value={formData.pincode}
                        onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                        className="w-full bg-transparent border-b border-gold/10 py-2 text-sm outline-none focus:border-gold transition-all placeholder:text-mid/20 italic font-serif"
                       />
                     </div>
                   </div>
                   <div className="space-y-3">
                     <label className="text-micro text-gold">Shipping Address</label>
                     <textarea 
                      placeholder="H.No, Street, Area, City, State" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={2}
                      className="w-full bg-transparent border-b border-gold/10 py-2 text-sm outline-none focus:border-gold transition-all placeholder:text-mid/20 italic font-serif resize-none"
                     />
                   </div>
                 </div>

                 <button 
                  disabled={isSubmitting}
                  onClick={handleCheckout}
                  className="w-full py-6 bg-dark text-white font-bold text-micro tracking-[0.4em] uppercase hover:bg-gold hover:luxury-shadow transition-all flex items-center justify-center gap-6 mt-10 disabled:opacity-50"
                 >
                   {isSubmitting ? 'Processing...' : (
                      <>
                        <CreditCard className="w-4 h-4" /> {user ? 'Proceed to Payment' : 'Sign In to Checkout'}
                      </>
                   )}
                 </button>
              </div>

              <div className="pt-8 flex justify-center gap-10 opacity-30">
                 <div className="flex items-center gap-3 text-micro lowercase italic">
                    <Truck className="w-3 h-3" /> secure shipping
                 </div>
                 <div className="flex items-center gap-3 text-micro lowercase italic">
                    <Gift className="w-3 h-3" /> gift archive
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer setView={setView} siteConfig={siteConfig} />
    </div>
  );
}
