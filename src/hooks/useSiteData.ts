import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { DEFAULT_PRODUCTS } from '../constants';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

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

  useEffect(() => {
    // Real-time products from Firestore
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (snapshot.empty) {
        setProducts(DEFAULT_PRODUCTS);
      } else {
        setProducts(snapshot.docs.map(doc => ({ ...doc.data() } as Product)));
      }
      setLoading(false);
    }, (error) => {
      setProducts(DEFAULT_PRODUCTS);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'products');
      } catch (e) {
        console.warn('Silent fallback to local products on quota exceeded/error.');
      }
    });

    // Real-time site config from Firestore
    const unsubConfig = onSnapshot(doc(db, 'site_config', 'main'), (snap) => {
      if (snap.exists()) {
        setSiteConfig(snap.data());
      }
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'site_config/main');
      } catch (e) {
        console.warn('Silent fallback to local site config on quota exceeded/error.');
      }
    });

    return () => {
      unsubProducts();
      unsubConfig();
    };
  }, []);

  return { products, siteConfig, loading, usingContentful: false };
}
