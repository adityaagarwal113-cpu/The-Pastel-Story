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
  customization?: string;
  selected?: boolean;
}

export type View = 'home' | 'shop' | 'about' | 'pdp' | 'cart' | 'payment' | 'track' | 'wishlist' | 'help' | 'admin' | 'orders' | 'blog';

export interface Order {
  id?: string;
  orderId: string;
  userId: string;
  userName: string;
  userPhone: string;
  address: string;
  pincode: string;
  items: string; // Stringified CartItem[]
  total: number;
  status: string;
  paymentProof: string;
  timestamp: any;
}

export interface Review {
  id?: string;
  productId: number;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number; // 1-5
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: any;
}
