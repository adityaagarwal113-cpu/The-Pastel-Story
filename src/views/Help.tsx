import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MessageCircle, Mail, Clock, HelpCircle } from 'lucide-react';
import { Footer } from '../components/Footer';

export function Help({ siteConfig }: { siteConfig: any }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "How do I track my order?", a: "Click 'Track Order' in the navigation bar and enter your Order ID. You can find this ID in your confirmation WhatsApp message." },
    { q: "What is your return policy?", a: "We offer a 7-day hassle-free exchange policy. Returns are accepted for manufacturing defects only." },
    { q: "Do you offer international shipping?", a: "Currently, we only ship within India. We're working on making our pastels available worldwide soon!" },
    { q: "How should I care for my pastel pieces?", a: "We recommend hand washing in cold water or dry cleaning to maintain the delicate colors and fabric quality." },
  ];

  return (
    <div className="bg-white min-h-screen">
      <header className="pt-20 pb-12 px-4 text-center bg-cream/30">
        <span className="text-[0.7rem] uppercase tracking-[0.4em] text-gold font-bold mb-4 block">Support Center</span>
        <h1 className="font-serif text-4xl sm:text-5xl text-dark mb-4 italic">How can we help?</h1>
        <p className="text-light text-sm tracking-widest max-w-sm mx-auto uppercase">Browse FAQs or reach out directly</p>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-20">
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
            <a href={`https://wa.me/${(siteConfig.contactWhatsApp || '918444929090').replace(/\D/g, '')}`} target="_blank" className="p-6 bg-cream/50 rounded-2xl border border-gold/10 hover:border-gold hover:shadow-md transition-all text-center space-y-3 group">
               <MessageCircle className="w-6 h-6 text-gold mx-auto group-hover:scale-110 transition-transform" />
               <p className="text-[0.6rem] uppercase tracking-widest font-bold">WhatsApp</p>
               <p className="text-xs text-mid">Chat with us</p>
            </a>
            <a 
              href={`mailto:${siteConfig.contactEmail || 'support@pastelstory.com'}?subject=Support%20Inquiry%20-%20The%20Pastel%20Story`}
              className="p-6 bg-cream/50 rounded-2xl border border-gold/10 hover:border-gold hover:shadow-md transition-all text-center space-y-3 group flex flex-col justify-between items-center"
            >
               <div className="space-y-3 w-full">
                  <Mail className="w-6 h-6 text-gold mx-auto group-hover:scale-110 transition-transform" />
                  <p className="text-[0.6rem] uppercase tracking-widest font-bold">Email Support</p>
                  <p className="text-xs text-mid truncate max-w-full">{siteConfig.contactEmail || 'support@pastelstory.com'}</p>
               </div>
               <span className="mt-1 inline-block text-[0.55rem] font-bold text-gold uppercase tracking-widest bg-white group-hover:bg-gold group-hover:text-white px-3 py-1 rounded-full shadow-sm transition-all border border-gold/5">
                  Send Email
               </span>
            </a>
            <div className="p-6 bg-cream/50 rounded-2xl border border-gold/10 text-center space-y-3">
               <Clock className="w-6 h-6 text-gold mx-auto" />
               <p className="text-[0.6rem] uppercase tracking-widest font-bold">Response Time</p>
               <p className="text-xs text-mid">Within 24 hours</p>
            </div>
         </div>

         <div className="space-y-8">
            <h2 className="text-[0.7rem] uppercase tracking-[0.4em] text-gold font-bold border-b border-gold/10 pb-4">Common Questions</h2>
            <div className="space-y-4">
               {faqs.map((faq, i) => (
                 <div key={i} className="border border-gold/10 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full p-5 text-left flex justify-between items-center hover:bg-cream/20 transition-all font-medium text-dark text-sm"
                    >
                      {faq.q}
                      <ChevronDown className={`w-4 h-4 text-gold transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                       {openFaq === i && (
                         <motion.div
                           initial={{ height: 0 }}
                           animate={{ height: 'auto' }}
                           exit={{ height: 0 }}
                           className="overflow-hidden bg-cream/10"
                         >
                           <p className="p-5 pt-0 text-sm text-mid leading-relaxed opacity-80">{faq.a}</p>
                         </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
               ))}
            </div>
         </div>

         <div className="mt-20 p-10 bg-dark text-white rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <HelpCircle className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-6">
              <h3 className="font-serif text-3xl italic">Still have questions?</h3>
              <p className="max-w-md text-white/60 text-sm leading-relaxed">
                If you haven't found what you're looking for, feel free to start a live support chat on WhatsApp or send us an email inquiry.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={() => window.open(`https://wa.me/${(siteConfig.contactWhatsApp || '918444929090').replace(/\D/g, '')}`, '_blank')}
                  className="bg-gold text-white px-8 py-4 rounded-xl font-bold text-xs tracking-widest uppercase hover:scale-105 transition-all shadow-xl shadow-gold/20 flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Support
                </button>
                <a 
                  href={`mailto:${siteConfig.contactEmail || 'support@pastelstory.com'}?subject=Support%20Inquiry%20-%20The%20Pastel%20Story`}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-xs tracking-widest uppercase hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Email Support
                </a>
              </div>
            </div>
         </div>
      </div>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
