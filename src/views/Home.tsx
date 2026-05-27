import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { ArrowRight, Instagram } from 'lucide-react';
import { Product, View } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { TestimonialsSection } from '../components/TestimonialsSection';

interface HomeProps {
  products: Product[];
  siteConfig: any;
  onOpen: (id: number) => void;
  setView: (view: View) => void;
  onAddToCart: (id: number) => void;
  onWishlist: (id: number) => void;
  wishlist: number[];
}

export function Home({ products, siteConfig, onOpen, setView, onAddToCart, onWishlist, wishlist }: HomeProps) {
  const featuredProducts = products.slice(0, 12);

  return (
    <>
      <Helmet>
        <title>The Pastel Story - Handcrafted Pastel Fashion & Boutique Silhouettes</title>
        <meta name="description" content="Discover handpicked pastel silhouettes, feminine aesthetics, and boutique fashion. Shop curated collections of kurtas, co-ord sets, dresses, and suit sets crafted with love. Free shipping on orders above ₹999." />
        <meta name="keywords" content="pastel fashion, boutique clothing, handmade kurtas, co-ord sets, feminine dresses, Indian ethnic wear, handcrafted clothing, sustainable fashion, women's fashion India, The Pastel Story" />
        <link rel="canonical" href="https://thepastelstory.in/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thepastelstory.in/" />
        <meta property="og:title" content="The Pastel Story - Handcrafted Pastel Fashion & Boutique Silhouettes" />
        <meta property="og:description" content="Discover handpicked pastel silhouettes and boutique fashion. Free shipping on orders above ₹999." />
        <meta property="og:image" content={siteConfig.heroImage || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200"} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://thepastelstory.in/" />
        <meta name="twitter:title" content="The Pastel Story - Handcrafted Pastel Fashion" />
        <meta name="twitter:description" content="Discover handpicked pastel silhouettes and boutique fashion crafted with love." />
        <meta name="twitter:image" content={siteConfig.heroImage || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200"} />
      </Helmet>

      <div className="overflow-hidden bg-[#faf8f6]">
      {/* Hero Section - Editorial Layout */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 px-6 sm:px-12">
        <div className="absolute inset-0 z-0 select-none">
          {/* Subtle artistic background elements */}
          <div className="absolute top-[15%] right-[5%] w-[40%] aspect-[3/4] bg-cream/50 blur-[100px] rounded-full" />
          <div className="absolute bottom-[10%] left-[5%] w-[30%] aspect-square bg-gold/5 blur-[80px] rounded-full" />
        </div>

        <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Typography */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
            >
              <div className="flex items-center gap-4 mb-8 justify-center lg:justify-start">
                <div className="h-px w-8 bg-gold" />
                <span className="text-micro text-gold">Est. 2025 • Boutique Collection</span>
              </div>
              
              <h1 className="font-serif text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] text-dark mb-10 tracking-tight">
                {siteConfig.heroTitle?.split('\n').map((line: string, i: number) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                )) || (
                  <>
                    <span className="block">Wear Your</span>
                    <span className="block italic font-light ml-[0.5em] lg:ml-[1em] text-gold-d">Softest Chapter</span>
                  </>
                )}
              </h1>

              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-8 mb-12">
                <p className="text-mid text-sm sm:text-base max-w-sm leading-relaxed opacity-90 border-l border-gold/10 pl-6 lg:pl-8 py-2">
                  {siteConfig.heroSubtitle || 'Handpicked pastels and feminine silhouettes. Every piece tells a quiet, beautiful story of craftsmanship and softness.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                <button 
                  onClick={() => setView('shop')}
                  className="group relative overflow-hidden bg-dark text-white px-10 py-5 rounded-sm hover:luxury-shadow transition-all duration-500"
                >
                  <span className="relative z-10 text-micro tracking-[0.3em]">{siteConfig.heroButtonText || 'Shop Collection'}</span>
                  <div className="absolute inset-0 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </button>
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('shop')}>
                  <div className="w-12 h-12 rounded-full border border-gold/20 flex items-center justify-center group-hover:bg-gold/5 transition-colors">
                    <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
                  </div>
                  <span className="text-micro text-dark">View New In</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Imagery with Floating Elements */}
          <div className="lg:col-span-5 relative mt-12 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
              className="relative aspect-[4/5] sm:aspect-[3/4]"
            >
              <div className="absolute inset-4 -inset-y-4 border border-gold/10 z-0 translate-x-4 translate-y-4" />
              <div className="relative h-full w-full overflow-hidden luxury-shadow grayscale-[15%] hover:grayscale-0 transition-all duration-1000 group">
                <img 
                  src={siteConfig.heroImage || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80"} 
                  alt="Pastel Story Collection" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[3s]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-dark/10 pointer-events-none" />
              </div>

              {/* Floating Asset */}
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-10 -left-10 lg:-left-20 w-32 h-40 glass p-1 luxury-shadow z-20 hidden md:block"
              >
                <div className="h-full w-full overflow-hidden">
                   <img 
                    src={products[0]?.imgs[0] || "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80"} 
                    alt="Detail" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                   />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Narrative Section - High Whitespace */}
      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="relative flex justify-center">
            <div className="relative max-w-sm w-full">
              <div className="aspect-[3/4] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 luxury-shadow">
                <img 
                  src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80" 
                  alt="Process" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -top-12 -right-12 w-48 h-48 border border-gold/10 rounded-full flex items-center justify-center p-8 text-center bg-cream/30 backdrop-blur-sm">
                <span className="text-micro text-dark leading-loose">Crafted with Love by Shiwani</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-8">
            <span className="text-micro text-gold">The Philosophy</span>
            <h2 className="font-serif text-4xl sm:text-6xl text-dark leading-tight italic">
              Softness as a <span className="text-gold-d">Superpower.</span>
            </h2>
            <div className="h-px w-24 bg-gold/30" />
            <p className="text-mid lg:text-lg leading-relaxed max-w-lg">
              We believe that true elegance doesn't shout. It speaks in the whisper of high-quality fabrics, the grace of a perfect stitch, and the timeless beauty of a pastel palette.
            </p>
            <p className="text-mid text-sm leading-relaxed max-w-lg italic opacity-70">
              Each garment in our collection is an invitation to slow down, breathe, and embrace your most feminine self.
            </p>
          </div>
        </div>
      </section>

      {/* Marquee - Minimalist */}
      <div className="bg-dark py-6 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1,2,3].map((i) => (
            <div key={i} className="flex items-center gap-16 px-8 text-cream text-[0.6rem] font-bold uppercase tracking-[0.5em] opacity-60 italic">
              <span>✦ New Collection SS25 Now Live</span>
              <span>✦ Minimalist Luxury</span>
              <span>✦ Boutique Craftsmanship</span>
              <span>✦ The Pastel Story</span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Collection - Luxury Grid */}
      <section className="py-32 px-6 sm:px-12 bg-[#faf8f6]">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-xl">
              <span className="text-micro text-gold mb-4 block underline underline-offset-8 decoration-gold/20">The Collection</span>
              <h2 className="font-serif text-5xl sm:text-7xl text-dark mb-4">Latest Arrivals</h2>
              <p className="text-mid text-sm sm:text-base opacity-70 mt-4 leading-relaxed">
                Handpicked silhouettes from our latest drop, designed for the modern woman who values quiet luxury.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
            {featuredProducts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              >
                <ProductCard 
                  product={p} 
                  onOpen={onOpen} 
                  onAddToCart={onAddToCart}
                  onWishlist={onWishlist}
                  isWishlisted={wishlist.includes(p.id)}
                />
              </motion.div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <button 
              onClick={() => setView('shop')}
              className="group relative inline-flex items-center gap-4 px-12 py-5 bg-white border border-gold/20 text-dark overflow-hidden transition-all duration-500 hover:luxury-shadow"
            >
              <span className="relative z-10 text-micro tracking-[0.4em]">{siteConfig.heroButtonText || 'Explore All Silhouettes'}</span>
              <div className="absolute inset-x-0 bottom-0 h-0 bg-gold/5 group-hover:h-full transition-all duration-500" />
            </button>
          </div>
        </div>
      </section>

      {/* Instagram Lookbook - High End Display - 4x3 Grid */}
      <section className="py-32 px-6 sm:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <span className="text-micro text-gold mb-4 block italic">Follow Our Journey</span>
            <h2 className="font-serif text-4xl sm:text-6xl text-dark mb-6">Pastel Diaries</h2>
            <a 
              href={siteConfig.instagramUrl || "https://www.instagram.com/pastelstory_by_shiwani"} 
              target="_blank"
              className="text-micro text-dark/40 hover:text-gold transition-colors flex items-center justify-center gap-3 underline underline-offset-8 decoration-gold/20"
            >
              @pastelstory_by_shiwani ✦
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {(siteConfig.galleryImages && siteConfig.galleryImages.length > 0 ? siteConfig.galleryImages : [...products, ...products, ...products, ...products]).slice(0, 12).map((item: any, i: number) => {
              const imgSrc = typeof item === 'string' ? item : item.imgs?.[0];
              return (
                <motion.a
                  key={i}
                  href={siteConfig.instagramUrl || "https://www.instagram.com/pastelstory_by_shiwani"} 
                  target="_blank"
                  initial={{ opacity: 0, scale: 1.05 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: (i % 4) * 0.1 }}
                  className="group relative aspect-square overflow-hidden luxury-shadow bg-[#eeebe7]"
                >
                  {imgSrc ? (
                    <img 
                      src={imgSrc} 
                      alt="Lookbook" 
                      className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-[2s] group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-cream" />
                  )}
                  <div className="absolute inset-0 bg-dark/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center">
                     <div className="w-12 h-12 rounded-full glass flex items-center justify-center">
                        <Instagram className="w-5 h-5 text-dark" />
                     </div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dynamic Testimonials */}
      <TestimonialsSection />

      <Footer setView={setView} siteConfig={siteConfig} />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}} />
    </div>
    </>
  );
}
