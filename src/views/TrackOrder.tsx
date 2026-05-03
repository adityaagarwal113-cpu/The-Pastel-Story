import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Footer } from '../components/Footer';

export function TrackOrder({ siteConfig }: { siteConfig: any }) {
  const [orderInput, setOrderInput] = useState('');
  const [status, setStatus] = useState<'none' | 'loading' | 'found' | 'error'>('none');
  const [orderData, setOrderData] = useState<any>(null);

  const getSteps = (currentStatus: string) => {
    const statuses = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    
    return [
      { label: 'Order Placed', icon: <Package className="w-5 h-5" />, completed: currentIndex >= 0 },
      { label: 'Processing', icon: currentIndex === 1 ? <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" /> : <Package className="w-5 h-5" />, completed: currentIndex >= 1 },
      { label: 'Shipped', icon: <Truck className="w-5 h-5" />, completed: currentIndex >= 2 },
      { label: 'Delivered', icon: <CheckCircle2 className="w-5 h-5" />, completed: currentIndex >= 3 },
    ];
  };

  const handleTrack = async () => {
    if (!orderInput) return;
    setStatus('loading');
    
    try {
      const q = query(collection(db, 'orders'), where('orderId', '==', orderInput.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setOrderData(querySnapshot.docs[0].data());
        setStatus('found');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setStatus('error');
    }
  };

  return (
    <div className="bg-cream/30 min-h-screen">
      <header className="pt-20 pb-12 px-4 text-center">
        <h1 className="font-serif text-4xl text-dark mb-4 italic">Track Your Order</h1>
        <p className="text-light text-sm tracking-widest max-w-sm mx-auto uppercase">Enter your Order ID to see live updates</p>
      </header>

      <div className="max-w-xl mx-auto px-4 pb-24">
        <div className="flex gap-4 mb-12">
          <input 
            type="text" 
            placeholder="e.g. TPS-123456"
            className="flex-1 bg-white border border-gold/10 rounded-xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-gold outline-none shadow-sm shadow-gold/5"
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
          />
          <button 
            onClick={handleTrack}
            className="bg-gold text-white px-8 py-4 rounded-xl font-bold text-xs tracking-widest uppercase shadow-lg shadow-gold/20 hover:scale-105 active:scale-95 transition-all"
          >
            Track
          </button>
        </div>

        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
              <p className="text-sm text-mid italic font-serif">Hunting for your package...</p>
            </motion.div>
          )}

          {status === 'found' && orderData && (
             <motion.div 
              key="found"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white p-8 rounded-2xl shadow-xl shadow-gold/5 border border-gold/5"
             >
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-gold/10">
                   <div>
                     <p className="text-[0.6rem] uppercase tracking-widest text-gold font-bold mb-1">Status Found</p>
                     <h3 className="font-serif text-xl text-dark italic">{orderData.orderId}</h3>
                   </div>
                   <div className="text-right">
                     {orderData.trackingId ? (
                       <div className="flex flex-col items-end">
                          <p className="text-[0.6rem] uppercase tracking-widest text-gold font-bold mb-1">Tracking ID</p>
                          <p className="text-sm font-bold text-dark font-mono">{orderData.trackingId}</p>
                          {orderData.trackingLink && (
                            <a 
                              href={orderData.trackingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[0.55rem] text-gold hover:underline mt-1 font-bold uppercase tracking-widest"
                            >
                              Click to Track Parcel
                            </a>
                          )}
                       </div>
                     ) : (
                       <>
                         <p className="text-[0.6rem] uppercase tracking-widest text-light mb-1">Est. Delivery</p>
                         <p className="text-sm font-bold text-dark">5-7 Business Days</p>
                       </>
                     )}
                   </div>
                </div>

                <div className="space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-gold/10">
                   {getSteps(orderData.status).map((step, i) => (
                     <div key={i} className={`flex items-center gap-6 relative z-10 transition-opacity ${step.completed ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${step.completed ? 'bg-gold text-white shadow-gold/20' : 'bg-cream text-mid'}`}>
                           {step.icon}
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-widest font-bold ${step.completed ? 'text-dark' : 'text-mid'}`}>{step.label}</p>
                          {step.completed && (
                            <p className="text-[0.6rem] text-light mt-1">
                              {orderData.status === step.label ? 'Current Stage' : 'Completed'}
                            </p>
                          )}
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
          )}

          {status === 'error' && (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-12 p-8 bg-red-50 rounded-2xl border border-red-100"
            >
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="font-serif text-xl text-red-900 mb-2 italic">Order not found</h3>
              <p className="text-red-700/60 text-sm">Please check the ID and try again, or reach out to us on WhatsApp if the problem persists.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
