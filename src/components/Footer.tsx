import { Instagram, Smartphone, Mail, ArrowRight } from 'lucide-react';
import { View } from '../types';

interface FooterProps {
  setView?: (view: View) => void;
  siteConfig: any;
}

export function Footer({ setView, siteConfig }: FooterProps) {
  return (
    <footer className="bg-dark text-white pt-32 pb-16 relative mt-40">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 pb-24 border-b border-white/5">
          <div className="lg:col-span-4 space-y-10">
            <h2 className="font-serif text-4xl tracking-tight italic">
              The Pastel <span className="text-gold not-italic">Story</span>
            </h2>
            <p className="text-sm text-white/40 leading-relaxed font-light max-w-sm">
              We curate chapters of softness for the modern woman. Each silhouette is a handpicked narrative of elegance and comfort, crafted for moments that matter.
            </p>
            <div className="flex gap-6">
              <a href={siteConfig.instagramUrl || "https://www.instagram.com/pastelstory_by_shiwani"} target="_blank" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-gold hover:border-gold transition-all group">
                <Instagram className="w-4 h-4 text-white/40 group-hover:text-white" />
              </a>
              <a href={`https://wa.me/${(siteConfig.contactWhatsApp || '918444929090').replace(/\D/g, '')}`} target="_blank" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-gold hover:border-gold transition-all group">
                <Smartphone className="w-4 h-4 text-white/40 group-hover:text-white" />
              </a>
              <a href={`mailto:${siteConfig.contactEmail || 'contact@pastelstory.com'}`} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-gold hover:border-gold transition-all group">
                <Mail className="w-4 h-4 text-white/40 group-hover:text-white" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-12">
            <div className="space-y-8">
              <h3 className="text-micro text-gold uppercase tracking-[0.3em]">Selection</h3>
              <div className="flex flex-col gap-4">
                {['Archives', 'Silhouettes', 'Pre-Order', 'Care Guide'].map(link => (
                  <button key={link} onClick={() => setView?.('shop')} className="text-sm text-white/40 hover:text-gold transition-colors w-fit lowercase italic">
                    {link}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-micro text-gold uppercase tracking-[0.3em]">Curated Help</h3>
              <div className="flex flex-col gap-4">
                {['Track Story', 'Shipping Archive', 'Exchange Ritual', 'Privacy'].map(link => (
                  <button key={link} onClick={() => setView?.('cart')} className="text-sm text-white/40 hover:text-gold transition-colors w-fit lowercase italic">
                    {link}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 lg:col-span-1 space-y-8">
              <h3 className="text-micro text-gold uppercase tracking-[0.3em]">Join the Narrative</h3>
              <div className="relative group">
                <input 
                  type="email" 
                  placeholder="The Registry" 
                  className="w-full bg-transparent border-b border-white/10 py-4 text-sm focus:border-gold outline-none transition-all italic font-serif"
                />
                <button className="absolute right-0 bottom-4 text-gold hover:translate-x-2 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[0.6rem] text-white/20 uppercase tracking-widest leading-relaxed">
                Subscribe to receive early access to our limited drops and secret archives.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-micro text-white/10 uppercase tracking-[0.2em]">
            © 2025 The Pastel Story by Shiwani. All rights preserved.
          </p>
          <div className="flex gap-8 text-micro text-white/10 uppercase tracking-[0.2em]">
            <span>Fair Trade</span>
            <span>Sustainable Path</span>
            <span>Artisanal Quality</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
