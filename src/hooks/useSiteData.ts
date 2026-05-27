import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { DEFAULT_PRODUCTS } from '../constants';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { getContentfulProducts, isContentfulConfigured } from '../lib/contentful';

export function useSiteData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({
    heroTitle: 'The Pastel Story',
    heroSubtitle: 'Effortless Elegance, Timeless Silhouettes',
    heroImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600&q=80',
    marqueeText: '✦ FREE SHIPPING ON ORDERS ABOVE ₹999 ✦ HANDCRAFTED IN INDIA ✦ LUXURY PASTELS ✦',
    galleryImages: []
  });
  const [loading, setLoading] = useState(true);
  const [usingContentful, setUsingContentful] = useState(false);

  useEffect(() => {
    let unsubProducts: () => void = () => {};

    const loadData = async () => {
      if (isContentfulConfigured()) {
        try {
          const contentfulProducts = await getContentfulProducts();
          if (contentfulProducts && contentfulProducts.length > 0) {
            setProducts(contentfulProducts);
            setUsingContentful(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching Contentful products, falling back to Firestore', err);
        }
      }

      // Fallback: Real-time products from Firestore
      unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        const loadedProducts = snapshot.docs.map(doc => ({ ...doc.data() } as Product));
        const hasOldProducts = snapshot.size !== 50 || loadedProducts.some(p => p.id === 1 && p.name === 'Blush Rose Co-ord Set');

        if (snapshot.empty || hasOldProducts) {
          // Instantly show default products to avoid any latency or flicker
          setProducts(DEFAULT_PRODUCTS);
          
          const syncDatabase = async () => {
            try {
              // Delete existing products
              for (const docSnap of snapshot.docs) {
                await deleteDoc(doc(db, 'products', docSnap.id));
              }
              // Set the 50 new ones
              for (const p of DEFAULT_PRODUCTS) {
                await setDoc(doc(db, 'products', p.id.toString()), p);
              }
              console.log('Successfully synchronized 50 beautiful default products with Firestore.');
            } catch (err) {
              console.error('Error auto-syncing DEFAULT_PRODUCTS:', err);
            }
          };
          syncDatabase();
        } else {
          setProducts(loadedProducts);
        }
        setUsingContentful(false);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
        setProducts(DEFAULT_PRODUCTS);
        setLoading(false);
      });
    };

    loadData();

    // Real-time site config from Firestore
    const unsubConfig = onSnapshot(doc(db, 'site_config', 'main'), (doc) => {
      if (doc.exists()) {
        setSiteConfig(doc.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'site_config/main');
    });

    return () => {
      if (unsubProducts) unsubProducts();
      unsubConfig();
    };
  }, []);

  return { products, siteConfig, loading, usingContentful };
}
