import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronLeft, Trash2, Plus, Minus, CreditCard, Gift, Truck, CheckCircle2 } from 'lucide-react';
import { CartItem, View } from '../types';
import { Footer } from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface CartProps {
  cart: CartItem[];
  onUpdateQty: (id: number, size: string, delta: number) => void;
  onRemove: (id: number, size: string) => void;
  onClear: () => void;
  setView: (view: View) => void;
  onOpenAuth: () => void;
}

export function Cart({ cart, onUpdateQty, onRemove, onClear, setView, onOpenAuth }: CartProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    pincode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.qty, 0), [cart]);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!formData.name || !formData.phone || !formData.address || !formData.pincode) {
       alert('Please fill in your delivery details (Name, Phone, Address, and Pincode)');
       return;
    }

    setIsSubmitting(true);
    try {
      const orderId = `TPS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const itemsString = cart.map(i => `${i.name} (${i.size}) x${i.qty}`).join(', ');

      const orderRef = doc(collection(db, 'orders'));
      const path = `orders/${orderRef.id}`;
      
      await setDoc(orderRef, {
        orderId,
        userId: user.uid,
        userName: formData.name,
        userPhone: formData.phone,
        address: formData.address,
        pincode: formData.pincode,
        items: itemsString,
        total: total,
        status: 'Order Placed',
        timestamp: serverTimestamp(),
      });

      setOrderSuccess(orderId);
      onClear();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full px-4 text-center"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="font-serif text-4xl text-dark mb-4 italic">Order Placed!</h2>
          <p className="text-light text-sm mb-6 uppercase tracking-widest">Order ID: <span className="text-gold font-bold">{orderSuccess}</span></p>
          <p className="text-mid text-sm mb-10 leading-relaxed opacity-70">
            Thank you for choosing The Pastel Story. Your pieces are being curated with love.
          </p>
          <button 
            onClick={() => setView('shop')}
            className="w-full bg-dark text-white px-10 py-4 rounded-xl font-bold text-xs tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-dark/20"
          >
            Continue Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
            <div className="w-24 h-24 bg-cream rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-10 h-10 text-gold/40" />
            </div>
            <h2 className="font-serif text-4xl text-dark mb-4 italic">Your bag is empty</h2>
            <p className="text-light text-sm mb-10 max-w-xs mx-auto">Looks like you haven't added your softest chapter yet!</p>
            <button 
              onClick={() => setView('shop')}
              className="bg-dark text-white px-10 py-4 rounded-xl font-bold text-xs tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-dark/20"
            >
              Start Shopping
            </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-cream/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-12">
          <button onClick={() => setView('shop')} className="p-2 hover:bg-white rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-dark" />
          </button>
          <h1 className="font-serif text-4xl text-dark italic">Shopping Bag</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
          {/* Items List */}
          <div className="space-y-4">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={`${item.id}-${item.size}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-4 rounded-xl border border-gold/5 shadow-sm flex gap-6"
                >
                  <div className="w-24 aspect-[3/4] rounded-lg overflow-hidden shrink-0 bg-blush/20">
                    <img src={item.img} className="w-full h-full object-cover object-top" alt={item.name} />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-dark">{item.name}</h3>
                        <p className="font-semibold text-dark">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                      </div>
                      <p className="text-[0.6rem] uppercase tracking-widest text-gold font-bold mb-4">Size: {item.size}</p>
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="flex items-center border border-gold/10 rounded-lg bg-cream/50">
                          <button 
                            onClick={() => onUpdateQty(item.id, item.size, -1)}
                            className="p-2 hover:text-gold transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                          <button 
                            onClick={() => onUpdateQty(item.id, item.size, 1)}
                            className="p-2 hover:text-gold transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                       </div>
                       <button 
                        onClick={() => onRemove(item.id, item.size)}
                        className="text-light hover:text-red-500 transition-colors p-2"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Checkout UI */}
          <div className="space-y-6">
            <div className="bg-dark text-white p-8 rounded-2xl shadow-2xl space-y-6 sticky top-32">
              <h2 className="text-[0.7rem] uppercase tracking-[0.4em] font-bold text-gold border-b border-white/10 pb-4 mb-6">Order Summary</h2>
              
              <div className="space-y-4 pt-2">
                <div className="flex justify-between text-sm opacity-70">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm opacity-70">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                {shipping > 0 && (
                  <div className="p-3 bg-white/5 rounded border border-white/10 text-[0.65rem] italic leading-relaxed">
                    Add ₹{(999 - subtotal).toLocaleString('en-IN')} more to get FREE shipping!
                  </div>
                )}
                
                <div className="pt-6 border-t border-white/10 flex justify-between items-baseline">
                  <span className="font-serif text-2xl font-light">Total</span>
                  <span className="font-serif text-3xl font-bold text-gold">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-8 space-y-4">
                 <div className="space-y-4 text-white">
                   <div className="space-y-1">
                     <label className="text-[0.55rem] uppercase tracking-widest text-gold font-bold">Delivery Contact</label>
                     <input 
                      type="text" 
                      placeholder="Full Name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-gold outline-none transition-all placeholder:text-white/20"
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <input 
                      type="tel" 
                      placeholder="Phone" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-gold outline-none transition-all placeholder:text-white/20"
                     />
                     <input 
                      type="text" 
                      placeholder="Pincode" 
                      value={formData.pincode}
                      onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-gold outline-none transition-all placeholder:text-white/20"
                     />
                   </div>
                   <textarea 
                    placeholder="Full Delivery Address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-gold outline-none transition-all placeholder:text-white/20 resize-none"
                   />
                 </div>

                 <button 
                  disabled={isSubmitting}
                  onClick={handleCheckout}
                  className="w-full py-5 bg-gold text-white rounded-xl font-bold text-xs tracking-[0.2em] uppercase shadow-2xl shadow-gold/20 hoverScale active:scale-95 transition-all flex items-center justify-center gap-4 mt-6 disabled:opacity-50 disabled:scale-100"
                 >
                   {isSubmitting ? 'Syncing Story...' : (
                      <>
                        <CreditCard className="w-5 h-5" /> {user ? 'Place Order' : 'Sign In to Order'}
                      </>
                   )}
                 </button>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-4 border-t border-white/10 opacity-30">
                 <div className="flex items-center gap-2 text-[0.55rem] uppercase tracking-widest">
                    <Truck className="w-3 h-3" /> Secure Delivery
                 </div>
                 <div className="flex items-center gap-2 text-[0.55rem] uppercase tracking-widest">
                    <Gift className="w-3 h-3" /> Gift Wrapped
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
