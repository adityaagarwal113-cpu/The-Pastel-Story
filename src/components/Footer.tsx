import { Instagram, Smartphone, Mail, ArrowRight } from 'lucide-react';
import { View } from '../types';

interface FooterProps {
  setView?: (view: View) => void;
}

export function Footer({ setView }: FooterProps) {
  return (
    <footer className="bg-dark text-cream pt-20 pb-10 relative mt-20">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-30" />
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="space-y-4">
            <h2 className="font-serif text-3xl tracking-widest">
              The Pastel <span className="text-gold italic">Story</span>
            </h2>
            <p className="font-serif italic text-light text-sm opacity-60">
              Wear your softest chapter. Handpicked silhouettes for the modern woman.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-[0.6rem] uppercase tracking-[0.3em] text-gold font-semibold">Get in Touch</h3>
            <div className="space-y-4">
              <a href="https://wa.me/918444929090" target="_blank" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <Smartphone className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-[0.55rem] uppercase tracking-widest text-light">WhatsApp</p>
                  <p className="text-sm font-light text-cream">+91 84449 29090</p>
                </div>
              </a>
              <a href="https://www.instagram.com/pastelstory_by_shiwani" target="_blank" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <Instagram className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-[0.55rem] uppercase tracking-widest text-light">Instagram</p>
                  <p className="text-sm font-light text-cream">@pastelstory_by_shiwani</p>
                </div>
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[0.6rem] uppercase tracking-[0.3em] text-gold font-semibold">Quick Links</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setView?.('shop')}
                className="text-sm font-light text-light hover:text-gold transition-colors flex items-center gap-2 group w-fit"
              >
                Shop Collection <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </button>
              <button 
                onClick={() => setView?.('cart')}
                className="text-sm font-light text-light hover:text-gold transition-colors flex items-center gap-2 group w-fit"
              >
                Track Order <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </button>
              <a 
                href="https://wa.me/918444929090" 
                target="_blank"
                className="text-sm font-light text-light hover:text-gold transition-colors flex items-center gap-2 group w-fit"
              >
                Order via WhatsApp <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-gold/10 text-center">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-light/30">
            © 2025 The Pastel Story by Shiwani. Crafted with 🌸
          </p>
        </div>
      </div>
    </footer>
  );
}
