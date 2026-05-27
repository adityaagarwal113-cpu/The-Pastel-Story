import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  category: string;
  tags: string[];
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  published_at?: string;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_location?: string;
  rating: number;
  review_text: string;
  product_id?: number;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  promo_code?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value?: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  banner_text?: string;
  created_at: string;
}
