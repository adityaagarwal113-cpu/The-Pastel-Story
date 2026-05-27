import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Percent } from 'lucide-react';
import { supabase, Promotion } from '../lib/supabase';

export function PromotionBanner() {
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchActivePromotion();
  }, []);

  const fetchActivePromotion = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setPromotion(data);
    } catch (error) {
      console.error('Error fetching promotion:', error);
    }
  };

  if (!promotion || !promotion.banner_text || dismissed) return null;

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
            {promotion.banner_text}
            {promotion.promo_code && (
              <span className="ml-2 px-2 py-1 bg-white/20 rounded text-xs font-bold">
                {promotion.promo_code}
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
