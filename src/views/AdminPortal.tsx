import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit2, Package, Tag, Layers, 
  Settings, Image as ImageIcon, ChevronRight, 
  Layout, Type, MessageSquare, Save, X,
  CheckCircle2, Clock, Truck, ShieldAlert, User, Star, Search, Filter
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Product, View } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function AdminPortal({ setView }: { setView: (v: View) => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'config' | 'reviews'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [siteConfig, setSiteConfig] = useState<any>({
    heroTitle: 'The Pastel Story',
    heroSubtitle: 'Effortless Elegance, Timeless Silhouettes',
    heroImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600&q=80',
    heroButtonText: 'Explore Collection',
    marqueeText: '✦ FREE SHIPPING ON ORDERS ABOVE ₹999 ✦ HANDCRAFTED IN INDIA ✦ LUXURY PASTELS ✦',
    quoteText: '"Every colour in our palette is a feeling — chosen for women who embrace softness as their superpower."',
    quoteAuthor: 'Shiwani, Founder of The Pastel Story',
    instagramUrl: 'https://www.instagram.com/pastelstory_by_shiwani',
    aboutTitle: 'Where Softness meets Modern Grace.',
    aboutVision: 'The Pastel Story was born from a simple desire: to bring back the whisper of elegance in an era of loud trends. Shiwani founded this brand with the vision of creating a sanctuary of soft aesthetics.',
    aboutImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80',
    contactWhatsApp: '+91 84449 29090',
    contactEmail: 'contact@pastelstory.com',
    galleryImages: [],
    categories: ['kurta', 'coord', 'dress', 'suit', 'sharara']
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isEditingReview, setIsEditingReview] = useState<any | null>(null);
  const [editingTracking, setEditingTracking] = useState<{ id: string, trackingId: string, trackingLink: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isAdmin = user?.email === 'adityaagarwal113@gmail.com';

  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      setUploadProgress('Uploading...');
      // Upload directly without compression as requested for speed
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `uploads/${Date.now()}_${safeName}`);
      const snapshot = await uploadBytes(storageRef, file);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setUploadProgress('');
    }
  };

  const handleSeedData = async () => {
    try {
      const { DEFAULT_PRODUCTS } = await import('../constants');
      for (const p of DEFAULT_PRODUCTS) {
        await setDoc(doc(db, 'products', p.id.toString()), p);
      }
      // Also seed site config if not exists
      const configRef = doc(db, 'site_config', 'main');
      await setDoc(configRef, siteConfig);
      alert('Database seeded with default products!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products/site_config');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    // Real-time products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Real-time orders
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('timestamp', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    // Real-time config
    const unsubConfig = onSnapshot(doc(db, 'site_config', 'main'), (doc) => {
      if (doc.exists()) setSiteConfig(doc.data());
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'site_config/main');
      setIsLoading(false);
    });

    // Real-time reviews
    const unsubReviews = onSnapshot(query(collection(db, 'reviews'), orderBy('timestamp', 'desc')), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubConfig();
      unsubReviews();
    };
  }, [isAdmin]);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-6" />
        <h1 className="font-serif text-3xl mb-4 italic">Restricted Access</h1>
        <p className="text-mid text-sm uppercase tracking-widest mb-8">This portal is for authorized personnel only.</p>
        <button 
          onClick={() => setView('home')} 
          className="px-8 py-3 bg-dark text-white rounded-xl text-xs tracking-widest uppercase"
        >
          Return Home
        </button>
      </div>
    );
  }

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const updates: any = { status };
      
      // If moving to Shipped, generate a dummy tracking ID if none exists
      const currentOrder = orders.find(o => o.id === orderId);
      if (status === 'Shipped' && !currentOrder?.trackingId) {
        const trackingId = `PS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        updates.trackingId = trackingId;
        updates.trackingLink = `https://www.google.com/search?q=${trackingId}`;
      }

      await updateDoc(doc(db, 'orders', orderId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await setDoc(doc(db, 'site_config', 'main'), siteConfig);
      alert('Config saved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'site_config/main');
    }
  };

  const handleSaveProduct = async (p: any) => {
    try {
      const pDoc = doc(db, 'products', p.id.toString());
      await setDoc(pDoc, p);
      setIsEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${p.id}`);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id.toString()));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const handleUpdateReview = async (reviewId: string, updates: any) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), updates);
      setIsEditingReview(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Delete this review permanently?')) {
      try {
        await deleteDoc(doc(db, 'reviews', reviewId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `reviews/${reviewId}`);
      }
    }
  };

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="font-serif text-4xl text-dark italic mb-2">Admin Control Portal</h1>
            <p className="text-[0.65rem] text-mid tracking-[0.3em] uppercase">Managing The Pastel Story</p>
          </div>
          <div className="flex gap-2 bg-white/50 p-1 rounded-2xl backdrop-blur-sm border border-white/20">
            {[
              { id: 'products', icon: Package, label: 'Products' },
              { id: 'orders', icon: Tag, label: 'Orders' },
              { id: 'reviews', icon: MessageSquare, label: 'Reviews' },
              { id: 'config', icon: Settings, label: 'Site Config' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[0.65rem] tracking-widest uppercase font-bold transition-all ${
                  activeTab === tab.id ? 'bg-dark text-white shadow-xl' : 'text-mid hover:bg-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif italic text-dark">Product Catalog ({products.length})</h3>
                <div className="flex gap-4">
                  {products.length === 0 && (
                    <button 
                      onClick={handleSeedData}
                      className="bg-cream border border-gold/20 text-gold px-6 py-3 rounded-xl flex items-center gap-2 text-[0.65rem] tracking-widest uppercase font-bold"
                    >
                      Seed From Constants
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      const categories = siteConfig.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara'];
                      setIsEditingProduct({ 
                        id: Date.now(), 
                        name: 'New Product', 
                        price: 0, 
                        oldPrice: null,
                        badge: '',
                        category: categories[0], 
                        imgs: [], 
                        sizes: ['S', 'M', 'L', 'XL'], 
                        color: 'blush',
                        oos: false,
                        desc: ''
                      } as any);
                    }}
                    className="bg-gold text-white px-6 py-3 rounded-xl flex items-center gap-2 text-[0.65rem] tracking-widest uppercase font-bold shadow-lg shadow-gold/20"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => (
                  <div key={p.id} className="bg-white rounded-3xl p-6 shadow-sm group hover:shadow-xl transition-all border border-cream h-full flex flex-col">
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-4 relative bg-cream">
                      {p.imgs[0] ? (
                        <img src={p.imgs[0]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold/20 italic text-[0.6rem] uppercase tracking-widest font-bold">No Image</div>
                      )}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => setIsEditingProduct(p)}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-dark hover:text-gold transition-colors shadow-lg"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-400 hover:text-red-600 transition-colors shadow-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[0.6rem] text-gold uppercase tracking-[0.2em] font-bold">{p.category}</p>
                        {p.oos && (
                          <span className="text-[0.5rem] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">OOS</span>
                        )}
                      </div>
                      <h4 className="font-serif text-lg text-dark mb-2">{p.name}</h4>
                      <div className="flex justify-between items-center text-dark font-bold">
                        <span>₹{p.price}</span>
                        <span className="text-[0.65rem] text-mid font-normal">Sizes: {p.sizes?.join(', ') || 'None'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mid" />
                  <input 
                    type="text"
                    placeholder="Search orders (ID, Name, Phone)..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gold/10 rounded-2xl outline-none focus:border-gold/30 text-sm shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white border border-gold/10 px-4 rounded-2xl shadow-sm">
                  <Filter className="w-4 h-4 text-mid" />
                  <select 
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-transparent py-4 outline-none text-[0.65rem] font-bold uppercase tracking-widest text-mid cursor-pointer min-w-[120px]"
                  >
                    <option value="All">All Status</option>
                    <option value="Order Placed">Placed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-cream">
                <div className="p-8 border-b border-cream">
                  <h3 className="text-xl font-serif italic text-dark">Recent Orders ({orders.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-cream/30 text-[0.6rem] uppercase tracking-widest text-mid font-bold">
                      <tr>
                        <th className="px-8 py-4">ID</th>
                        <th className="px-8 py-4">Placement Date</th>
                        <th className="px-8 py-4">Customer Details</th>
                        <th className="px-8 py-4">Order Items</th>
                        <th className="px-8 py-4">Total</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream text-dark">
                      {orders.filter(order => {
                        const matchesSearch = 
                          (order.orderId || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                          (order.userName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                          (order.userPhone || '').toLowerCase().includes(orderSearch.toLowerCase());
                        
                        const matchesStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter;
                        
                        return matchesSearch && matchesStatus;
                      }).map(order => (
                      <tr key={order.id} className="text-xs hover:bg-cream/10 transition-colors">
                        <td className="px-8 py-6 font-mono text-[0.65rem] opacity-50">{order.orderId}</td>
                        <td className="px-8 py-6 bg-cream/20">
                          <p className="text-[0.7rem] font-bold text-dark">
                            {order.timestamp?.toDate 
                              ? order.timestamp.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                              : (order.timestamp instanceof Date 
                                ? order.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                                : 'Recent')}
                          </p>
                          <p className="text-[0.6rem] text-mid">
                            {order.timestamp?.toDate 
                              ? order.timestamp.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                              : (order.timestamp instanceof Date 
                                ? order.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                                : 'Just now')}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-bold">{order.userName}</p>
                          <p className="text-[0.65rem] opacity-60">{order.userPhone}</p>
                          <p className="text-[0.6rem] opacity-40 mt-1 max-w-[150px] truncate">{order.address}</p>
                        </td>
                        <td className="px-8 py-6 max-w-sm min-w-[240px]">
                          <div className="space-y-3">
                            {(() => {
                              try {
                                const items = JSON.parse(order.items);
                                return items.map((item: any, idx: number) => (
                                  <div key={idx} className="bg-cream/40 p-3 rounded-xl border border-gold/5">
                                    <div className="flex justify-between items-start gap-2 mb-1 text-[0.7rem]">
                                      <p className="font-bold flex-1">{item.name}</p>
                                      <p className="text-[0.65rem] text-gold font-bold bg-white px-1.5 rounded">x{item.qty}</p>
                                    </div>
                                    <p className="text-[0.55rem] uppercase font-bold tracking-widest text-mid">Size: {item.size}</p>
                                    {item.customization && (
                                      <div className="mt-2 text-[0.7rem] text-dark/70 font-serif italic border-t border-gold/10 pt-2 leading-relaxed bg-white/30 p-2 rounded-lg">
                                        <p className="text-[0.5rem] uppercase font-bold text-gold mb-1 not-italic tracking-widest">Customization Request:</p>
                                        {item.customization}
                                      </div>
                                    )}
                                  </div>
                                ));
                              } catch (e) {
                                return <span className="text-[0.65rem] text-mid italic">{order.items}</span>;
                              }
                            })()}
                          </div>
                        </td>
                        <td className="px-8 py-6 font-bold">₹{order.total.toLocaleString('en-IN')}</td>
                        <td className="px-8 py-6">
                          {editingTracking?.id === order.id ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <input 
                                type="text"
                                placeholder="Tracking ID"
                                value={editingTracking.trackingId}
                                onChange={(e) => setEditingTracking({...editingTracking, trackingId: e.target.value})}
                                className="w-full text-[0.6rem] p-1 bg-cream/30 border border-gold/10 rounded outline-none"
                              />
                              <input 
                                type="text"
                                placeholder="Tracking Link"
                                value={editingTracking.trackingLink}
                                onChange={(e) => setEditingTracking({...editingTracking, trackingLink: e.target.value})}
                                className="w-full text-[0.6rem] p-1 bg-cream/30 border border-gold/10 rounded outline-none"
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={async () => {
                                    try {
                                      await updateDoc(doc(db, 'orders', order.id), {
                                        trackingId: editingTracking.trackingId,
                                        trackingLink: editingTracking.trackingLink
                                      });
                                      setEditingTracking(null);
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
                                    }
                                  }}
                                  className="text-[0.6rem] bg-gold text-white px-2 py-1 rounded font-bold uppercase tracking-widest"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setEditingTracking(null)}
                                  className="text-[0.6rem] bg-cream text-mid px-2 py-1 rounded font-bold uppercase tracking-widest"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : order.trackingId ? (
                            <div className="space-y-1 relative group/track">
                              <p className="text-[0.6rem] font-bold text-gold uppercase">{order.trackingId}</p>
                              <a href={order.trackingLink} target="_blank" className="text-[0.55rem] text-mid hover:underline italic">Track Link</a>
                              <button 
                                onClick={() => setEditingTracking({ id: order.id, trackingId: order.trackingId || '', trackingLink: order.trackingLink || '' })}
                                className="absolute -top-1 -right-4 opacity-0 group-hover/track:opacity-100 transition-opacity p-1 bg-white shadow-sm border border-gold/10 rounded"
                              >
                                <Edit2 className="w-3 h-3 text-gold" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setEditingTracking({ id: order.id, trackingId: '', trackingLink: '' })}
                              className="text-[0.6rem] text-mid/30 italic hover:text-gold transition-colors"
                            >
                              Add Tracking
                            </button>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-widest ${
                            order.status === 'Order Placed' ? 'bg-blue-50 text-blue-500' :
                            order.status === 'Processing' ? 'bg-orange-50 text-orange-500' :
                            order.status === 'Shipped' ? 'bg-purple-50 text-purple-500' :
                            'bg-green-50 text-green-500'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <select 
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className="bg-cream/50 text-[0.65rem] p-2 rounded-lg outline-none border-none focus:ring-1 ring-gold"
                          >
                            <option value="Order Placed">Placed</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gold/10">
                <div>
                  <h3 className="text-xl font-serif italic text-dark">Customer Reviews</h3>
                  <p className="text-[0.6rem] text-mid uppercase tracking-widest mt-1">
                    {reviews.length} total reviews published
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-cream/30 rounded-xl">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  <span className="text-sm font-bold text-dark">
                    {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'} Average
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reviews.map((review) => {
                  const product = products.find(p => p.id === review.productId);
                  const isEditing = isEditingReview?.id === review.id;

                  return (
                    <motion.div 
                      layout
                      key={review.id}
                      className="bg-white p-6 rounded-3xl border border-gold/5 transition-all hover:shadow-lg hover:shadow-gold/5"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3 items-center">
                          {review.userPhoto ? (
                            <img src={review.userPhoto} className="w-10 h-10 rounded-full" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
                              <User className="w-5 h-5 text-gold/40" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-dark">{review.userName}</h4>
                            <p className="text-[0.6rem] text-mid uppercase tracking-widest">
                              {review.timestamp?.toDate 
                                ? review.timestamp.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                                : (review.timestamp instanceof Date 
                                  ? review.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                                  : 'Recently')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-3 h-3 ${review.rating >= i ? 'fill-gold text-gold' : 'text-gold/20'}`} />
                            ))}
                          </div>
                          <span className="text-[0.5rem] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-green-50 text-green-500">
                            Visible
                          </span>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mb-4">
                          <textarea 
                            className="w-full p-4 bg-cream/30 rounded-2xl outline-none border-none text-sm font-serif italic min-h-[100px]"
                            value={isEditingReview.comment}
                            onChange={(e) => setIsEditingReview({...isEditingReview, comment: e.target.value})}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                             <button 
                               onClick={() => setIsEditingReview(null)}
                               className="px-4 py-2 text-[0.6rem] uppercase tracking-widest font-bold text-mid"
                             >
                               Cancel
                             </button>
                             <button 
                               onClick={() => handleUpdateReview(review.id, { comment: isEditingReview.comment })}
                               className="px-4 py-2 bg-dark text-white rounded-xl text-[0.6rem] uppercase tracking-widest font-bold"
                             >
                               Save Changes
                             </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 p-4 bg-cream/10 rounded-2xl italic font-serif text-sm text-mid group relative">
                          "{review.comment}"
                          <button 
                            onClick={() => setIsEditingReview(review)}
                            className="absolute top-2 right-2 p-1.5 bg-white opacity-0 group-hover:opacity-100 transition-opacity rounded-lg shadow-sm border border-gold/10"
                          >
                            <Edit2 className="w-3 h-3 text-gold" />
                          </button>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-gold/5 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center overflow-hidden shrink-0">
                             {product?.imgs[0] && <img src={product.imgs[0]} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <span className="text-[0.65rem] font-bold text-dark truncate max-w-[120px]">{product?.name || 'Unknown Product'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsEditingReview(review)}
                            className="p-2 text-mid/40 hover:text-gold hover:bg-gold/5 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-2 text-mid/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {reviews.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-gold/5 opacity-50">
                    <MessageSquare className="w-12 h-12 text-gold/20 mx-auto mb-4" />
                    <p className="font-serif italic">No customer reviews to show yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-cream space-y-8">
                <div className="flex items-center gap-4 mb-4">
                  <Layout className="w-8 h-8 text-gold" />
                  <h3 className="text-2xl font-serif italic text-dark">Hero Section</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Main Title</label>
                    <input 
                      type="text" 
                      value={siteConfig.heroTitle}
                      onChange={(e) => setSiteConfig({...siteConfig, heroTitle: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all font-serif italic text-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Hero Button Text</label>
                    <input 
                      type="text" 
                      value={siteConfig.heroButtonText || 'Explore Collection'}
                      onChange={(e) => setSiteConfig({...siteConfig, heroButtonText: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Subtitle</label>
                    <textarea 
                      value={siteConfig.heroSubtitle}
                      onChange={(e) => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm h-24"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Hero Image</label>
                    <div className="space-y-4">
                      {siteConfig.heroImage && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-cream group">
                          <img src={siteConfig.heroImage} className="w-full h-full object-cover" alt="Hero" />
                          <button 
                            onClick={() => setSiteConfig({...siteConfig, heroImage: ''})}
                            className="absolute inset-0 bg-red-500/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs uppercase tracking-widest"
                          >
                            <Trash2 className="w-5 h-5 mr-2" /> Remove Image
                          </button>
                        </div>
                      )}
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                         onDrop={async (e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            setIsUploading(true);
                            try {
                              const url = await handleFileUpload(file);
                              setSiteConfig((prev: any) => ({ ...prev, heroImage: url }));
                            } catch (e) {
                              alert('Upload failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
                            } finally {
                              setIsUploading(false);
                            }
                          }
                        }}
                        className={`p-8 bg-cream/30 border-2 border-dashed border-gold/10 rounded-2xl text-center cursor-pointer hover:bg-gold/5 transition-colors relative ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          disabled={isUploading}
                          onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploading(true);
                            try {
                              const url = await handleFileUpload(file);
                              setSiteConfig((prev: any) => ({ ...prev, heroImage: url }));
                            } catch (e) {
                              alert('Upload failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
                            } finally {
                              setIsUploading(false);
                            }
                          }
                        }}
                      />
                      {isUploading ? (
                        <div className="flex flex-col items-center">
                          <Clock className="w-8 h-8 text-gold animate-spin mb-2" />
                          <p className="text-[0.65rem] text-mid uppercase tracking-widest font-bold">{uploadProgress || 'Uploading...'}</p>
                        </div>
                      ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-gold/30 mx-auto mb-2" />
                            <p className="text-[0.65rem] text-mid uppercase tracking-widest font-bold">Drag or Click to Upload Hero Image</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-cream space-y-8">
                <div className="flex items-center gap-4 mb-4">
                  <MessageSquare className="w-8 h-8 text-gold" />
                  <h3 className="text-2xl font-serif italic text-dark">Content Config</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Marquee Bar Text</label>
                    <textarea 
                      value={siteConfig.marqueeText}
                      onChange={(e) => setSiteConfig({...siteConfig, marqueeText: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-xs tracking-widest h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Our Pastel World (Gallery)</label>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {(siteConfig.galleryImages || []).map((img: string, idx: number) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-cream group">
                          <img src={img} className="w-full h-full object-cover" alt="" />
                          <button 
                            onClick={() => {
                              const newImgs = siteConfig.galleryImages.filter((_: any, i: number) => i !== idx);
                              setSiteConfig({...siteConfig, galleryImages: newImgs});
                            }}
                            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <label className={`aspect-square rounded-xl border-2 border-dashed border-gold/20 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 transition-colors group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading ? (
                          <Clock className="w-6 h-6 text-gold animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
                            <span className="text-[0.5rem] uppercase font-bold text-gold mt-1">Add Image</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          multiple
                          className="hidden" 
                          disabled={isUploading}
                          onChange={async (e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files) as File[];
                              setIsUploading(true);
                              try {
                                const urls = await Promise.all(files.map(file => handleFileUpload(file)));
                                setSiteConfig((prev: any) => ({
                                  ...prev,
                                  galleryImages: [...(prev.galleryImages || []), ...urls]
                                }));
                              } catch (err) {
                                alert('Error uploading some images. Please try again.');
                              } finally {
                                setIsUploading(false);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const rawFiles = Array.from(e.dataTransfer.files);
                        const files = rawFiles.filter((f: any) => f.type && f.type.startsWith('image/')) as File[];
                        if (files.length === 0) return;
                        
                        setIsUploading(true);
                        try {
                          const urls = await Promise.all(files.map(file => handleFileUpload(file)));
                          setSiteConfig((prev: any) => ({
                            ...prev,
                            galleryImages: [...(prev.galleryImages || []), ...urls]
                          }));
                        } catch (err) {
                          alert('Error uploading some images.');
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                      className={`p-4 bg-cream/30 border-2 border-dashed border-gold/10 rounded-xl text-center ${isUploading ? 'opacity-50' : ''}`}
                    >
                      <p className="text-[0.55rem] text-mid uppercase tracking-widest font-bold">
                        {isUploading ? 'Uploading Gallery Images...' : 'Drop Gallery Images Here'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Quote Text</label>
                    <textarea 
                      value={siteConfig.quoteText}
                      onChange={(e) => setSiteConfig({...siteConfig, quoteText: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm italic h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Quote Author</label>
                    <input 
                      type="text" 
                      value={siteConfig.quoteAuthor}
                      onChange={(e) => setSiteConfig({...siteConfig, quoteAuthor: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-xs"
                    />
                  </div>

                  <div className="h-px w-full bg-gold/10 my-8" />
                  
                  <div className="flex items-center gap-4 mb-4">
                    <Layout className="w-8 h-8 text-gold" />
                    <h3 className="text-2xl font-serif italic text-dark">About Page Config</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">About Main Title</label>
                      <input 
                        type="text" 
                        value={siteConfig.aboutTitle || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, aboutTitle: e.target.value})}
                        className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all font-serif italic text-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">About Vision Text</label>
                      <textarea 
                        value={siteConfig.aboutVision || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, aboutVision: e.target.value})}
                        className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm h-32"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">About Secondary Text (Quality/Detail)</label>
                      <textarea 
                        value={siteConfig.aboutSecondary || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, aboutSecondary: e.target.value})}
                        className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm h-32"
                        placeholder="Text for the quality and detail section..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">About Page Image</label>
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async (e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            setIsUploading(true);
                            try {
                              const url = await handleFileUpload(file);
                              setSiteConfig((prev: any) => ({ ...prev, aboutImage: url }));
                            } catch (e) {
                              alert('Upload failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
                            } finally {
                              setIsUploading(false);
                            }
                          }
                        }}
                        className={`p-8 bg-cream/30 border-2 border-dashed border-gold/10 rounded-2xl text-center cursor-pointer hover:bg-gold/5 transition-colors relative ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploading(true);
                              try {
                                const url = await handleFileUpload(file);
                                setSiteConfig((prev: any) => ({ ...prev, aboutImage: url }));
                              } catch (e) {
                                alert('Upload failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
                              } finally {
                                setIsUploading(false);
                              }
                            }
                          }}
                        />
                        {isUploading ? (
                          <div className="flex flex-col items-center">
                            <Clock className="w-8 h-8 text-gold animate-spin mb-2" />
                            <p className="text-[0.65rem] text-mid uppercase tracking-widest font-bold">{uploadProgress || 'Uploading...'}</p>
                          </div>
                        ) : siteConfig.aboutImage ? (
                          <div className="flex flex-col items-center">
                            <img src={siteConfig.aboutImage} className="w-20 h-20 object-cover rounded-lg mb-2" alt="" />
                            <p className="text-micro text-mid">Click to Change</p>
                          </div>
                        ) : (
                          <p className="text-micro text-mid">Upload About Image</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-gold/10 my-8" />

                  <div className="flex items-center gap-4 mb-4">
                    <User className="w-8 h-8 text-gold" />
                    <h3 className="text-2xl font-serif italic text-dark">Contact & Info</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">WhatsApp Number</label>
                      <input 
                        type="text" 
                        value={siteConfig.contactWhatsApp || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, contactWhatsApp: e.target.value})}
                        className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Support Email</label>
                      <input 
                        type="email" 
                        value={siteConfig.contactEmail || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, contactEmail: e.target.value})}
                        className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="h-px w-full bg-gold/10 my-8" />

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Manage Categories</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(siteConfig.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara']).map((cat: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-cream px-3 py-2 rounded-lg group">
                          <input 
                            value={cat}
                            onChange={(e) => {
                              const newName = e.target.value.toLowerCase().trim();
                              const newCats = [...(siteConfig.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara'])];
                              newCats[idx] = newName;
                              setSiteConfig({...siteConfig, categories: newCats});
                            }}
                            className="text-[0.65rem] uppercase font-bold text-dark bg-transparent border-none outline-none focus:ring-1 ring-gold rounded px-1 w-24"
                          />
                          <button 
                            onClick={() => {
                              const newCats = (siteConfig.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara']).filter((_: any, i: number) => i !== idx);
                              setSiteConfig({...siteConfig, categories: newCats});
                            }}
                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 p-4 bg-cream/10 rounded-2xl border border-dashed border-gold/20">
                      <input 
                        id="newCatInput"
                        type="text" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            if (input.value) {
                              const currentCats = siteConfig.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara'];
                              setSiteConfig({...siteConfig, categories: [...currentCats, input.value.toLowerCase().trim()]});
                              input.value = '';
                            }
                          }
                        }}
                        placeholder="Type category & press Enter..."
                        className="flex-1 bg-transparent border-none outline-none text-xs"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('newCatInput') as HTMLInputElement;
                          if (input.value) {
                            const currentCats = siteConfig.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara'];
                            setSiteConfig({...siteConfig, categories: [...currentCats, input.value.toLowerCase().trim()]});
                            input.value = '';
                          }
                        }}
                        className="text-gold font-bold text-xs uppercase tracking-widest hover:underline px-2"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSaveConfig}
                    disabled={isUploading}
                    className="w-full py-5 bg-dark text-white rounded-2xl font-bold text-[0.7rem] tracking-[0.2em] uppercase shadow-2xl shadow-dark/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isUploading ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isUploading ? 'Uploading Assets...' : 'Save Site Config'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Product Edit Modal */}
      <AnimatePresence>
        {isEditingProduct && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setIsEditingProduct(null)}
               className="absolute inset-0 bg-dark/40 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-cream flex justify-between items-center">
                <h2 className="font-serif text-3xl italic">Edit Product</h2>
                <button onClick={() => setIsEditingProduct(null)} className="p-2 hover:bg-cream rounded-full transition-colors"><X/></button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Name</label>
                    <input 
                      className="w-full p-4 bg-cream/30 rounded-2xl outline-none border-none"
                      value={isEditingProduct.name}
                      onChange={(e) => setIsEditingProduct({...isEditingProduct, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Current Price (₹)</label>
                      <input 
                        className="w-full p-4 bg-cream/30 rounded-2xl outline-none border-none"
                        value={isEditingProduct.price}
                        type="number"
                        onChange={(e) => setIsEditingProduct({...isEditingProduct, price: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Original Price (₹) - Optional</label>
                      <input 
                        className="w-full p-4 bg-cream/30 rounded-2xl outline-none border-none"
                        value={isEditingProduct.oldPrice || ''}
                        type="number"
                        placeholder="Strike-through price"
                        onChange={(e) => setIsEditingProduct({...isEditingProduct, oldPrice: e.target.value ? Number(e.target.value) : undefined})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Category</label>
                      <select 
                        className="w-full p-4 bg-cream/30 rounded-2xl outline-none border-none uppercase text-[0.65rem] font-bold"
                        value={isEditingProduct.category}
                        onChange={(e) => setIsEditingProduct({...isEditingProduct, category: e.target.value})}
                      >
                         {(siteConfig.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara']).map((cat: string) => (
                           <option key={cat} value={cat}>{cat}</option>
                         ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Label / Badge (Optional)</label>
                      <select 
                        className="w-full p-4 bg-cream/30 rounded-2xl outline-none border-none uppercase text-[0.65rem] font-bold"
                        value={isEditingProduct.badge || ''}
                        onChange={(e) => setIsEditingProduct({...isEditingProduct, badge: e.target.value})}
                      >
                         <option value="">No Label</option>
                         <option value="New Arrival">New Arrival</option>
                         <option value="Best Seller">Best Seller</option>
                         <option value="Sale">Sale</option>
                         <option value="Limited Edition">Limited Edition</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Custom Label (Optional)</label>
                    <input 
                      placeholder="Or enter custom label text..."
                      className="w-full p-4 bg-cream/30 rounded-2xl outline-none border-none text-xs"
                      value={isEditingProduct.badge || ''}
                      onChange={(e) => setIsEditingProduct({...isEditingProduct, badge: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Description</label>
                    <textarea 
                      className="w-full p-4 bg-cream/30 rounded-2xl outline-none border-none h-32 text-sm"
                      value={isEditingProduct.desc || ''}
                      onChange={(e) => setIsEditingProduct({...isEditingProduct, desc: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-cream">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gold" />
                        <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Inventory Status</label>
                      </div>
                      <button 
                        onClick={() => setIsEditingProduct({...isEditingProduct, oos: !isEditingProduct.oos})}
                        className={`px-4 py-2 rounded-xl text-[0.6rem] font-bold uppercase transition-all flex items-center gap-2 ${
                            isEditingProduct.oos 
                            ? 'bg-red-50 text-red-500 border border-red-100' 
                            : 'bg-green-50 text-green-500 border border-green-100'
                        }`}
                      >
                        {isEditingProduct.oos ? (
                          <><X className="w-3 h-3" /> Out of Stock</>
                        ) : (
                          <><CheckCircle2 className="w-3 h-3" /> In Stock</>
                        )}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-gold" />
                        <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Available Sizes</label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'].map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              const currentSizes = isEditingProduct.sizes || [];
                              const newSizes = currentSizes.includes(size)
                                ? currentSizes.filter(s => s !== size)
                                : [...currentSizes, size];
                              setIsEditingProduct({...isEditingProduct, sizes: newSizes});
                            }}
                            className={`px-4 py-2 rounded-xl text-[0.65rem] font-bold transition-all border ${
                              (isEditingProduct.sizes || []).includes(size)
                                ? 'bg-dark text-white border-dark shadow-lg shadow-dark/10'
                                : 'bg-cream/30 text-mid border-transparent hover:border-gold/20'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      <p className="text-[0.55rem] text-mid italic">
                        * Select all sizes that are currently available for this product.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid mb-2 block">Product Images</label>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {isEditingProduct.imgs.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-cream group">
                          {img ? (
                            <img src={img} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full bg-cream/50" />
                          )}
                          <button 
                            onClick={() => {
                              const newImgs = isEditingProduct.imgs.filter((_, i) => i !== idx);
                              setIsEditingProduct({...isEditingProduct, imgs: newImgs});
                            }}
                            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <label className={`aspect-square rounded-xl border-2 border-dashed border-gold/20 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 transition-colors group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading ? (
                          <Clock className="w-6 h-6 text-gold animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
                            <span className="text-[0.5rem] uppercase font-bold text-gold mt-1">Add Image</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          multiple 
                          accept="image/*"
                          disabled={isUploading}
                          onChange={async (e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files) as File[];
                              setIsUploading(true);
                              try {
                                const urls = await Promise.all(files.map(file => handleFileUpload(file)));
                                setIsEditingProduct(prev => prev ? {
                                  ...prev,
                                  imgs: [...prev.imgs, ...urls]
                                } : null);
                              } catch (err) {
                                alert('Error uploading some images.');
                              } finally {
                                setIsUploading(false);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const rawFiles = Array.from(e.dataTransfer.files);
                        const files = rawFiles.filter((f: any) => f.type && f.type.startsWith('image/')) as File[];
                        if (files.length === 0) return;

                        setIsUploading(true);
                        try {
                          const urls = await Promise.all(files.map(file => handleFileUpload(file)));
                          setIsEditingProduct(prev => prev ? {
                            ...prev,
                            imgs: [...prev.imgs, ...urls]
                          } : null);
                        } catch (err) {
                          alert('Error uploading some images.');
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                      className={`p-8 bg-cream/30 border-2 border-dashed border-gold/10 rounded-[2rem] text-center ${isUploading ? 'opacity-50' : ''}`}
                    >
                      <ImageIcon className="w-8 h-8 text-gold/30 mx-auto mb-2" />
                      <p className="text-[0.6rem] text-mid uppercase tracking-widest font-bold">
                        {isUploading ? 'Uploading Images...' : 'Drag & Drop Images Here'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">External Image URL (Alternative)</label>
                      <div className="flex gap-2">
                        <input 
                          id="urlInput"
                          className="flex-1 p-4 bg-cream/30 rounded-xl outline-none border-none text-[0.65rem] font-mono"
                          placeholder="https://..."
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById('urlInput') as HTMLInputElement;
                            if (input.value) {
                              setIsEditingProduct({...isEditingProduct, imgs: [...isEditingProduct.imgs, input.value]});
                              input.value = '';
                            }
                          }}
                          className="bg-dark text-white px-4 rounded-xl text-[0.6rem] font-bold uppercase"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSaveProduct(isEditingProduct)}
                    disabled={isUploading}
                    className="w-full py-5 bg-gold text-white rounded-2xl font-bold text-[0.7rem] tracking-[0.2em] uppercase shadow-2xl shadow-gold/20 mt-4 disabled:opacity-50"
                  >
                    {isUploading ? 'Waiting for uploads...' : 'Save Product Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
