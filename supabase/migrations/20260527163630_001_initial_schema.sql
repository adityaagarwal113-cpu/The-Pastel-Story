/*
  # Initial Schema for The Pastel Story

  1. New Tables
    - `blogs` - Dynamic blog posts for content marketing
      - `id` (uuid, primary key)
      - `title` (text, blog title)
      - `slug` (text, URL-friendly identifier, unique)
      - `content` (text, blog content in markdown)
      - `excerpt` (text, short summary)
      - `image_url` (text, featured image)
      - `category` (text, blog category)
      - `tags` (text[], array of tags)
      - `meta_title` (text, SEO title)
      - `meta_description` (text, SEO description)
      - `is_published` (boolean, default false)
      - `published_at` (timestamptz)
      - `author` (text, default 'The Pastel Story')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `testimonials` - Customer testimonials
      - `id` (uuid, primary key)
      - `customer_name` (text)
      - `customer_location` (text, optional)
      - `rating` (integer, 1-5)
      - `review_text` (text)
      - `product_id` (integer, optional)
      - `is_approved` (boolean, default false)
      - `is_featured` (boolean, default false)
      - `created_at` (timestamptz, default now())
    
    - `faqs` - Frequently Asked Questions
      - `id` (uuid, primary key)
      - `question` (text)
      - `answer` (text)
      - `category` (text, e.g., 'shipping', 'returns', 'products')
      - `sort_order` (integer, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
    
    - `promotions` - Active promotions and offers
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `promo_code` (text, optional)
      - `discount_type` (text, 'percentage' or 'fixed')
      - `discount_value` (decimal)
      - `min_order_value` (decimal, optional)
      - `starts_at` (timestamptz)
      - `ends_at` (timestamptz)
      - `is_active` (boolean, default false)
      - `banner_text` (text, optional, for homepage banner)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Public read access for published/approved content
    - Authenticated write access for admin operations
*/

-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  image_url text,
  category text DEFAULT 'style-guide',
  tags text[] DEFAULT '{}',
  meta_title text,
  meta_description text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  author text DEFAULT 'The Pastel Story',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_location text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  product_id integer,
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  promo_code text UNIQUE,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value decimal(10,2) NOT NULL,
  min_order_value decimal(10,2),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean DEFAULT false,
  banner_text text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blogs
CREATE POLICY "Public can read published blogs"
  ON blogs FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Admins can manage blogs"
  ON blogs FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'adityaagarwal113@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'adityaagarwal113@gmail.com');

-- RLS Policies for testimonials
CREATE POLICY "Public can read approved testimonials"
  ON testimonials FOR SELECT
  TO public
  USING (is_approved = true);

CREATE POLICY "Anyone can submit testimonials"
  ON testimonials FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can manage testimonials"
  ON testimonials FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'adityaagarwal113@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'adityaagarwal113@gmail.com');

-- RLS Policies for faqs
CREATE POLICY "Public can read active FAQs"
  ON faqs FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage FAQs"
  ON faqs FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'adityaagarwal113@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'adityaagarwal113@gmail.com');

-- RLS Policies for promotions
CREATE POLICY "Public can read active promotions"
  ON promotions FOR SELECT
  TO public
  USING (is_active = true AND starts_at <= now() AND ends_at >= now());

CREATE POLICY "Admins can manage promotions"
  ON promotions FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'adityaagarwal113@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'adityaagarwal113@gmail.com');

-- Create indexes for better performance
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_published ON blogs(is_published, published_at DESC);
CREATE INDEX idx_testimonials_approved ON testimonials(is_approved, created_at DESC);
CREATE INDEX idx_faqs_category ON faqs(category, sort_order);
CREATE INDEX idx_promotions_active ON promotions(is_active, starts_at, ends_at);
