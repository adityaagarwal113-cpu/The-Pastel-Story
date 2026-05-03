import { motion } from 'motion/react';
import { Footer } from '../components/Footer';
import { View } from '../types';

interface AboutProps {
  setView: (view: View) => void;
}

export function About({ setView, siteConfig }: { setView: (view: View) => void, siteConfig: any }) {
  return (
    <div className="bg-[#faf8f6] min-h-screen">
      {/* Editorial Hero */}
      <section className="pt-32 pb-20 px-6 sm:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                <span className="text-micro text-gold mb-6 block italic">The Story Behind the Thread</span>
                <h1 className="font-serif text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.95] text-dark mb-10 tracking-tight whitespace-pre-line">
                  {siteConfig.aboutTitle || 'Where Softness meets Modern Grace.'}
                </h1>
                <p className="text-mid text-lg max-w-xl leading-relaxed lg:pl-12 border-l border-gold/10">
                  {siteConfig.aboutVision || 'The Pastel Story was born from a simple desire: to bring back the whisper of elegance in an era of loud trends.'}
                </p>
              </motion.div>
            </div>
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5 }}
                className="aspect-[4/5] overflow-hidden luxury-shadow grayscale-[20%] hover:grayscale-0 transition-all duration-1000"
              >
                <img 
                  src={siteConfig.aboutImage || "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80"} 
                  alt="Founder Vision" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 glass p-8 flex flex-col items-center justify-center text-center">
                 <span className="font-serif text-3xl italic text-gold">2025</span>
                 <span className="text-micro text-dark">Founded</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Vision Section */}
      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto space-y-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-start">
             <div className="space-y-8 sticky top-40">
                <span className="text-micro text-gold">The Blueprint</span>
                <h2 className="font-serif text-4xl sm:text-6xl text-dark leading-tight italic">
                   Bespoke <br /> <span className="text-gold-d not-italic font-medium">Boutique</span> Edits
                </h2>
                <div className="h-px w-24 bg-gold/10" />
             </div>
             <div className="space-y-12 pt-12">
                <div className="space-y-4">
                   <h3 className="text-micro text-dark font-bold">Uncompromising Quality</h3>
                   <p className="text-mid leading-relaxed opacity-70">
                      {siteConfig.aboutSecondary || 'Every garment is a labor of love. We use only the finest cottons, linen blends, and silk silhouettes that feel like a second skin. Our fabrics are chosen not just for their appearance, but for their longevity and breathability.'}
                   </p>
                </div>
                <div className="space-y-4 text-right">
                   <h3 className="text-micro text-dark font-bold">Artisanal Details</h3>
                   <p className="text-mid leading-relaxed opacity-70 italic">
                      "I believe that the magic lies in the details—a perfectly placed pleat, a delicate hand-stitch, or a custom measurement that makes you feel uniquely you."
                   </p>
                   <p className="text-micro text-gold">— Shiwani, Founder</p>
                </div>
             </div>
          </div>

          <div className="relative aspect-[16/6] w-full overflow-hidden luxury-shadow">
             <img 
               src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1400&q=80" 
               alt="Aesthetic" 
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-dark/20 flex items-center justify-center">
                <div className="text-center">
                   <h2 className="font-serif text-3xl sm:text-5xl text-white italic tracking-widest mb-4">Timeless Silhouettes</h2>
                   <div className="h-px w-20 bg-gold mx-auto" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-40 px-6 text-center bg-[#faf8f6]">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="max-w-xl mx-auto space-y-10"
        >
          <span className="text-micro text-gold">Start Your Chapter</span>
          <h2 className="font-serif text-4xl sm:text-6xl text-dark italic">Ready to discover your story?</h2>
          <div className="flex justify-center gap-6 pt-4">
             <button 
               onClick={() => setView('shop')}
               className="bg-dark text-white px-12 py-6 text-micro tracking-[0.4em] uppercase hover:bg-gold hover:luxury-shadow transition-all"
             >
                Explore Archive
             </button>
          </div>
        </motion.div>
      </section>

      <Footer setView={setView} siteConfig={siteConfig} />
    </div>
  );
}
