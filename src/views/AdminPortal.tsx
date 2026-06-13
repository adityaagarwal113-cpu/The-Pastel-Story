import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit2, Package, Tag, Layers, 
  Settings, Image as ImageIcon, ChevronRight, 
  Layout, Type, MessageSquare, Save, X,
  CheckCircle2, Clock, Truck, ShieldAlert, User, Star, Search, Filter,
  Loader2, Video, LayoutDashboard, TrendingUp, Coins, CalendarDays, ShoppingBag, ArrowUpRight, Sparkles
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Product, View } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { ImageUploader } from '../components/ImageUploader';
import { compressImage } from '../lib/image';

export function AdminPortal({ setView }: { setView: (v: View) => void }) {
  const usingContentful = false;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'config' | 'reviews'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [siteConfig, setSiteConfig] = useState<any>({
    siteName: 'The Pastel Story',
    heroTitle: 'The Pastel Story',
    heroSubtitle: 'Effortless Elegance, Timeless Silhouettes',
    heroImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600&q=80',
    heroSmallImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80',
    heroButtonText: 'Explore Collection',
    marqueeText: '✦ FREE SHIPPING ON ORDERS ABOVE ₹999 ✦ HANDCRAFTED IN INDIA ✦ LUXURY PASTELS ✦',
    quoteText: '"Every colour in our palette is a feeling — chosen for women who embrace softness as their superpower."',
    quoteAuthor: 'Shiwani, Founder of The Pastel Story',
    instagramUrl: 'https://www.instagram.com/pastelstory_by_shiwani',
    aboutTitle: 'Where Softness meets Modern Grace.',
    aboutVision: 'The Pastel Story was born from a simple desire: to bring back the whisper of elegance in an era of loud trends. Shiwani founded this brand with the vision of creating a sanctuary of soft aesthetics.',
    aboutImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80',
    contactWhatsApp: '+91 84449 29090',
    contactEmail: 'shiwaniag456@gmail.com',
    galleryImages: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80',
      'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=1200&q=80'
    ],
    categories: ['kurta', 'coord', 'dress', 'suit', 'sharara']
  });

  // Calculate real-time financial stats from the order collection
  const stats = useMemo(() => {
    let totalSales = 0;
    let todaysSales = 0;
    let monthlySales = 0;
    
    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    orders.forEach(order => {
      const orderTotal = Number(order.total) || 0;
      totalSales += orderTotal;

      let orderDate = new Date();
      if (order.timestamp) {
        if (typeof order.timestamp.toDate === 'function') {
          orderDate = order.timestamp.toDate();
        } else if (order.timestamp instanceof Date) {
          orderDate = order.timestamp;
        } else if (typeof order.timestamp === 'string' || typeof order.timestamp === 'number') {
          orderDate = new Date(order.timestamp);
        }
      }

      if (orderDate.toDateString() === todayStr) {
        todaysSales += orderTotal;
      }

      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        monthlySales += orderTotal;
      }
    });

    const totalOrders = orders.length;
    const avgSale = totalOrders > 0 ? (totalSales / totalOrders) : 0;

    const statusCounts = {
      placed: orders.filter(o => o.status === 'Order Placed').length,
      processing: orders.filter(o => o.status === 'Processing').length,
      shipped: orders.filter(o => o.status === 'Shipped').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      pending: orders.filter(o => o.status === 'Payment Pending Verification').length,
    };

    // Calculate details on most selling items
    const itemSales: { [key: string]: { name: string, qty: number, revenue: number, category?: string } } = {};
    orders.forEach(order => {
      try {
        const items = JSON.parse(order.items);
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const name = item.name || 'Unknown Item';
            const qty = Number(item.qty) || 0;
            const price = Number(item.price) || 0;
            if (!itemSales[name]) {
              itemSales[name] = { name, qty: 0, revenue: 0, category: item.category };
            }
            itemSales[name].qty += qty;
            itemSales[name].revenue += (qty * price);
          });
        }
      } catch (e) {
        // Safe check
      }
    });

    const topProducts = Object.values(itemSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalSales,
      todaysSales,
      monthlySales,
      avgSale,
      totalOrders,
      statusCounts,
      topProducts
    };
  }, [orders]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isEditingReview, setIsEditingReview] = useState<any | null>(null);
  const [editingTracking, setEditingTracking] = useState<{ id: string, trackingId: string, trackingLink: string } | null>(null);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<{[key: string]: File}>({});

  const isAdmin = user?.email === 'adityaagarwal113@gmail.com' || user?.email === 'shiwaniag456@gmail.com';

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      return await compressImage(file, 500, 0.7);
    } catch (err) {
      console.warn("Compression in handleFileUpload fell back to raw FileReader:", err);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.onerror = (error) => reject(error);
      });
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [adminToast, setAdminToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 3000);
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
      showToast('Database seeded with default products!');
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
      try {
        handleFirestoreError(error, OperationType.LIST, 'products');
      } catch (e) {
        console.warn('Silent products subscription fallback on quota exceeded.');
      }
    });

    // Real-time orders
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('timestamp', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      } catch (e) {
        console.warn('Silent orders subscription fallback on quota exceeded.');
      }
    });

    // Real-time config
    const unsubConfig = onSnapshot(doc(db, 'site_config', 'main'), (snap) => {
      if (snap.exists()) {
        const cloudData = snap.data();
        setSiteConfig((prev: any) => {
          const merged = {
            ...prev,
            ...cloudData
          };
          if (!cloudData.galleryImages || !Array.isArray(cloudData.galleryImages) || cloudData.galleryImages.length === 0) {
            merged.galleryImages = prev.galleryImages;
          } else {
            merged.galleryImages = cloudData.galleryImages.filter((img: any) => typeof img === 'string' && img.length > 0);
          }
          if (!cloudData.heroSmallImage) {
            merged.heroSmallImage = prev.heroSmallImage;
          }
          return merged;
        });
      }
      setIsLoading(false);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'site_config/main');
      } catch (e) {
        console.warn('Silent site_config subscription fallback on quota exceeded.');
      }
      setIsLoading(false);
    });

    // Real-time reviews
    const unsubReviews = onSnapshot(query(collection(db, 'reviews'), orderBy('timestamp', 'desc')), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      } catch (e) {
        console.warn('Silent reviews subscription fallback on quota exceeded.');
      }
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

  const handleDeleteOrder = async (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order',
      message: 'Are you sure you want to permanently delete this order? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'orders', orderId));
          setConfirmModal(null);
          showToast('Order successfully deleted.');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
        }
      }
    });
  };

  const handleResetTodayDashboard = async () => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    const todaysOrders = orders.filter(order => {
      let orderDate = new Date();
      if (order.timestamp) {
        if (typeof order.timestamp.toDate === 'function') {
          orderDate = order.timestamp.toDate();
        } else if (order.timestamp instanceof Date) {
          orderDate = order.timestamp;
        } else if (typeof order.timestamp === 'string' || typeof order.timestamp === 'number') {
          orderDate = new Date(order.timestamp);
        }
      }
      return orderDate.toDateString() === todayStr;
    });

    if (todaysOrders.length === 0) {
      showToast("No orders have been recorded today.");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Reset Today's Dashboard",
      message: `Are you sure you want to reset today's dashboard? This will permanently delete all ${todaysOrders.length} order(s) placed today. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          for (const order of todaysOrders) {
            await deleteDoc(doc(db, 'orders', order.id));
          }
          setConfirmModal(null);
          showToast("Today's dashboard reset successfully.");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `orders/*`);
        }
      }
    });
  };

  const handleSaveConfigSection = async (keys: string[], sectionName: string) => {
    try {
      setPendingUploads(prev => prev + 1);
      const configToSave = { ...siteConfig };
      const dataToSave: any = {};

      for (const key of keys) {
        let val = configToSave[key];
        if (val === undefined) continue;

        // Handle file uploads if any
        if (typeof val === 'string' && val.startsWith('blob:')) {
          const file = pendingFiles[val];
          if (file) {
            val = await handleFileUpload(file);
          }
        } else if (key === 'galleryImages' && Array.isArray(val)) {
          const uploadedGallery = [];
          for (const img of val) {
            if (img.startsWith('blob:')) {
              const file = pendingFiles[img];
              if (file) {
                const url = await handleFileUpload(file);
                uploadedGallery.push(url);
              }
            } else {
              uploadedGallery.push(img);
            }
          }
          val = uploadedGallery;
        }
        dataToSave[key] = val;
      }

      await setDoc(doc(db, 'site_config', 'main'), dataToSave, { merge: true });

      // Clean up uploaded pending files
      setPendingFiles(prev => {
        const next = { ...prev };
        for (const key of keys) {
          const val = siteConfig[key];
          if (typeof val === 'string' && val.startsWith('blob:')) {
            delete next[val];
          } else if (key === 'galleryImages' && Array.isArray(val)) {
            val.forEach(img => {
              if (img.startsWith('blob:')) delete next[img];
            });
          }
        }
        return next;
      });

      // Local update
      setSiteConfig((prev: any) => ({
        ...prev,
        ...dataToSave
      }));

      showToast(`${sectionName} saved successfully!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `site_config/main/${sectionName}`);
    } finally {
      setPendingUploads(prev => Math.max(0, prev - 1));
    }
  };

  const handleSaveConfig = async () => {
    try {
      setPendingUploads(1);
      const configToSave = { ...siteConfig };
      
      if (configToSave.heroImage?.startsWith('blob:')) {
        const file = pendingFiles[configToSave.heroImage];
        if (file) configToSave.heroImage = await handleFileUpload(file);
      }

      if (configToSave.aboutImage?.startsWith('blob:')) {
        const file = pendingFiles[configToSave.aboutImage];
        if (file) configToSave.aboutImage = await handleFileUpload(file);
      }

      if (configToSave.galleryImages) {
        const uploadedGallery = [];
        for (const img of configToSave.galleryImages) {
          if (img.startsWith('blob:')) {
            const file = pendingFiles[img];
            if (file) {
              const url = await handleFileUpload(file);
              uploadedGallery.push(url);
            }
          } else {
            uploadedGallery.push(img);
          }
        }
        configToSave.galleryImages = uploadedGallery;
      }

      await setDoc(doc(db, 'site_config', 'main'), configToSave);
      setSiteConfig(configToSave);
      setPendingFiles({});
      showToast('Config saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'site_config/main');
    } finally {
      setPendingUploads(0);
    }
  };

  const handleSaveProduct = async (p: any) => {
    if (!p) return;
    try {
      setPendingUploads(1);
      const productToSave = { ...p };

      if (productToSave.imgs) {
        const uploadedImgs = [];
        for (const img of productToSave.imgs) {
          if (img.startsWith('blob:')) {
            const file = pendingFiles[img];
            if (file) {
              const url = await handleFileUpload(file);
              uploadedImgs.push(url);
            }
          } else {
            uploadedImgs.push(img);
          }
        }
        productToSave.imgs = uploadedImgs;
      }

      if (productToSave.videoUrl?.startsWith('blob:')) {
        const file = pendingFiles[productToSave.videoUrl];
        if (file) productToSave.videoUrl = await handleFileUpload(file);
      }

      const pDoc = doc(db, 'products', productToSave.id.toString());
      await setDoc(pDoc, productToSave);
      setIsEditingProduct(null);
      setPendingFiles({});
      showToast('Silhouette saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${p.id}`);
    } finally {
      setPendingUploads(0);
    }
  };

  const handleDeleteProduct = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Silhouette',
      message: 'Are you sure you want to permanently delete this product from the master showcase? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'products', id.toString()));
          showToast('Product deleted successfully');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
        }
      }
    });
  };

  const handleUpdateReview = async (reviewId: string, updates: any) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), updates);
      setIsEditingReview(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Review',
      message: 'Are you sure you want to permanently delete this client story review? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'reviews', reviewId));
          showToast('Review deleted successfully');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `reviews/${reviewId}`);
        }
      }
    });
  };

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center lg:text-left">
            <h1 className="font-serif text-3xl sm:text-4xl text-dark italic mb-2">Admin Control Portal</h1>
            <p className="text-[0.65rem] text-mid tracking-[0.3em] uppercase">Managing The Pastel Story</p>
          </div>
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 flex justify-center">
            <div className="flex gap-1 bg-white/50 p-1 rounded-2xl backdrop-blur-sm border border-white/20 min-w-max">
              {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                { id: 'products', icon: Package, label: 'Products' },
                { id: 'orders', icon: Tag, label: 'Orders' },
                { id: 'reviews', icon: MessageSquare, label: 'Reviews' },
                { id: 'config', icon: Settings, label: 'Site Config' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 sm:px-6 sm:py-3 rounded-xl text-[0.62rem] sm:text-[0.65rem] tracking-wider sm:tracking-widest uppercase font-bold transition-all ${
                    activeTab === tab.id ? 'bg-dark text-white shadow-xl' : 'text-mid hover:bg-white'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="inline sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* BRAND WELCOME HEADER AREA */}
              <div className="bg-dark text-white rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px] -ml-20 -mb-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gold animate-ping"></span>
                      <span className="text-[0.6rem] sm:text-xs uppercase tracking-[0.3em] text-gold font-bold">Pastel Command Hub</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-serif italic text-cream">Hello Shiwani,</h2>
                    <p className="text-xs sm:text-sm text-cream/75 max-w-2xl leading-relaxed">
                      Welcome back to your store's control hub. Below is the real-time financial tracking, sales stats, and customer trends of your exquisite Indian wear brand, <strong>The Pastel Story</strong>.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      onClick={handleResetTodayDashboard}
                      className="w-full md:w-auto px-5 py-3 bg-red-600/25 hover:bg-red-600/40 text-red-100 hover:text-white border border-red-500/30 rounded-2xl text-[0.65rem] tracking-wider uppercase font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Reset Today's Dashboard
                    </button>
                  </div>
                </div>
              </div>

              {/* STATS METRIC GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Today's Sales */}
                <div className="bg-white rounded-[2rem] p-6 border border-cream shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[0.65rem] uppercase tracking-widest text-mid font-black">Today's Sales</p>
                    <p className="text-2xl sm:text-3xl font-serif italic text-dark font-bold">
                      ₹{stats.todaysSales.toLocaleString('en-IN')}
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="inline-block text-[0.6rem] bg-gold/10 text-gold/80 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                        Live Operations
                      </span>
                      {stats.todaysSales > 0 && (
                        <button
                          onClick={handleResetTodayDashboard}
                          className="text-[0.6rem] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 transition-colors px-2 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"
                          title="Reset Today's Dashboard"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-cream rounded-2xl">
                    <Coins className="w-5 h-5 text-gold" />
                  </div>
                </div>

                {/* 2. Monthly Sales */}
                <div className="bg-white rounded-[2rem] p-6 border border-cream shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[0.65rem] uppercase tracking-widest text-mid font-black">Monthly Sales</p>
                    <p className="text-2xl sm:text-3xl font-serif italic text-dark font-bold">
                      ₹{stats.monthlySales.toLocaleString('en-IN')}
                    </p>
                    <span className="inline-block text-[0.6rem] bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      Current Month
                    </span>
                  </div>
                  <div className="p-3 bg-cream rounded-2xl">
                    <CalendarDays className="w-5 h-5 text-gold" />
                  </div>
                </div>

                {/* 3. Total Sales */}
                <div className="bg-white rounded-[2rem] p-6 border border-cream shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[0.65rem] uppercase tracking-widest text-mid font-black">Total Sales</p>
                    <p className="text-2xl sm:text-3xl font-serif italic text-dark font-bold">
                      ₹{stats.totalSales.toLocaleString('en-IN')}
                    </p>
                    <span className="inline-block text-[0.6rem] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      Lifetime Revenue
                    </span>
                  </div>
                  <div className="p-3 bg-cream rounded-2xl">
                    <TrendingUp className="w-5 h-5 text-gold" />
                  </div>
                </div>

                {/* 4. Avg Sale & Total Orders */}
                <div className="bg-white rounded-[2rem] p-6 border border-cream shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[0.65rem] uppercase tracking-widest text-mid font-black">Avg Sale & Orders</p>
                    <p className="text-2xl sm:text-3xl font-serif italic text-dark font-bold">
                      ₹{Math.round(stats.avgSale).toLocaleString('en-IN')}
                    </p>
                    <span className="inline-block text-[0.6rem] bg-dark text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      {stats.totalOrders} Completed Orders
                    </span>
                  </div>
                  <div className="p-3 bg-cream rounded-2xl">
                    <ShoppingBag className="w-5 h-5 text-gold" />
                  </div>
                </div>
              </div>

              {/* INTERACTIVE WORKFLOW GRAPHICS & LISTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* RECENT ORDERS COMPONENT */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-cream lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-serif italic text-dark">Recent Activity</h3>
                      <p className="text-[0.6rem] uppercase tracking-widest text-mid font-bold mt-1">Real-time orders queue</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-gold font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-1.5"
                    >
                      View All Orders <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-cream/60">
                    {orders.slice(0, 6).map((order) => {
                      let parsedItems = [];
                      try {
                        parsedItems = JSON.parse(order.items || '[]');
                      } catch (e) {
                        parsedItems = [];
                      }

                      let dateStr = 'Just now';
                      if (order.timestamp) {
                        let dateObj = new Date();
                        if (typeof order.timestamp.toDate === 'function') dateObj = order.timestamp.toDate();
                        else if (order.timestamp instanceof Date) dateObj = order.timestamp;
                        else dateObj = new Date(order.timestamp);
                        dateStr = dateObj.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      }

                      return (
                        <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-cream/10 rounded-xl px-2 transition-colors duration-200">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-sm text-dark">{order.userName || 'Guest User'}</span>
                              <span className="text-[0.6rem] text-mid tracking-tight font-medium">({dateStr})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {parsedItems.map((pi: any, idx: number) => (
                                <span key={idx} className="text-[0.65rem] bg-cream px-2 py-0.5 rounded-md text-mid font-medium">
                                  {pi.name} <span className="font-bold text-gold">x{pi.qty}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-cream/40 pt-2 sm:pt-0">
                            <div className="text-right">
                              <p className="font-bold text-sm text-dark">₹{Number(order.total || 0).toLocaleString('en-IN')}</p>
                              <span className="text-[0.55rem] text-mid uppercase font-serif italic text-gold/80 bg-gold/5 px-2 py-0.5 rounded-full border border-gold/5">
                                {order.orderId || 'Order'}
                              </span>
                            </div>
                            <div>
                              <span className={`text-[0.6rem] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg border inline-block ${
                                order.status === 'Delivered' 
                                  ? 'bg-green-50 text-green-600 border-green-100' 
                                  : order.status === 'Shipped' 
                                  ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                  : 'bg-gold/10 text-gold border-gold/10'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {orders.length === 0 && (
                      <div className="py-12 text-center text-mid opacity-60">
                        <ShoppingBag className="w-10 h-10 text-gold/30 mx-auto mb-3" />
                        <p className="font-serif italic text-sm">No sales processed yet to record.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* TOP PRODUCTS & REVIEWS */}
                <div className="space-y-8">
                  {/* TOP SELLING PRODUCTS */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-cream space-y-6">
                    <div>
                      <h3 className="text-xl font-serif italic text-dark">Top Styles</h3>
                      <p className="text-[0.6rem] uppercase tracking-widest text-mid font-bold mt-1">Best selling items ranked</p>
                    </div>

                    <div className="space-y-4">
                      {stats.topProducts.map((p, idx) => {
                        const maxQty = stats.topProducts[0]?.qty || 1;
                        const pct = Math.round((p.qty / maxQty) * 100);

                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-serif italic font-medium text-dark truncate max-w-[150px]">{p.name}</span>
                              <span className="font-bold text-dark">{p.qty} sold <span className="text-[0.65rem] text-mid font-normal">(₹{p.revenue.toLocaleString('en-IN')})</span></span>
                            </div>
                            <div className="w-full bg-cream h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gold h-full rounded-full transition-all duration-1000"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {stats.topProducts.length === 0 && (
                        <div className="text-center py-6 text-mid opacity-60">
                          <Package className="w-8 h-8 text-gold/20 mx-auto mb-2" />
                          <p className="text-xs italic font-serif">Awaiting statistics...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTIVE REVIEWS SNAPSHOT */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-cream space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-serif italic text-dark">Feedback</h3>
                        <p className="text-[0.6rem] uppercase tracking-widest text-mid font-bold mt-1">Customer satisfaction</p>
                      </div>
                      <span className="flex items-center gap-1 bg-gold/10 text-gold text-xs px-2.5 py-1 rounded-full font-bold">
                        <Star className="w-3.5 h-3.5 fill-gold stroke-gold" />
                        {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1) : '5.0'} / 5
                      </span>
                    </div>

                    <div className="bg-cream/30 p-4 rounded-2xl border border-gold/5 flex items-center gap-4 text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-dark">{reviews.length} total reviews received</p>
                        <p className="text-mid text-[0.7rem]">98% of customers recommended pastel designs.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pt-4">
                <h3 className="text-xl font-serif italic text-dark">Active Showcase Catalog ({products.length})</h3>
                <div className="flex gap-4">
                  <>
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
                  </>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => (
                  <div key={p.id} className="bg-white rounded-3xl p-6 shadow-sm group hover:shadow-xl transition-all border border-cream h-full flex flex-col">
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-4 relative bg-cream">
                      {p.imgs[0] ? (
                        <img 
                          src={p.imgs[0]} 
                          className="w-full h-full object-cover" 
                          alt="" 
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold/20 italic text-[0.6rem] uppercase tracking-widest font-bold">No Image</div>
                      )}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all translate-x-0 sm:translate-x-4 sm:group-hover:translate-x-0">
                        <button 
                          onClick={() => setIsEditingProduct(p)}
                          className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-dark hover:text-gold transition-colors shadow-lg"
                        >
                          <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-red-500 hover:text-red-600 transition-colors shadow-lg"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
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

              <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-sm overflow-hidden border border-cream">
                <div className="p-5 sm:p-8 border-b border-cream">
                  <h3 className="text-xl font-serif italic text-dark">Recent Orders ({orders.length})</h3>
                </div>
                <div className="hidden md:block overflow-x-auto">
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
                          <div className="flex items-center gap-3">
                            <select 
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              className="bg-cream/50 text-[0.65rem] p-2 rounded-lg outline-none border-none focus:ring-1 ring-gold cursor-pointer"
                            >
                              <option value="Order Placed">Placed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-1.5 text-mid hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Stacked Cards */}
                <div className="block md:hidden divide-y divide-cream">
                  {orders.filter(order => {
                    const matchesSearch = 
                      (order.orderId || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                      (order.userName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                      (order.userPhone || '').toLowerCase().includes(orderSearch.toLowerCase());
                    
                    const matchesStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter;
                    
                    return matchesSearch && matchesStatus;
                  }).map(order => (
                    <div key={order.id} className="p-5 space-y-4 text-xs font-sans">
                      {/* Card Header: Order ID & Status */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-mono text-[0.62rem] opacity-50 font-bold uppercase">ID: {order.orderId}</p>
                          <p className="text-[0.6rem] text-mid mt-0.5">
                            {order.timestamp?.toDate 
                              ? order.timestamp.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                              : (order.timestamp instanceof Date 
                                ? order.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                                : 'Recent')}
                            {' • '}
                            {order.timestamp?.toDate 
                              ? order.timestamp.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                              : (order.timestamp instanceof Date 
                                ? order.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                                : 'Just now')}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[0.55rem] font-bold uppercase tracking-widest shrink-0 ${
                          order.status === 'Order Placed' ? 'bg-blue-50 text-blue-500' :
                          order.status === 'Processing' ? 'bg-orange-50 text-orange-500' :
                          order.status === 'Shipped' ? 'bg-purple-50 text-purple-500' :
                          'bg-green-50 text-green-500'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Customer info */}
                      <div className="bg-cream/25 p-3 rounded-xl space-y-1 border border-cream">
                        <p className="font-bold text-dark">{order.userName}</p>
                        <p className="text-[0.65rem] opacity-70">📞 {order.userPhone}</p>
                        <p className="text-[0.62rem] opacity-50 mt-1 leading-relaxed">📍 {order.address}, Pin: {order.pincode}</p>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        <p className="text-[0.6rem] uppercase tracking-widest text-mid font-black">Ordered Items</p>
                        {(() => {
                          try {
                            const items = JSON.parse(order.items);
                            return items.map((item: any, idx: number) => (
                              <div key={idx} className="bg-cream/45 p-3 rounded-xl border border-gold/5 flex flex-col gap-1">
                                <div className="flex justify-between items-start gap-2">
                                  <p className="font-bold text-dark flex-1">{item.name}</p>
                                  <p className="text-[0.65rem] text-gold font-bold bg-white px-2 py-0.5 rounded shadow-sm">x{item.qty}</p>
                                </div>
                                <p className="text-[0.55rem] uppercase font-bold tracking-widest text-mid">Size: {item.size}</p>
                                {item.customization && (
                                  <div className="mt-1 text-[0.65rem] text-dark/70 font-serif italic border-t border-gold/10 pt-1 leading-relaxed bg-white/20 p-2 rounded-lg">
                                    <span className="text-[0.5rem] uppercase font-bold text-gold not-italic tracking-widest block mb-0.5">Customization Request:</span>
                                    {item.customization}
                                  </div>
                                )}
                              </div>
                            ));
                          } catch (e) {
                            return <p className="text-[0.65rem] text-mid italic">{order.items}</p>;
                          }
                        })()}
                      </div>

                      {/* Footer: total, tracking updates, and quick status select */}
                      <div className="pt-4 border-t border-cream space-y-3">
                        <div className="flex justify-between items-center text-sm font-bold">
                          <span className="text-mid font-normal">Order Total:</span>
                          <span className="text-dark">₹{order.total.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Inline Tracking section */}
                        <div className="bg-cream/10 p-3 rounded-xl border border-cream/50">
                          {editingTracking?.id === order.id ? (
                            <div className="flex flex-col gap-2">
                              <input 
                                type="text"
                                placeholder="Tracking ID"
                                value={editingTracking.trackingId}
                                onChange={(e) => setEditingTracking({...editingTracking, trackingId: e.target.value})}
                                className="w-full text-[0.65rem] p-2 bg-white border border-gold/10 rounded-lg outline-none"
                              />
                              <input 
                                type="text"
                                placeholder="Tracking Link"
                                value={editingTracking.trackingLink}
                                onChange={(e) => setEditingTracking({...editingTracking, trackingLink: e.target.value})}
                                className="w-full text-[0.65rem] p-2 bg-white border border-gold/10 rounded-lg outline-none"
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
                                  className="text-[0.6rem] bg-gold text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setEditingTracking(null)}
                                  className="text-[0.6rem] bg-cream text-mid px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : order.trackingId ? (
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[0.6rem] font-bold text-gold uppercase">Track ID: {order.trackingId}</p>
                                <a href={order.trackingLink} target="_blank" rel="noreferrer" className="text-[0.55rem] text-mid hover:underline italic">Track Delivery</a>
                              </div>
                              <button 
                                onClick={() => setEditingTracking({ id: order.id, trackingId: order.trackingId || '', trackingLink: order.trackingLink || '' })}
                                className="p-1 px-2.5 bg-white shadow-sm border border-gold/15 rounded-lg flex items-center gap-1.5 text-[0.55rem] font-bold uppercase text-gold"
                              >
                                <Edit2 className="w-2.5 h-2.5" /> Edit
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setEditingTracking({ id: order.id, trackingId: '', trackingLink: '' })}
                              className="w-full text-center py-2 text-gold hover:underline text-[0.6rem] uppercase tracking-widest font-black"
                            >
                              + Add Tracking Info
                            </button>
                          )}
                        </div>

                        {/* Status Select dropdown */}
                        <div className="flex items-center gap-2">
                          <label className="text-[0.55rem] uppercase tracking-widest text-mid font-black whitespace-nowrap">Change Status:</label>
                          <select 
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className="bg-cream/40 text-[0.65rem] font-bold p-2 rounded-xl outline-none border border-gold/5 flex-1"
                          >
                            <option value="Order Placed">Placed</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-2 text-mid hover:text-red-500 hover:bg-red-50 rounded-xl border border-cream transition-colors shrink-0"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-center p-8 text-mid italic">No orders found.</p>
                  )}
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
                            <img 
                              src={review.userPhoto} 
                              className="w-10 h-10 rounded-full" 
                              alt="" 
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
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
                            className="absolute top-2 right-2 p-1.5 bg-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg shadow-sm border border-gold/10"
                          >
                            <Edit2 className="w-3 h-3 text-gold" />
                          </button>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-gold/5 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center overflow-hidden shrink-0">
                             {product?.imgs[0] && (
                               <img 
                                 src={product.imgs[0]} 
                                 className="w-full h-full object-cover" 
                                 alt="" 
                                 loading="lazy"
                                 decoding="async"
                                 referrerPolicy="no-referrer"
                               />
                             )}
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
                  <h3 className="text-2xl font-serif italic text-dark">Brand Settings</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Store / Site Name</label>
                    <input 
                      type="text" 
                      value={siteConfig.siteName || 'The Pastel Story'}
                      onChange={(e) => setSiteConfig({...siteConfig, siteName: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all font-serif italic text-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Announcement Marquee Text</label>
                    <textarea 
                      value={siteConfig.marqueeText || ''}
                      onChange={(e) => setSiteConfig({...siteConfig, marqueeText: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-xs h-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Quote Text</label>
                    <textarea 
                      value={siteConfig.quoteText || ''}
                      onChange={(e) => setSiteConfig({...siteConfig, quoteText: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm italic h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Quote Author</label>
                    <input 
                      type="text" 
                      value={siteConfig.quoteAuthor || ''}
                      onChange={(e) => setSiteConfig({...siteConfig, quoteAuthor: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-xs"
                    />
                  </div>

                  <button 
                    onClick={() => handleSaveConfigSection(['siteName', 'marqueeText', 'quoteText', 'quoteAuthor'], 'Brand Identity Settings')}
                    className="w-full py-4 mt-6 bg-dark text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                    disabled={pendingUploads > 0}
                  >
                    <Save className="w-4 h-4" /> Save Brand Settings
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-cream space-y-8">
                <div className="flex items-center gap-4 mb-4">
                  <Layers className="w-8 h-8 text-gold" />
                  <h3 className="text-2xl font-serif italic text-dark">Hero Banner</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Main Title</label>
                    <input 
                      type="text" 
                      value={siteConfig.heroTitle || ''}
                      onChange={(e) => setSiteConfig({...siteConfig, heroTitle: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all font-serif italic text-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Button Text</label>
                    <input 
                      type="text" 
                      value={siteConfig.heroButtonText || 'Explore Collection'}
                      onChange={(e) => setSiteConfig({...siteConfig, heroButtonText: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Hero Subtitle</label>
                    <textarea 
                      value={siteConfig.heroSubtitle || ''}
                      onChange={(e) => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})}
                      className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm h-24"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Hero Image */}
                    <div className="space-y-2">
                      <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Main Banner Image</label>
                      <div className="space-y-4">
                        {siteConfig.heroImage && (
                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-cream group border border-gold/5">
                            <img 
                              src={siteConfig.heroImage} 
                              className="w-full h-full object-cover" 
                              alt="Banner" 
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                            <button 
                              onClick={() => setSiteConfig({...siteConfig, heroImage: ''})}
                              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                              title="Remove Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <div 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                              const preview = URL.createObjectURL(new Blob([file], { type: file.type }));
                              setPendingFiles(prev => ({ ...prev, [preview]: file }));
                              requestAnimationFrame(() => {
                                setSiteConfig((prev: any) => ({ ...prev, heroImage: preview }));
                              });
                            }
                          }}
                          className="p-6 bg-cream/30 border-2 border-dashed border-gold/10 rounded-2xl text-center cursor-pointer hover:bg-gold/5 transition-all relative"
                        >
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const preview = URL.createObjectURL(new Blob([file], { type: file.type }));
                                setPendingFiles(prev => ({ ...prev, [preview]: file }));
                                requestAnimationFrame(() => {
                                  setSiteConfig((prev: any) => ({ ...prev, heroImage: preview }));
                                });
                               }
                            }}
                          />
                          <ImageIcon className="w-6 h-6 text-gold/30 mx-auto mb-1" />
                          <p className="text-[0.55rem] text-mid uppercase tracking-widest font-bold">Select Main Image</p>
                        </div>
                      </div>
                    </div>

                    {/* Polaroid Image */}
                    <div className="space-y-2">
                      <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Polaroid Image</label>
                      <div className="space-y-4">
                        {siteConfig.heroSmallImage && (
                          <div className="relative aspect-[3/4] max-w-[125px] mx-auto rounded-2xl overflow-hidden bg-cream group border border-gold/10 shadow-lg">
                            <img 
                              src={siteConfig.heroSmallImage} 
                              className="w-full h-full object-cover" 
                              alt="Polaroid" 
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                            <button 
                              onClick={() => setSiteConfig({...siteConfig, heroSmallImage: ''})}
                              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                              title="Remove Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <div 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                              const preview = URL.createObjectURL(new Blob([file], { type: file.type }));
                              setPendingFiles(prev => ({ ...prev, [preview]: file }));
                              requestAnimationFrame(() => {
                                setSiteConfig((prev: any) => ({ ...prev, heroSmallImage: preview }));
                              });
                            }
                          }}
                          className="p-6 bg-cream/30 border-2 border-dashed border-gold/10 rounded-2xl text-center cursor-pointer hover:bg-gold/5 transition-all relative"
                        >
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const preview = URL.createObjectURL(new Blob([file], { type: file.type }));
                                setPendingFiles(prev => ({ ...prev, [preview]: file }));
                                requestAnimationFrame(() => {
                                  setSiteConfig((prev: any) => ({ ...prev, heroSmallImage: preview }));
                                });
                              }
                            }}
                          />
                          <ImageIcon className="w-6 h-6 text-gold/30 mx-auto mb-1" />
                          <p className="text-[0.55rem] text-mid uppercase tracking-widest font-bold">Select Polaroid</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSaveConfigSection(['heroTitle', 'heroSubtitle', 'heroButtonText', 'heroImage', 'heroSmallImage'], 'Hero Section')}
                    className="w-full py-4 mt-4 bg-dark text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                    disabled={pendingUploads > 0}
                  >
                    <Save className="w-4 h-4" /> Save Hero Settings
                  </button>
                </div>
              </div>

              {/* CARD 2.5: OUR PASTEL WORLD (GALLERY) FOR PASTEL DIARIES LOOKBOOK */}
              <div id="pastel-diaries-config" className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-cream space-y-8 scroll-mt-24">
                <div className="flex items-center gap-4 mb-4">
                  <ImageIcon className="w-8 h-8 text-gold" />
                  <h3 className="text-2xl font-serif italic text-dark">Our Pastel World (Gallery)</h3>
                </div>

                <div className="bg-cream/40 border border-gold/15 rounded-3xl p-6 space-y-4 text-xs text-dark/80">
                  <p className="font-bold text-[0.7rem] uppercase tracking-[0.2em] text-gold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
                    Pastel Diaries Lookbook Instructions
                  </p>
                  <div className="space-y-4 leading-relaxed">
                    <div>
                      <span className="font-serif italic text-sm text-gold block mb-1">Step 3: Edit the Lookbook Images</span>
                      <p className="text-[0.7rem] text-mid">
                        This section controls the images displayed in the <strong>Pastel Diaries</strong> grid on your home page lookbook.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gold/10">
                      <div>
                        <strong className="text-dark block mb-0.5">To Delete an Image:</strong>
                        <p className="text-[0.65rem] text-mid">Hover over the image you wish to remove (on a phone, tap on it). Click the red Delete (X) button that appears in the top-right corner of that image.</p>
                      </div>
                      <div>
                        <strong className="text-dark block mb-0.5">To Add New Images:</strong>
                        <p className="text-[0.65rem] text-mid">Tap or click within the dashed "+ Add Image" box. Select the newer photos from your phone library or laptop drive, or drag-and-drop your image files directly into the region.</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gold/10">
                      <span className="font-serif italic text-sm text-gold block mb-1">Step 4: Save Your Settings</span>
                      <p className="text-[0.7rem] text-mid">
                        Once your images are configured exactly how you want, look directly under that section and click the black <strong>Save Brand & Content Settings</strong> button below.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      {(siteConfig.galleryImages || []).map((img: string, idx: number) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-cream group border border-gold/5">
                          <img 
                            src={img} 
                            className={`w-full h-full object-cover transition-opacity duration-500 ${img.startsWith('blob:') ? 'opacity-20 grayscale animate-pulse' : ''}`} 
                            alt="" 
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                          {img.startsWith('blob:') && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40">
                              <Loader2 className="w-5 h-5 text-gold animate-spin mb-1" />
                              <span className="text-[0.4rem] font-black text-gold uppercase">Uploading...</span>
                            </div>
                          )}
                          {!img.startsWith('blob:') && (
                            <button 
                              onClick={() => {
                                const newImgs = siteConfig.galleryImages.filter((_: any, i: number) => i !== idx);
                                setSiteConfig({...siteConfig, galleryImages: newImgs});
                              }}
                              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 font-sans font-bold"
                              title="Remove Image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-gold/20 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 transition-colors group">
                        <Plus className="w-6 h-6 text-gold transition-transform group-hover:scale-110" />
                        <span className="text-[0.55rem] uppercase font-bold text-gold mt-1">Add Image</span>
                        <input 
                          type="file" 
                          multiple
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files) as File[];
                              const newUploads = files.map(f => ({ 
                                file: f, 
                                preview: URL.createObjectURL(new Blob([f], { type: f.type })) 
                              }));
                              
                              const nextPendingFiles: {[key: string]: File} = {};
                              newUploads.forEach(u => {
                                nextPendingFiles[u.preview] = u.file;
                              });

                              setPendingFiles(prev => ({
                                ...prev,
                                ...nextPendingFiles
                              }));

                              requestAnimationFrame(() => {
                                setSiteConfig((prev: any) => ({
                                  ...prev,
                                  galleryImages: [...(prev.galleryImages || []), ...newUploads.map(u => u.preview)]
                                }));
                              });
                            }
                          }}
                        />
                      </label>
                    </div>

                    <label 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const rawFiles = Array.from(e.dataTransfer.files);
                        const files = rawFiles.filter((f: any) => f.type && f.type.startsWith('image/')) as File[];
                        if (files.length === 0) return;
                        
                        const newUploads = files.map(f => ({ 
                          file: f, 
                          preview: URL.createObjectURL(new Blob([f], { type: f.type })) 
                        }));
                        
                        const nextPendingFiles: {[key: string]: File} = {};
                        newUploads.forEach(u => {
                          nextPendingFiles[u.preview] = u.file;
                        });

                        setPendingFiles(prev => ({
                          ...prev,
                          ...nextPendingFiles
                        }));

                        requestAnimationFrame(() => {
                          setSiteConfig((prev: any) => ({
                            ...prev,
                            galleryImages: [...(prev.galleryImages || []), ...newUploads.map(u => u.preview)]
                          }));
                        });
                      }}
                      className={`block p-8 bg-cream/30 border-2 border-dashed border-gold/15 rounded-2xl text-center cursor-pointer hover:bg-gold/5 transition-all ${pendingUploads > 0 ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <input 
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files) as File[];
                            const newUploads = files.map(f => ({ 
                              file: f, 
                              preview: URL.createObjectURL(new Blob([f], { type: f.type })) 
                            }));
                            
                            const nextPendingFiles: {[key: string]: File} = {};
                            newUploads.forEach(u => {
                              nextPendingFiles[u.preview] = u.file;
                            });

                            setPendingFiles(prev => ({
                              ...prev,
                              ...nextPendingFiles
                            }));

                            requestAnimationFrame(() => {
                              setSiteConfig((prev: any) => ({
                                ...prev,
                                galleryImages: [...(prev.galleryImages || []), ...newUploads.map(u => u.preview)]
                              }));
                            });
                          }
                        }}
                      />
                      <ImageIcon className="w-6 h-6 text-gold/40 mx-auto mb-2" />
                      <p className="text-[0.6rem] text-dark/80 uppercase tracking-widest font-black">
                        {pendingUploads > 0 ? 'Uploading Gallery Images...' : 'Tap to Upload Images or Drag-and-Drop files here'}
                      </p>
                    </label>
                  </div>
                </div>

                  <button 
                    onClick={() => handleSaveConfigSection(['galleryImages'], 'Identity & General Content')}
                    className="w-full py-4 mt-6 bg-dark text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                    disabled={pendingUploads > 0}
                  >
                    <Save className="w-4 h-4" /> Save Brand & Content Settings
                  </button>
                </div>

              {/* CARD 3: ABOUT PAGE CONFIG */}
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-cream space-y-8">
                <div className="flex items-center gap-4 mb-4">
                  <Layers className="w-8 h-8 text-gold" />
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
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            const preview = URL.createObjectURL(new Blob([file], { type: file.type }));
                            setPendingFiles(prev => ({ ...prev, [preview]: file }));
                            requestAnimationFrame(() => {
                              setSiteConfig((prev: any) => ({ ...prev, aboutImage: preview }));
                            });
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
                              const preview = URL.createObjectURL(new Blob([file], { type: file.type }));
                              setPendingFiles(prev => ({ ...prev, [preview]: file }));
                              requestAnimationFrame(() => {
                                setSiteConfig((prev: any) => ({ ...prev, aboutImage: preview }));
                              });
                            }
                          }}
                        />
                        {pendingUploads > 0 ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-gold animate-spin mb-2" />
                            <p className="text-[0.65rem] text-mid uppercase tracking-widest font-black">PREPARING...</p>
                          </div>
                        ) : siteConfig.aboutImage ? (
                          <div className="flex flex-col items-center">
                            <img 
                              src={siteConfig.aboutImage} 
                              className="w-20 h-20 object-cover rounded-lg mb-2" 
                              alt="" 
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                            <p className="text-micro text-mid">Click to Change</p>
                          </div>
                        ) : (
                          <p className="text-micro text-mid">Upload About Image</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSaveConfigSection(['aboutTitle', 'aboutVision', 'aboutSecondary', 'aboutImage'], 'About Page')}
                    className="w-full py-4 mt-6 bg-dark text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                    disabled={pendingUploads > 0}
                  >
                    <Save className="w-4 h-4" /> Save About Settings
                  </button>
                </div>

              {/* CARD 4: CONTACT & INFO */}
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-cream space-y-8">
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
                    <div className="space-y-2">
                      <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Instagram URL</label>
                      <input 
                        type="text" 
                        value={siteConfig.instagramUrl || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, instagramUrl: e.target.value})}
                        className="w-full bg-cream/30 border border-transparent focus:border-gold/20 p-4 rounded-2xl outline-none transition-all text-sm"
                        placeholder="e.g. https://www.instagram.com/your_handle"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSaveConfigSection(['contactWhatsApp', 'contactEmail', 'instagramUrl'], 'Contact & Support Info')}
                    className="w-full py-4 mt-6 bg-dark text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                    disabled={pendingUploads > 0}
                  >
                    <Save className="w-4 h-4" /> Save Contact Settings
                  </button>
                </div>

              {/* CARD 5: CATEGORIES CONFIG */}
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-cream space-y-8 lg:col-span-2">
                <div className="flex items-center gap-4 mb-4">
                  <Package className="w-8 h-8 text-gold" />
                  <h3 className="text-2xl font-serif italic text-dark">Manage Categories</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest text-mid font-bold">Edit Categories</label>
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
                            className="text-red-400 hover:text-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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
                    onClick={() => handleSaveConfigSection(['categories'], 'Store Categories')}
                    className="w-full py-4 mt-6 bg-dark text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                    disabled={pendingUploads > 0}
                  >
                    <Save className="w-4 h-4" /> Save Categories Settings
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
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4">
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
              className="relative w-full max-w-4xl bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col m-1 sm:m-4"
            >
              <div className="p-5 sm:p-8 border-b border-cream flex justify-between items-center">
                <h2 className="font-serif text-2xl sm:text-3xl italic">Edit Product</h2>
                <button onClick={() => setIsEditingProduct(null)} className="p-2 hover:bg-cream rounded-full transition-colors"><X/></button>
              </div>
              <div className="p-5 sm:p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
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
                      {(isEditingProduct.imgs || []).map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-cream group">
                          {img ? (
                            <img 
                              src={img} 
                              className={`w-full h-full object-cover transition-opacity duration-500 ${img.startsWith('blob:') ? 'opacity-20 grayscale animate-pulse' : ''}`} 
                              alt="" 
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-cream/50" />
                          )}
                          {img?.startsWith('blob:') && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <Loader2 className="w-5 h-5 text-gold animate-spin mb-1" />
                              <span className="text-[0.4rem] font-black text-gold uppercase">Wait...</span>
                            </div>
                          )}
                          {(img && !img.startsWith('blob:')) && (
                            <button 
                              onClick={() => {
                                const newImgs = isEditingProduct.imgs.filter((_, i) => i !== idx);
                                setIsEditingProduct({...isEditingProduct, imgs: newImgs});
                              }}
                              className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Remove Image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <label className="aspect-square rounded-xl border-2 border-dashed border-gold/20 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 transition-colors group">
                        <Plus className="w-6 h-6 text-gold transition-transform group-hover:scale-110" />
                        <span className="text-[0.5rem] uppercase font-bold text-gold mt-1">Add Image</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          multiple 
                          accept="image/*"
                          onChange={async (e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files) as File[];
                              try {
                                const base64s = await Promise.all(
                                  files.map(file => handleFileUpload(file))
                                );
                                setIsEditingProduct(prev => prev ? {
                                  ...prev,
                                  imgs: [...prev.imgs, ...base64s]
                                } : null);
                              } catch (err) {
                                console.error('Error uploading product images:', err);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid block">Premium Drag & Drop Upload</label>
                    <ImageUploader 
                      id="product-image-upload"
                      onChange={(base64) => {
                        setIsEditingProduct(prev => prev ? {
                          ...prev,
                          imgs: [...prev.imgs, base64]
                        } : null);
                      }}
                    />
                  </div>

                  <div className="pt-4 border-t border-cream">
                    <label className="text-[0.6rem] uppercase tracking-widest font-bold text-mid mb-2 block">Product Video (Optional)</label>
                    {isEditingProduct.videoUrl ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black group mb-4">
                        <video src={isEditingProduct.videoUrl} className="w-full h-full object-cover" controls />
                        <button 
                          onClick={() => setIsEditingProduct({...isEditingProduct, videoUrl: undefined})}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div 
                          className="p-6 bg-cream/30 border-2 border-dashed border-gold/10 rounded-2xl text-center cursor-pointer hover:bg-gold/5 transition-colors relative"
                        >
                          <input 
                            type="file" 
                            accept="video/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const preview = URL.createObjectURL(new Blob([file], { type: file.type }));
                                setPendingFiles(prev => ({ ...prev, [preview]: file }));
                                requestAnimationFrame(() => {
                                  setIsEditingProduct(prev => prev ? {...prev, videoUrl: preview} : null);
                                });
                              }
                            }}
                          />
                          <ImageIcon className="w-6 h-6 text-gold/30 mx-auto mb-2" />
                          <p className="text-[0.55rem] text-mid uppercase tracking-widest font-bold">Upload Product Video</p>
                        </div>
                        <input 
                          placeholder="Or paste video URL..."
                          className="w-full p-4 bg-cream/30 rounded-xl outline-none border-none text-[0.6rem]"
                          value={isEditingProduct.videoUrl || ''}
                          onChange={(e) => setIsEditingProduct({...isEditingProduct, videoUrl: e.target.value})}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-cream">
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

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                          if (pendingUploads > 0) return;
                          handleSaveProduct(isEditingProduct);
                      }}
                      className="w-full py-5 bg-gold text-white rounded-2xl font-bold text-[0.8rem] tracking-[0.2em] uppercase shadow-2xl shadow-gold/20 mt-4 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                      disabled={pendingUploads > 0}
                    >
                      {pendingUploads > 0 ? 'PLEASE WAIT - UPLOADING...' : 'FINISH & SAVE'}
                    </button>
                    {pendingUploads > 0 && (
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Force Reset Upload Queue',
                            message: 'Some uploads seem stuck. Would you like to force-reset the queue and proceed with saving what was successfully uploaded?',
                            onConfirm: () => {
                              setPendingUploads(0);
                              showToast('Queue force-reset. You can now try to save.');
                            }
                          });
                        }}
                        className="text-[0.55rem] text-mid uppercase tracking-[0.2em] font-black underline hover:text-gold"
                      >
                        Upload stuck? Click to force reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Elegant Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-dark/25 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-[#faf8f6] rounded-3xl shadow-2xl overflow-hidden border border-gold/15 p-8 text-center"
            >
              <div className="mb-6">
                <h3 className="font-serif text-xl text-dark italic">{confirmModal.title}</h3>
                <p className="text-xs text-mid mt-3 leading-relaxed">{confirmModal.message}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-6 py-3 rounded-xl border border-gold/15 text-mid hover:text-dark hover:bg-cream/40 transition-all text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-500/10"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Elegant Custom Toast Notification */}
      <AnimatePresence>
        {adminToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-dark/95 text-cream px-6 py-3.5 rounded-full shadow-2xl z-[300] text-[0.65rem] uppercase tracking-[0.25em] font-bold flex items-center gap-3 backdrop-blur-sm border border-gold/15"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
            <span>{adminToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
