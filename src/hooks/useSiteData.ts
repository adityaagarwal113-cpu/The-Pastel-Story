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
    // Real-time products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (snapshot.empty) {
        setProducts(DEFAULT_PRODUCTS);
      } else {
        setProducts(snapshot.docs.map(doc => ({ ...doc.data() } as Product)));
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Real-time site config
    const unsubConfig = onSnapshot(doc(db, 'site_config', 'main'), (doc) => {
      if (doc.exists()) {
        setSiteConfig(doc.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'site_config/main');
    });

    return () => {
      unsubProducts();
      unsubConfig();
    };
  }, []);

  return { products, siteConfig, loading };
}
