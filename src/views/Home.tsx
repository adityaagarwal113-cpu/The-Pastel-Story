import { motion } from 'motion/react';
import { ArrowRight, Instagram } from 'lucide-react';
import { Product, View } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';

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
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-12 px-4 bg-gradient-to-br from-blush/20 via-cream to-gold/10">
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
           <div className="absolute top-[-10%] right-[-10%] w-[60%] aspect-square rounded-full border border-gold/10" />
           <div className="absolute bottom-[-20%] left-[-20%] w-[80%] aspect-square rounded-full border border-gold/10" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center md:text-left z-10"
          >
            <span className="text-[0.7rem] uppercase tracking-[0.4em] text-gold font-semibold mb-6 block">
              New Arrivals 2025
            </span>
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl leading-[1.1] text-dark mb-8 whitespace-pre-line">
              {siteConfig.heroTitle || 'Wear Your Softest Chapter'}
            </h1>
            <p className="text-mid text-sm sm:text-base max-w-md mx-auto md:mx-0 mb-10 leading-relaxed opacity-80 whitespace-pre-line">
              {siteConfig.heroSubtitle || 'Handpicked pastels. Feminine silhouettes. Every piece tells a quiet, beautiful story.'}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button 
                onClick={() => setView('shop')}
                className="bg-gold text-white px-8 py-4 rounded font-medium text-xs tracking-widest uppercase shadow-2xl shadow-gold/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                Shop Collection <ArrowRight className="w-4 h-4" />
              </button>
              <a 
                href={siteConfig.instagramUrl || "https://www.instagram.com/pastelstory_by_shiwani"} 
                target="_blank"
                className="border border-gold text-gold px-8 py-4 rounded font-medium text-xs tracking-widest uppercase hover:bg-gold hover:text-white transition-all flex items-center gap-3"
              >
                <Instagram className="w-4 h-4" /> Follow Us
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-[0_32px_80px_rgba(100,60,40,0.2)] border border-white/20">
              <img 
                src={siteConfig.heroImage || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80"} 
                alt="Main Hero" 
                className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/40 via-transparent to-transparent" />
            </div>

            {/* Decorative Badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl flex flex-col items-center justify-center z-20"
            >
              <span className="font-serif text-2xl font-bold text-dark italic">✦</span>
              <span className="text-[0.6rem] uppercase tracking-tighter text-dark font-medium">New In</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-gold py-4 overflow-hidden border-y border-gold-light/20">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1,2].map((i) => (
            <div key={i} className="flex items-center gap-8 px-4 text-white text-[0.65rem] font-bold uppercase tracking-[0.4em]">
              {siteConfig.marqueeText || '✦ THE PASTEL STORY ✦ BY SHIWANI ✦ SOFT AESTHETICS ✦ NEW ARRIVALS ✦'}
            </div>
          ))}
        </div>
      </div>


      {/* Featured Collection */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[0.6rem] uppercase tracking-[0.4em] text-gold font-bold inline-flex items-center gap-4 mb-4">
              <div className="h-px w-8 bg-gold/20" /> Selection <div className="h-px w-8 bg-gold/20" />
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-dark mb-4">New Arrivals</h2>
            <p className="text-mid text-sm max-w-sm mx-auto opacity-70">
              Fresh pieces from our SS '25 edit — get them before they're gone
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {featuredProducts.map((p) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onOpen={onOpen} 
                onAddToCart={onAddToCart}
                onWishlist={onWishlist}
                isWishlisted={wishlist.includes(p.id)}
              />
            ))}
          </div>

          <div className="mt-16 text-center">
            <button 
              onClick={() => setView('shop')}
              className="group inline-flex items-center gap-3 text-sm font-medium tracking-widest uppercase text-dark hover:text-gold transition-colors"
            >
              View Full Collection <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="py-24 px-4 bg-cream/30">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
            <span className="text-[0.6rem] uppercase tracking-[0.4em] text-gold font-bold inline-flex items-center gap-4 mb-4">
               Instagram
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-dark mb-4">Our Pastel World</h2>
            <p className="text-mid text-sm max-w-sm mx-auto opacity-70 mb-8">
              @pastelstory_by_shiwani — follow for daily drops & styling inspo
            </p>
            <a 
              href={siteConfig.instagramUrl || "https://www.instagram.com/pastelstory_by_shiwani"} 
              target="_blank"
              className="text-gold text-xs tracking-widest uppercase font-semibold hover:underline underline-offset-4"
            >
              ✦ Follow @pastelstory_by_shiwani
            </a>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
            {products.map((p, i) => (
               <a 
                key={i}
                href={siteConfig.instagramUrl || "https://www.instagram.com/pastelstory_by_shiwani"} 
                target="_blank"
                className="group relative aspect-square overflow-hidden rounded-sm cursor-pointer"
               >
                 {p.imgs[0] ? (
                   <img 
                    src={p.imgs[0]} 
                    alt="" 
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                   />
                 ) : (
                   <div className="w-full h-full bg-cream" />
                 )}
                 <div className="absolute inset-0 bg-gold/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                    <Instagram className="text-white w-6 h-6 mb-2" />
                    <span className="text-white text-[0.55rem] tracking-widest uppercase font-bold">View on Feed</span>
                    <span className="text-white/80 font-serif italic text-xs mt-1">{p.name}</span>
                 </div>
               </a>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative p-12 text-center bg-white/40 backdrop-blur-xl border border-gold/10 rounded-2xl shadow-xl shadow-gold/5">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
             <p className="font-serif text-xl sm:text-3xl italic text-dark leading-relaxed mb-8 whitespace-pre-line">
               {siteConfig.quoteText || '"Every colour in our palette is a feeling — chosen for women who embrace softness as their superpower."'}
             </p>
             <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold font-bold">
               — {siteConfig.quoteAuthor || 'Shiwani, Founder of The Pastel Story'}
             </p>
          </div>
        </div>
      </section>

      <Footer setView={setView} />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />
    </div>
  );
}
