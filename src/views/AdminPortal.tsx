import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit2, Package, Tag, Layers, 
  Settings, Image as ImageIcon, ChevronRight, 
  Layout, Type, MessageSquare, Save, X,
  CheckCircle2, Clock, Truck, ShieldAlert
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Product, View } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function AdminPortal({ setView }: { setView: (v: View) => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'config'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({
    heroTitle: 'The Pastel Story',
    heroSubtitle: 'Effortless Elegance, Timeless Silhouettes',
    heroImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600&q=80',
    marqueeText: '✦ FREE SHIPPING ON ORDERS ABOVE ₹999 ✦ HANDCRAFTED IN INDIA ✦ LUXURY PASTELS ✦',
    quoteText: '"Every colour in our palette is a feeling — chosen for women who embrace softness as their superpower."',
    quoteAuthor: 'Shiwani, Founder of The Pastel Story',
    instagramUrl: 'https://www.instagram.com/pastelstory_by_shiwani',
    galleryImages: [],
    categories: ['kurta', 'coord', 'dress', 'suit', 'sharara']
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);

  const isAdmin = user?.email === 'adityaagarwal113@gmail.com';

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
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
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

    return () => {
      unsubProducts();
      unsubOrders();
      unsubConfig();
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
      await updateDoc(doc(db, 'orders', orderId), { status });
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
                        category: categories[0], 
                        imgs: [], 
                        sizes: ['S', 'M', 'L'], 
                        color: 'blush' 
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
                      <p className="text-[0.6rem] text-gold uppercase tracking-[0.2em] font-bold mb-1">{p.category}</p>
                      <h4 className="font-serif text-lg text-dark mb-2">{p.name}</h4>
                      <p className="text-dark font-bold">₹{p.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-cream">
              <div className="p-8 border-b border-cream">
                <h3 className="text-xl font-serif italic text-dark">Recent Orders ({orders.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-cream/30 text-[0.6rem] uppercase tracking-widest text-mid font-bold">
                    <tr>
                      <th className="px-8 py-4">ID</th>
                      <th className="px-8 py-4">Customer</th>
                      <th className="px-8 py-4">Items</th>
                      <th className="px-8 py-4">Total</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream">
                    {orders.map(order => (
                      <tr key={order.id} className="text-xs hover:bg-cream/10 transition-colors">
                        <td className="px-8 py-6 font-bold text-dark">{order.orderId}</td>
                        <td className="px-8 py-6">
                          <p className="font-bold text-dark">{order.userName}</p>
                          <p className="text-[0.65rem] text-mid">{order.userPhone}</p>
                        </td>
                        <td className="px-8 py-6 max-w-xs truncate text-[0.65rem] text-mid italic">
                          {order.items}
                        </td>
                        <td className="px-8 py-6 font-bold text-dark">₹{order.total}</td>
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
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setSiteConfig({...siteConfig, heroImage: ev.target?.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="p-8 bg-cream/30 border-2 border-dashed border-gold/10 rounded-2xl text-center cursor-pointer hover:bg-gold/5 transition-colors relative"
                      >
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setSiteConfig({...siteConfig, heroImage: ev.target?.result as string});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <ImageIcon className="w-8 h-8 text-gold/30 mx-auto mb-2" />
                        <p className="text-[0.65rem] text-mid uppercase tracking-widest font-bold">Drag or Click to Upload Hero Image</p>
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
                      <label className="aspect-square rounded-xl border-2 border-dashed border-gold/20 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 transition-colors group">
                        <Plus className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
                        <input 
                          type="file" 
                          multiple
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files) {
                              Array.from(e.target.files).forEach((file: File) => {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const result = ev.target?.result as string;
                                  setSiteConfig((prev: any) => ({
                                    ...prev,
                                    galleryImages: [...(prev.galleryImages || []), result]
                                  }));
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        Array.from(e.dataTransfer.files).forEach((file: File) => {
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const result = ev.target?.result as string;
                              setSiteConfig((prev: any) => ({
                                ...prev,
                                galleryImages: [...(prev.galleryImages || []), result]
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        });
                      }}
                      className="p-4 bg-cream/30 border-2 border-dashed border-gold/10 rounded-xl text-center"
                    >
                      <p className="text-[0.55rem] text-mid uppercase tracking-widest font-bold">Drop Gallery Images Here</p>
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

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Manage Categories</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(siteConfig.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara']).map((cat: string) => (
                        <div key={cat} className="flex items-center gap-2 bg-cream px-3 py-2 rounded-lg group">
                          <span className="text-[0.65rem] uppercase font-bold text-dark">{cat}</span>
                          <button 
                            onClick={() => {
                              const newCats = siteConfig.categories.filter((c: string) => c !== cat);
                              setSiteConfig({...siteConfig, categories: newCats});
                            }}
                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        id="newCatInput"
                        type="text" 
                        placeholder="New Category Name"
                        className="flex-1 bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-xl outline-none transition-all text-xs"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('newCatInput') as HTMLInputElement;
                          if (input.value) {
                            const currentCats = siteConfig.categories || ['kurta', 'coord', 'dress', 'suit', 'sharara'];
                            setSiteConfig({...siteConfig, categories: [...currentCats, input.value.toLowerCase()]});
                            input.value = '';
                          }
                        }}
                        className="bg-gold text-white px-6 rounded-xl text-[0.65rem] font-bold uppercase"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSaveConfig}
                    className="w-full py-5 bg-dark text-white rounded-2xl font-bold text-[0.7rem] tracking-[0.2em] uppercase shadow-2xl shadow-dark/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Save className="w-5 h-5" /> Save Site Config
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
                      <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Price (₹)</label>
                      <input 
                        className="w-full p-4 bg-cream/30 rounded-2xl outline-none border-none"
                        value={isEditingProduct.price}
                        type="number"
                        onChange={(e) => setIsEditingProduct({...isEditingProduct, price: Number(e.target.value)})}
                      />
                    </div>
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
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid">Description</label>
                    <textarea 
                      className="w-full p-4 bg-cream/30 rounded-2xl outline-none border-none h-32"
                      value={isEditingProduct.desc || ''}
                      onChange={(e) => setIsEditingProduct({...isEditingProduct, desc: e.target.value})}
                    />
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
                      <label className="aspect-square rounded-xl border-2 border-dashed border-gold/20 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 transition-colors group">
                        <Plus className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
                        <span className="text-[0.5rem] uppercase font-bold text-gold mt-1">Add Image</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          multiple 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              Array.from(e.target.files).forEach((file: File) => {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const result = ev.target?.result as string;
                                  setIsEditingProduct(prev => prev ? {
                                    ...prev,
                                    imgs: [...prev.imgs, result]
                                  } : null);
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        Array.from(e.dataTransfer.files).forEach((file: File) => {
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const result = ev.target?.result as string;
                              setIsEditingProduct(prev => prev ? {
                                ...prev,
                                imgs: [...prev.imgs, result]
                              } : null);
                            };
                            reader.readAsDataURL(file);
                          }
                        });
                      }}
                      className="p-8 bg-cream/30 border-2 border-dashed border-gold/10 rounded-[2rem] text-center"
                    >
                      <ImageIcon className="w-8 h-8 text-gold/30 mx-auto mb-2" />
                      <p className="text-[0.6rem] text-mid uppercase tracking-widest font-bold">Drag & Drop Images Here</p>
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
                    className="w-full py-5 bg-gold text-white rounded-2xl font-bold text-[0.7rem] tracking-[0.2em] uppercase shadow-2xl shadow-gold/20 mt-4"
                  >
                    Save Product Changes
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
