import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronRight, 
  RefreshCw, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Phone,
  Copy,
  Check
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Order, CartItem, Product, View } from '../types';
import { Footer } from '../components/Footer';

interface OrdersProps {
  products: Product[];
  onOpenProduct: (id: number) => void;
  onAddToCart: (id: number, size?: string, customization?: string) => void;
  setView: (view: View) => void;
  siteConfig: any;
}

export function Orders({ products, onOpenProduct, onAddToCart, setView, siteConfig }: OrdersProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
        });
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Order Placed': return <Package className="w-5 h-5" />;
      case 'Processing': return <Clock className="w-5 h-5" />;
      case 'Shipped': return <Truck className="w-5 h-5" />;
      case 'Delivered': return <CheckCircle2 className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Order Placed': return 'text-blue-500 bg-blue-50';
      case 'Processing': return 'text-gold bg-gold/10';
      case 'Shipped': return 'text-purple-500 bg-purple-50';
      case 'Delivered': return 'text-green-500 bg-green-50';
      default: return 'text-mid bg-cream';
    }
  };

  const parseItems = (itemsStr: string): CartItem[] => {
    try {
      const parsed = JSON.parse(itemsStr);
      const items = Array.isArray(parsed) ? parsed : [];
      
      return items.map((item: CartItem) => {
        const liveProd = products.find(p => p.id === item.id || p.name === item.name);
        return {
          ...item,
          id: liveProd?.id || item.id,
          img: liveProd?.imgs[0] || item.img || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500',
          price: liveProd?.price || item.price
        };
      });
    } catch (e) {
      if (!itemsStr) return [];
      return itemsStr.split(', ').map(item => {
        const match = item.match(/(.+) \((.+)\) x(\d+)/);
        if (match) {
          const liveProd = products.find(p => p.name === match[1]);
          return {
            id: liveProd?.id || 0,
            name: match[1],
            size: match[2],
            qty: parseInt(match[3]),
            price: liveProd?.price || 0,
            img: liveProd?.imgs[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500'
          } as CartItem;
        }
        return { name: item, size: '?', qty: 1, price: 0, img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500' } as CartItem;
      });
    }
  };

  const recommendations = products
    .filter(p => !p.oos)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-16 h-16 text-cream mb-6" />
        <h2 className="font-serif text-3xl text-dark mb-4 italic">Your Stories Await</h2>
        <p className="text-mid text-sm mb-8 opacity-60">Sign in to view your order history and tracking details.</p>
        <button 
          onClick={() => setView('home')}
          className="bg-dark text-white px-10 py-4 rounded-xl font-bold text-[0.6rem] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          Sign In / Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-cream/30 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="font-serif text-5xl text-dark mb-4 italic">Your Orders</h1>
            <p className="text-mid text-sm tracking-[0.2em] uppercase opacity-60">The history of your Pastel Story</p>
          </div>
          <div className="flex items-center gap-3 text-dark/40 text-[0.6rem] uppercase tracking-widest font-bold">
            <ShoppingBag className="w-4 h-4" />
            <span>{orders.length} Orders Placed</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="font-serif italic text-dark/40">Recollecting your journey...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gold/5">
            <ShoppingBag className="w-12 h-12 text-cream mx-auto mb-6" />
            <h3 className="font-serif text-2xl text-dark mb-4 italic">No Orders Yet</h3>
            <p className="text-mid text-sm mb-10 opacity-60">You haven't started your story with us yet.</p>
            <button 
              onClick={() => setView('shop')}
              className="bg-dark text-white px-10 py-5 rounded-xl font-bold text-[0.65rem] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-dark/10"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => {
              const orderItems = parseItems(order.items);
              return (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gold/5 group cursor-pointer hover:shadow-xl hover:shadow-gold/5 transition-all duration-500"
                >
                  <div className="p-8 border-b border-cream flex flex-wrap items-center justify-between gap-6">
                    <div className="space-y-1">
                      <p className="text-[0.6rem] uppercase tracking-[0.3em] font-bold text-gold">Purchase Date</p>
                      <p className="font-serif italic text-dark text-lg">
                        {order.timestamp?.toDate 
                          ? order.timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) 
                          : (order.timestamp instanceof Date 
                            ? order.timestamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) 
                            : 'Recent Order')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[0.6rem] uppercase tracking-[0.3em] font-bold text-mid opacity-40">Value</p>
                        <p className="text-xl font-bold text-dark">₹{order.total.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                      {orderItems.map((item, idx) => (
                        <div key={idx} className="w-16 h-20 md:w-20 md:h-28 bg-cream rounded-xl overflow-hidden flex-shrink-0 border border-gold/5 shadow-sm">
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                       <p className="text-[0.6rem] text-mid italic">
                        {orderItems.length} {orderItems.length === 1 ? 'item' : 'items'} in this order
                      </p>
                      <span className="text-[0.6rem] uppercase tracking-[0.2em] font-bold text-gold flex items-center gap-1 group-hover:gap-3 transition-all">
                        View Details & Order Information <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-24 pb-12">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-serif text-4xl text-dark italic">Curated for You</h2>
            <button 
              onClick={() => setView('shop')}
              className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-gold border-b border-gold flex items-center gap-2 pb-1"
            >
              See New Arrivals <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((product) => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProduct(product.id);
                }}
              >
                <div className="aspect-[4/5] bg-white rounded-3xl overflow-hidden mb-4 relative shadow-sm border border-gold/5">
                  <img src={product.imgs[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-dark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white text-dark px-6 py-3 rounded-full font-bold text-[0.6rem] uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      View Piece
                    </button>
                  </div>
                </div>
                <h3 className="font-serif text-lg text-dark mb-1 italic truncate">{product.name}</h3>
                <p className="text-gold font-bold text-[0.7rem] uppercase tracking-widest">₹{product.price.toLocaleString('en-IN')}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== ORDER DETAILS MODAL ===== */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-dark/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-[3rem] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-8 border-b border-cream">
                <div>
                  <h3 className="font-serif text-2xl text-dark italic">Order Information</h3>
                  <p className="text-[0.6rem] uppercase tracking-widest font-bold text-gold">#{selectedOrder.orderId}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-12 h-12 bg-cream rounded-full flex items-center justify-center hover:bg-gold hover:text-white transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 scrollbar-hide">
                {/* Tracking ID Highlight */}
                <div className="bg-dark text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-dark/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-gold/20 transition-colors" />
                  <div className="relative z-10">
                    <p className="text-[0.6rem] uppercase tracking-[0.4em] font-bold text-gold mb-2">Electronic Tracking Number</p>
                    <h4 className="font-mono text-3xl md:text-4xl font-bold tracking-widest">{selectedOrder.orderId}</h4>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(selectedOrder.orderId)}
                    className="relative z-10 flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white text-white hover:text-dark rounded-2xl transition-all font-bold text-[0.6rem] uppercase tracking-widest group/copy"
                  >
                    {copiedId === selectedOrder.orderId ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 group-hover/copy:scale-110 transition-transform" />
                        <span>Copy ID to Track</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-cream/40 p-6 rounded-[2rem] flex items-center gap-4 border border-gold/5">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                    </div>
                    <div>
                      <p className="text-[0.5rem] uppercase tracking-widest font-bold opacity-40">Status</p>
                      <p className="text-xs font-bold text-dark">{selectedOrder.status}</p>
                    </div>
                  </div>

                  <div className="bg-cream/40 p-6 rounded-[2rem] flex items-center gap-4 border border-gold/5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-gold/10 text-gold">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[0.5rem] uppercase tracking-widest font-bold opacity-40">Placed On</p>
                      <p className="text-xs font-bold text-dark">
                        {selectedOrder.timestamp?.toDate 
                          ? selectedOrder.timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) 
                          : (selectedOrder.timestamp instanceof Date 
                            ? selectedOrder.timestamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) 
                            : 'Just Now')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-cream/40 p-6 rounded-[2rem] flex items-center gap-4 border border-gold/5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-green-50 text-green-500">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[0.5rem] uppercase tracking-widest font-bold opacity-40">Total Value</p>
                      <p className="text-xs font-bold text-dark">₹{selectedOrder.total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Items list */}
                  <div className="space-y-8">
                    <h4 className="text-[0.65rem] uppercase tracking-[0.3em] font-bold text-gold flex items-center gap-2">
                       <ShoppingBag className="w-4 h-4" /> Your Parcel
                    </h4>
                    <div className="space-y-8">
                      {parseItems(selectedOrder.items).map((item, idx) => (
                        <div key={idx} className="flex gap-6 group/item">
                          <div className="w-24 h-32 md:w-32 md:h-44 bg-cream rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-gold/5">
                            <img src={item.img} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700" />
                          </div>
                          <div className="flex-1 space-y-3 pt-2">
                            <div className="flex flex-col gap-1">
                              <h5 className="font-serif text-2xl italic text-dark leading-tight">{item.name}</h5>
                              <p className="text-gold font-bold text-[0.7rem] uppercase tracking-widest">₹{item.price.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex flex-col items-start gap-1 py-1">
                               <span className="px-3 py-1 bg-cream rounded-full text-[0.5rem] font-bold uppercase tracking-widest text-mid">Size: {item.size}</span>
                               <span className="text-[0.55rem] font-bold text-mid opacity-60 ml-1">Quantity: {item.qty}</span>
                               {item.customization && (
                                <div className="mt-2 w-full max-w-sm bg-cream/30 p-2.5 rounded-xl border border-gold/5">
                                  <p className="text-[0.5rem] uppercase tracking-widest font-bold text-gold mb-1">Customization</p>
                                  <p className="text-[0.65rem] text-dark/70 font-serif italic leading-relaxed">{item.customization}</p>
                                </div>
                               )}
                            </div>
                            <div className="pt-4">
                              <button 
                                onClick={() => onAddToCart(item.id, item.size, item.customization)}
                                className="flex items-center gap-2 px-6 py-3 bg-cream text-dark hover:bg-gold hover:text-white rounded-xl text-[0.55rem] font-bold uppercase tracking-widest transition-all group/btn"
                              >
                                <RefreshCw className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" /> 
                                Buy Again
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <h4 className="text-[0.65rem] uppercase tracking-[0.3em] font-bold text-gold flex items-center gap-2">
                         <MapPin className="w-4 h-4" /> Delivery Details
                      </h4>
                      <div className="bg-cream/20 p-8 rounded-[2.5rem] border border-gold/5 space-y-6">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                            <User className="w-4 h-4 text-gold" />
                          </div>
                          <div>
                            <p className="text-[0.55rem] uppercase tracking-widest font-bold opacity-40">Recipient</p>
                            <p className="text-sm font-serif italic text-dark text-lg">{selectedOrder.userName}</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                            <Phone className="w-4 h-4 text-gold" />
                          </div>
                          <div>
                            <p className="text-[0.55rem] uppercase tracking-widest font-bold opacity-40">Contact Number</p>
                            <p className="text-sm text-dark font-mono">{selectedOrder.userPhone}</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                            <MapPin className="w-4 h-4 text-gold" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[0.55rem] uppercase tracking-widest font-bold opacity-40">Destination</p>
                            <p className="text-sm text-dark leading-relaxed font-serif italic">
                              {selectedOrder.address}
                            </p>
                            <div className="mt-2 text-dark text-[0.6rem] font-bold uppercase tracking-widest inline-block border-b border-gold">
                              Pincode: {selectedOrder.pincode}
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-cream/50 flex flex-wrap items-center justify-between gap-6 border-t border-cream">
                <button 
                  onClick={() => {
                    setSelectedOrder(null);
                    setView('track');
                  }}
                  className="flex items-center gap-4 px-10 py-5 bg-dark text-white rounded-2xl text-[0.65rem] font-bold uppercase tracking-[0.2em] hover:bg-gold transition-all shadow-xl shadow-dark/20"
                >
                  <Truck className="w-5 h-5" /> Live Parcel Tracking
                </button>
                <div className="flex items-center gap-8">
                  <button 
                    onClick={() => setView('help')}
                    className="text-[0.6rem] uppercase tracking-widest font-bold text-dark hover:text-gold transition-colors"
                  >
                    Raise Query
                  </button>
                  <div className="w-1 h-1 bg-gold rounded-full" />
                  <p className="text-[0.55rem] font-bold uppercase tracking-widest opacity-30">Pastel Support Available 24/7</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer setView={setView} siteConfig={siteConfig} />
    </div>
  );
}
