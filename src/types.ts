export interface Product {
  id: number;
  name: string;
  desc?: string;
  price: number;
  oldPrice?: number | null;
  category: string;
  emoji: string;
  sizes: string[];
  color: string;
  badge?: string;
  oos: boolean;
  stock?: number | null;
  imgs: string[];
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  emoji: string;
  color: string;
  img: string;
  size: string;
  qty: number;
}

export type View = 'home' | 'shop' | 'pdp' | 'cart' | 'payment' | 'track' | 'wishlist' | 'help' | 'admin';

export interface Order {
  orderId: string;
  name: string;
  phone: string;
  address: string;
  items: string;
  total: string;
  status: string;
  timestamp: string;
}
