import contentful, { createClient, Entry, Asset } from 'contentful';

const spaceId = import.meta.env.VITE_CONTENTFUL_SPACE_ID;
const accessToken = import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN;
const previewToken = import.meta.env.VITE_CONTENTFUL_PREVIEW_TOKEN;

// Create Contentful client
const client = createClient({
  space: spaceId || 'demo_space',
  accessToken: accessToken || 'demo_token',
});

// Preview client for draft content (optional)
const previewClient = createClient({
  space: spaceId || 'demo_space',
  accessToken: previewToken || accessToken || 'demo_token',
  host: 'preview.contentful.com',
});

// Types for Contentful content models
export interface BlogPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: Asset;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  author: string;
  publishedAt?: string;
}

export interface Testimonial {
  customerName: string;
  customerLocation?: string;
  rating: number;
  reviewText: string;
  productImage?: Asset;
  featured: boolean;
}

export interface Promotion {
  title: string;
  description: string;
  promoCode?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  bannerText: string;
  bannerImage?: Asset;
}

export interface FAQ {
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

// Helper to get asset URL
export function getAssetUrl(asset?: Asset): string | undefined {
  if (!asset || !asset.fields || !asset.fields.file) return undefined;
  return `https:${asset.fields.file.url}`;
}

// Fetch all blog posts
export async function fetchBlogPosts(limit = 50, skip = 0): Promise<Entry<BlogPost>[]> {
  try {
    const entries = await client.getEntries<BlogPost>({
      content_type: 'blogPost',
      limit,
      skip,
      order: '-fields.publishedAt',
      'fields.publishedAt[lte]': new Date().toISOString(),
    });
    return entries.items;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

// Fetch blog post by slug
export async function fetchBlogPostBySlug(slug: string): Promise<Entry<BlogPost> | null> {
  try {
    const entries = await client.getEntries<BlogPost>({
      content_type: 'blogPost',
      'fields.slug': slug,
      limit: 1,
    });
    return entries.items[0] || null;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

// Fetch blog posts by category
export async function fetchBlogPostsByCategory(category: string): Promise<Entry<BlogPost>[]> {
  try {
    const entries = await client.getEntries<BlogPost>({
      content_type: 'blogPost',
      'fields.category': category,
      order: '-fields.publishedAt',
      'fields.publishedAt[lte]': new Date().toISOString(),
    });
    return entries.items;
  } catch (error) {
    console.error('Error fetching blog posts by category:', error);
    return [];
  }
}

// Fetch featured testimonials
export async function fetchTestimonials(featured = true): Promise<Entry<Testimonial>[]> {
  try {
    const query: any = {
      content_type: 'testimonial',
      order: '-sys.createdAt',
    };

    if (featured) {
      query['fields.featured'] = true;
    }

    const entries = await client.getEntries<Testimonial>(query);
    return entries.items;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

// Fetch active promotions
export async function fetchActivePromotions(): Promise<Entry<Promotion>[]> {
  try {
    const now = new Date().toISOString();
    const entries = await client.getEntries<Promotion>({
      content_type: 'promotion',
      'fields.active': true,
      'fields.startsAt[lte]': now,
      'fields.endsAt[gte]': now,
      order: '-fields.startsAt',
    });
    return entries.items;
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }
}

// Fetch FAQs
export async function fetchFAQs(category?: string): Promise<Entry<FAQ>[]> {
  try {
    const query: any = {
      content_type: 'faq',
      order: 'fields.sortOrder',
    };

    if (category) {
      query['fields.category'] = category;
    }

    const entries = await client.getEntries<FAQ>(query);
    return entries.items;
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
}

// Fetch all content types (for sitemap generation)
export async function fetchAllBlogSlugs(): Promise<string[]> {
  try {
    const entries = await client.getEntries<BlogPost>({
      content_type: 'blogPost',
      select: 'fields.slug',
      'fields.publishedAt[lte]': new Date().toISOString(),
    });
    return entries.items.map(item => item.fields.slug);
  } catch (error) {
    console.error('Error fetching blog slugs:', error);
    return [];
  }
}

export { client, previewClient };
