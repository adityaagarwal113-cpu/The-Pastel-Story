import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, User, ChevronDown } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Review } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface ReviewSectionProps {
  productId: number;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      where('status', '==', 'approved'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(revs);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, `reviews_product_${productId}`);
      } catch (err) {
        console.warn('Silent fallback on reviews subscription quota exceeded:', err);
      }
    });

    return () => unsubscribe();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!comment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        userPhoto: user.photoURL || '',
        rating,
        comment: comment.trim(),
        status: 'approved', // Reviews are now auto-approved
        timestamp: serverTimestamp()
      });

      setComment('');
      setRating(5);
      setShowForm(false);
      // Feedback toast logic is in App.tsx, but here we can just show success message
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mt-32 space-y-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
        <div className="space-y-6">
          <span className="text-micro text-gold block">Community Anthology</span>
          <div className="flex items-center gap-6">
             <span className="font-serif text-7xl text-dark leading-none">{avgRating || '—'}</span>
             <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${avgRating && parseFloat(avgRating) >= s ? 'fill-gold text-gold' : 'text-gold/20'}`}
                    />
                  ))}
                </div>
                <p className="text-micro text-mid/40">
                  based on {reviews.length} {reviews.length === 1 ? 'experience' : 'experiences'}
                </p>
             </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (!user) {
              alert("Please sign in to share your story.");
              return;
            }
            setShowForm(!showForm);
          }}
          className="text-micro border-b border-gold/20 hover:border-gold text-gold pb-1 transition-all italic lowercase"
        >
          {showForm ? 'close form' : 'share your story'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form 
              onSubmit={handleSubmit}
              className="bg-white border border-gold/10 p-10 luxury-shadow space-y-10"
            >
              <div className="text-center space-y-4">
                <p className="text-micro text-gold italic">Your experience in stars</p>
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors duration-500 ${
                          (hoverRating || rating) >= s ? 'fill-gold text-gold' : 'text-gold/5'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-micro text-gold italic">Your Narrative</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="The fabric felt like..."
                  className="w-full p-0 bg-transparent border-b border-gold/10 focus:border-gold outline-none transition-all font-serif italic text-base min-h-[100px] resize-none"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-micro text-center">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 bg-dark text-white font-bold text-micro tracking-[0.4em] uppercase hover:bg-gold hover:luxury-shadow transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Preserving...' : 'Preserve my Story'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              key={review.id}
              className="space-y-6 pb-12 border-b border-gold/5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-[#eeebe7] overflow-hidden border border-gold/5 shrink-0">
                      {review.userPhoto ? (
                        <img src={review.userPhoto} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-mid/20 italic font-serif">
                          {review.userName.charAt(0)}
                        </div>
                      )}
                   </div>
                   <div>
                      <h4 className="font-serif italic text-lg text-dark">{review.userName}</h4>
                      <p className="text-[0.6rem] text-mid/30 uppercase tracking-widest">
                        {review.timestamp?.toDate().toLocaleDateString('en-IN', {
                           month: 'short',
                           year: 'numeric'
                        })}
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-2.5 h-2.5 ${review.rating >= s ? 'fill-gold text-gold' : 'text-gold/10'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-mid text-sm leading-relaxed font-light italic opacity-70">
                "{review.comment}"
              </p>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 py-24 text-center border border-dashed border-gold/10 rounded-sm">
            <p className="text-mid/40 font-serif italic text-lg">No shared narratives yet. Be the first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
