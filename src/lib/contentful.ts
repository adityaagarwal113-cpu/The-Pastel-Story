import { createClient } from 'contentful';
import { Product } from '../types';

const metaEnv = (import.meta as any).env || {};
const SPACE_ID = metaEnv.VITE_CONTENTFUL_SPACE_ID || '';
const ACCESS_TOKEN = metaEnv.VITE_CONTENTFUL_ACCESS_TOKEN || '';
const ENVIRONMENT = metaEnv.VITE_CONTENTFUL_ENVIRONMENT || 'master';
const CONTENT_TYPE = metaEnv.VITE_CONTENTFUL_CONTENT_TYPE || 'product';

export const isContentfulConfigured = (): boolean => {
  return !!(SPACE_ID && ACCESS_TOKEN);
};

export const getContentfulProducts = async (): Promise<Product[]> => {
  if (!isContentfulConfigured()) {
    console.warn('Contentful is not configured yet. Set VITE_CONTENTFUL_SPACE_ID and VITE_CONTENTFUL_ACCESS_TOKEN in env.');
    return [];
  }

  try {
    const client = createClient({
      space: SPACE_ID,
      accessToken: ACCESS_TOKEN,
      environment: ENVIRONMENT,
    });

    const response = await client.getEntries({
      content_type: CONTENT_TYPE,
      order: ['sys.createdAt'],
    });

    // Cast response mapping as any to avoid Contentful nested field union type conflicts
    return response.items.map((item: any) => {
      const f = item.fields as any;

      // Extract images robustly (handles arrays, single assets, or direct strings)
      let resolvedImgs: string[] = [];
      const imageField = f.imgs || f.images || f.image || f.gallery;
      if (Array.isArray(imageField)) {
        resolvedImgs = imageField.map((img: any) => {
          if (typeof img === 'string') return img;
          if (img?.fields?.file?.url) {
            const url = img.fields.file.url as string;
            return url.startsWith('//') ? `https:${url}` : url;
          }
          return '';
        }).filter(Boolean);
      } else if (imageField) {
        if (typeof imageField === 'string') {
          resolvedImgs = [imageField];
        } else if (imageField?.fields?.file?.url) {
          const url = imageField.fields.file.url as string;
          resolvedImgs = [url.startsWith('//') ? `https:${url}` : url];
        }
      }

      // Extract videos robustly (handles asset or raw string)
      let resolvedVideoUrl = '';
      const videoField = f.videoUrl || f.video;
      if (typeof videoField === 'string') {
        resolvedVideoUrl = videoField;
      } else if (videoField?.fields?.file?.url) {
        const url = videoField.fields.file.url as string;
        resolvedVideoUrl = url.startsWith('//') ? `https:${url}` : url;
      }

      // Map other entries with string/number primitives casting
      return {
        id: typeof f.id === 'number' ? f.id : Number(item.sys.id) || Math.floor(Math.random() * 100000),
        name: String(f.name || f.title || 'Untitled Product'),
        desc: f.desc ? String(f.desc) : f.description ? String(f.description) : '',
        price: typeof f.price === 'number' ? f.price : Number(f.price || 0),
        oldPrice: typeof f.oldPrice === 'number' ? f.oldPrice : f.oldPrice ? Number(f.oldPrice) : null,
        category: String(f.category || 'general'),
        emoji: String(f.emoji || '✨'),
        sizes: Array.isArray(f.sizes) ? f.sizes.map((s: any) => String(s)) : ['S', 'M', 'L', 'XL'],
        color: String(f.color || 'blush'),
        badge: f.badge ? String(f.badge) : '',
        oos: typeof f.oos === 'boolean' ? f.oos : f.oos === 'true' || false,
        stock: typeof f.stock === 'number' ? f.stock : null,
        imgs: resolvedImgs.length > 0 ? resolvedImgs : ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80'],
        videoUrl: resolvedVideoUrl,
      };
    });
  } catch (error: any) {
    console.error('Failed to fetch from Contentful, falling back to local dataset.', error);
    
    // Check if it's an unknownContentType error
    const errorsList = error?.details?.errors;
    if (Array.isArray(errorsList)) {
      const unknownTypeErr = errorsList.find((e: any) => e.name === 'unknownContentType');
      if (unknownTypeErr) {
        const requestedType = unknownTypeErr.value || CONTENT_TYPE;
        console.warn(`
[Contentful Configuration Notice]:
--------------------------------------------------------------------------------------
The system tried to query Contentful using the Content Type ID: "${requestedType}",
but this Content Type does not exist in your Space ID "${SPACE_ID}".

TO RESOLVE THIS:
1. Log into your Contentful dashboard (https://app.contentful.com).
2. Go to "Content Model" -> "Design Content Type".
3. Name it "Product" and set the API ID strictly to "${requestedType}".
4. Alternatively, you can change VITE_CONTENTFUL_CONTENT_TYPE in your environment variables to match your existing Contentful model API ID.
--------------------------------------------------------------------------------------
        `);
      }
    }
    return [];
  }
};
