import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Percent } from 'lucide-react';
import { fetchActivePromotions, Promotion } from '../lib/contentful';
import { Entry } from 'contentful';

export function PromotionBanner() {
  const [promotion, setPromotion] = useState<Entry<Promotion> | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchPromotion();
  }, []);

  const fetchPromotion = async () => {
    const promotions = await fetchActivePromotions();
    if (promotions.length > 0) {
      setPromotion(promotions[0]);
    }
  };

  if (!promotion || !promotion.fields.bannerText || dismissed) return null;

  const discountText = promotion.fields.discountType === 'percentage'
    ? `${promotion.fields.discountValue}% OFF`
    : `₹${promotion.fields.discountValue} OFF`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-gradient-to-r from-gold via-gold-d to-gold text-white relative overflow-hidden"
      >
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-center gap-3">
          <Gift className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-medium tracking-wider text-center">
            {promotion.fields.bannerText}
            {promotion.fields.promoCode && (
              <span className="ml-2 px-2 py-1 bg-white/20 rounded text-xs font-bold">
                {promotion.fields.promoCode}
              </span>
            )}
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss promotion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
