# Contentful CMS Integration Guide

## Overview

The site has been migrated from Supabase to **Contentful CMS** for content management. Contentful provides a powerful headless CMS with better content modeling, rich media management, and collaboration features.

## Content Models Setup

### 1. Blog Post Content Model

**Content Type ID:** `blogPost`

**Fields:**

| Field Name | Field ID | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| Title | `title` | Short text | Yes | Blog post title |
| Slug | `slug` | Short text | Yes | URL-friendly identifier (unique) |
| Content | `content` | Rich text | Yes | Full blog post content |
| Excerpt | `excerpt` | Short text | No | Summary for card display |
| Featured Image | `featuredImage` | Media | No | Blog post image |
| Category | `category` | Short text | Yes | Category (style-guide, fashion-tips, brand-story) |
| Tags | `tags` | Short text, list | No | Array of tags |
| Meta Title | `metaTitle` | Short text | No | SEO title |
| Meta Description | `metaDescription` | Short text | No | SEO description |
| Author | `author` | Short text | No | Author name (default: The Pastel Story) |
| Published At | `publishedAt` | Date | No | Publication date |

**Validation Rules:**
- Slug must be unique
- Category must be one of: `style-guide`, `fashion-tips`, `brand-story`, `trend-report`, `behind-scenes`
- Meta title max 60 characters
- Meta description max 160 characters

### 2. Testimonial Content Model

**Content Type ID:** `testimonial`

**Fields:**

| Field Name | Field ID | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| Customer Name | `customerName` | Short text | Yes | Customer's name |
| Customer Location | `customerLocation` | Short text | No | City, State |
| Rating | `rating` | Integer | Yes | Star rating (1-5) |
| Review Text | `reviewText` | Long text | Yes | Testimonial content |
| Product Image | `productImage` | Media | No | Optional product image |
| Featured | `featured` | Boolean | No | Show on homepage |

**Validation Rules:**
- Rating between 1 and 5
- Review text max 500 characters
- Featured testimonials limited to 5

### 3. Promotion Content Model

**Content Type ID:** `promotion`

**Fields:**

| Field Name | Field ID | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| Title | `title` | Short text | Yes | Promotion name |
| Description | `description` | Short text | No | Promotion details |
| Promo Code | `promoCode` | Short text | No | Discount code |
| Discount Type | `discountType` | Short text | Yes | "percentage" or "fixed" |
| Discount Value | `discountValue` | Number | Yes | Discount amount |
| Min Order Value | `minOrderValue` | Number | No | Minimum order requirement |
| Starts At | `startsAt` | Date | Yes | Promotion start date |
| Ends At | `endsAt` | Date | Yes | Promotion end date |
| Active | `active` | Boolean | Yes | Is promotion active? |
| Banner Text | `bannerText` | Short text | Yes | Text for homepage banner |
| Banner Image | `bannerImage` | Media | No | Optional banner image |

**Validation Rules:**
- Discount value positive
- Ends at > Starts at
- Banner text max 100 characters

### 4. FAQ Content Model

**Content Type ID:** `faq`

**Fields:**

| Field Name | Field ID | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| Question | `question` | Short text | Yes | FAQ question |
| Answer | `answer` | Rich text | Yes | FAQ answer |
| Category | `category` | Short text | Yes | Category (shipping, returns, products, general) |
| Sort Order | `sortOrder` | Integer | No | Display order |

**Validation Rules:**
- Sort order default 0
- Category must be one of: `shipping`, `returns`, `products`, `general`, `customization`

## Setting Up Contentful

### Step 1: Create Contentful Account

1. Go to [Contentful](https://be.contentful.com/login/)
2. Sign up or log in
3. Create a new **Space** (free tier available)

### Step 2: Get API Keys

1. In your Contentful dashboard, go to **Settings** → **API keys**
2. Click **Add API key**
3. Copy the following values:
   - **Space ID**
   - **Content Delivery API - access token** (for production)
   - **Content Preview API - access token** (optional, for drafts)

### Step 3: Update Environment Variables

Add to your `.env` file:

```env
VITE_CONTENTFUL_SPACE_ID=your_space_id_here
VITE_CONTENTFUL_ACCESS_TOKEN=your_access_token_here
VITE_CONTENTFUL_PREVIEW_TOKEN=your_preview_token_here
```

### Step 4: Create Content Models

#### Via Contentful Web Interface:

1. Go to **Content model** → **Add content type**
2. Create each content type as specified above
3. Add fields with proper validation

#### Via Contentful CLI (Alternative):

```bash
# Install Contentful CLI
npm install -g contentful-cli

# Login
contentful login

# Import content model (coming soon)
```

### Step 5: Create Sample Content

#### Blog Posts:

1. Go to **Content**
2. Click **Add blogPost**
3. Fill in:
   - Title: "How to Style Pastel Kurta Sets for Summer"
   - Slug: "how-to-style-pastel-kurta-sets"
   - Content: (Your article content)
   - Excerpt: "Learn how to style pastel kurta sets..."
   - Category: "style-guide"
   - Tags: `pastel fashion`, `kurta sets`, `summer style`
   - Meta Title: "How to Style Pastel Kurta Sets | The Pastel Story"
   - Meta Description: "Expert tips on styling pastel kurtas..."
   - Published At: Select a past date
4. Click **Publish**

#### Testimonials:

1. Click **Add testimonial**
2. Fill in:
   - Customer Name: "Priya Sharma"
   - Customer Location: "Delhi"
   - Rating: 5
   - Review Text: "Absolutely in love with my pastel kurta set..."
   - Featured: Yes
3. Click **Publish**

#### Promotions:

1. Click **Add promotion**
2. Fill in:
   - Title: "Summer Sale"
   - Description: "Enjoy special discounts on summer collections"
   - Promo Code: "SUMMER25"
   - Discount Type: "percentage"
   - Discount Value: 25
   - Min Order Value: 999
   - Starts At: Today
   - Ends At: 30 days from now
   - Active: Yes
   - Banner Text: "Summer Sale: Get 25% OFF on orders above ₹999"
3. Click **Publish**

## API Integration Details

### Contentful Client

Located in `src/lib/contentful.ts`:

```typescript
import { createClient } from 'contentful';

const client = createClient({
  space: SPACE_ID,
  accessToken: ACCESS_TOKEN,
});
```

### Fetch Functions

**Blog Posts:**
```typescript
const posts = await fetchBlogPosts(50); // Get latest 50 posts
const post = await fetchBlogPostBySlug('how-to-style-kurta'); // Get by slug
const guides = await fetchBlogPostsByCategory('style-guide'); // By category
```

**Testimonials:**
```typescript
const featured = await fetchTestimonials(true); // Featured only
const all = await fetchTestimonials(false); // All testimonials
```

**Promotions:**
```typescript
const active = await fetchActivePromotions(); // Currently active promotions
```

**FAQs:**
```typescript
const shippingFaqs = await fetchFAQs('shipping'); // By category
const allFaqs = await fetchFAQs(); // All FAQs
```

## Advantages Over Supabase

### 1. Rich Text Editing
- WYSIWYG editor for blog content
- Markdown support
- Embedded media in content

### 2. Media Management
- Advanced image editor built-in
- Automatic image optimization
- CDN delivery
- Multiple image formats

### 3. Content Preview
- Preview unpublished content
- Side-by-side comparison
- Version history

### 4. Collaboration
- Multiple users editing content
- Workflows and approval processes
- Content stages (draft, review, published)

### 5. Localization
- Multi-language content support
- Region-specific content
- Easy internationalization

### 6. SEO Optimization
- Meta fields per content item
- Structured data support
- Dynamic sitemap generation

## Content Workflow

### 1. Draft
- Create content
- Save as draft
- Preview in Contentful

### 2. Review
- Editor reviews content
- Make changes
- Add media assets

### 3. Publish
- Set publication date
- Publish to live
- Automatically appears on site

### 4. Update
- Make changes anytime
- Republish in one click
- Version history maintained

## Image Optimization

Contentful automatically optimizes images:

```typescript
// In your code
const imageUrl = getAssetUrl(asset);

// Contentful serves optimized versions:
// - Auto webp conversion
// - Responsive images
// - Lazy loading friendly
```

**Add image transformations:**
```typescript
// Example: Resize and compress
const optimizedUrl = `${imageUrl}?w=800&q=80&fm=webp`;
```

## SEO Benefits

### 1. Fresh Content
- Easy to add new blog posts
- Regular updates signal freshness
- Content calendar planning

### 2. Content Quality
- Rich text formatting
- Embedded media
- Professional presentation

### 3. Meta Management
- Per-page SEO fields
- Social sharing customization
- Rich snippet support

### 4. Content Structure
- Categories and tags
- Internal linking
- Content hierarchy

## Content Strategy Recommendations

### Month 1:
- Publish 8-10 blog posts
- Collect 15+ testimonials
- Run 2-3 promotions
- Launch FAQ section

### Month 2-3:
- 2-3 blog posts per week
- Guest fashion bloggers
- Seasonal campaigns
- Video content integration

### Ongoing:
- Content calendar management
- Social media cross-posting
- Newsletter content
- Product launch announcements

## Monitoring & Analytics

### Contentful Analytics:
- API request volume
- Content delivery speed
- Popular content items

### Integration:
- Google Analytics for user behavior
- Google Search Console for SEO
- Social media tracking

## Pricing

### Free Tier:
- 48 content types
- 1,000 records
- 10,000 API requests/month
- 2 users

### Growth Plan ($48/month):
- Unlimited content types
- 50,000 records
- 500,000 API requests/month
- Multiple users
- Workflows

### Enterprise:
- Custom limits
- Dedicated support
- SLA guarantees

## Migration from Supabase

If you have existing Supabase content:

1. Export from Supabase as JSON
2. Create matching Contentful content types
3. Import using Contentful CLI
4. Update code to use Contentful API
5. Test thoroughly
6. Supabase can remain for user auth/orders (if needed)

## Security

### API Access:
- Space ID: Public (visible in client code)
- Access Token: Public (read-only)
- Preview Token: Public (optional, for drafts)
- Management Token: Server-side only (not in frontend)

### Content Access:
- Published content: Public via API
- Drafts: Requires preview token
- Content management: Contentful dashboard only

## Troubleshooting

### Common Issues:

**1. No content showing:**
- Check API tokens are correct
- Verify content is published (not draft)
- Check content type IDs match code

**2. Images not loading:**
- Verify image assets are published
- Check URL format (should start with `https:`)
- Test image URL directly

**3. Slow loading:**
- Use lazy loading for images
- Implement pagination for large lists
- Consider caching strategies

**4. "Access denied" errors:**
- Verify space ID and access token
- Check content is published
- Ensure correct environment (master/preview)

## Next Steps

1. **Set up Contentful account**
2. **Create content models** as specified
3. **Add API tokens** to `.env`
4. **Create sample content**
5. **Test site locally**
6. **Deploy to production**
7. **Start content marketing strategy**

## Support Resources

- [Contentful Documentation](https://www.contentful.com/developers/docs/)
- [Contentful JS SDK](https://github.com/contentful/contentful.js)
- [Contentful Community](https://www.contentful.com/community/)
- [Contentful Blog](https://www.contentful.com/blog/)

## Conclusion

Contentful provides a professional, scalable CMS solution perfect for fashion e-commerce content marketing. The integration is complete and ready for use once you add your API credentials and create the content models.

**Benefits Summary:**
✅ Professional content management
✅ Rich text and media support
✅ Collaboration workflows
✅ SEO optimization tools
✅ Developer-friendly API
✅ Scalable infrastructure

Your site is now ready to leverage Contentful's powerful features for content-driven SEO success!
