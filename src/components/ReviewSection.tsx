import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, User, ChevronDown } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Review } from '../types';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="mt-16 pt-16 border-t border-gold/10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="font-serif text-3xl text-dark mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${avgRating && parseFloat(avgRating) >= s ? 'fill-gold text-gold' : 'text-gold/20'}`}
                />
              ))}
            </div>
            <p className="text-sm text-mid">
              {avgRating ? `${avgRating} out of 5` : 'No reviews yet'}
              <span className="mx-2 opacity-30">|</span>
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!user) {
              // Usually we'd open the auth modal, but here we just alert or rely on UI
              alert("Please sign in to leave a review.");
              return;
            }
            setShowForm(!showForm);
          }}
          className="px-8 py-3 bg-white border border-gold/20 text-gold rounded-full text-[0.65rem] uppercase tracking-widest font-bold hover:bg-gold hover:text-white transition-all shadow-sm"
        >
          {showForm ? 'Cancel Review' : 'Write a Review'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-12"
          >
            <form 
              onSubmit={handleSubmit}
              className="bg-cream/20 border border-gold/10 rounded-2xl p-8"
            >
              <div className="mb-6 text-center">
                <p className="text-[0.65rem] uppercase tracking-widest font-bold text-mid mb-3">Rate your experience</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s)}
                      className="p-1 transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          (hoverRating || rating) >= s ? 'fill-gold text-gold' : 'text-gold/20'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[0.65rem] uppercase tracking-widest font-bold text-mid mb-2">Detailed Feedback</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked about this product..."
                  className="w-full p-4 bg-white border border-gold/10 rounded-xl outline-none focus:border-gold/30 transition-all font-serif italic text-sm min-h-[120px] resize-none"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-dark text-white rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-gold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Share My Review
                    </>
                  )}
                </button>
                <p className="text-[0.6rem] text-mid/60 text-center mt-4 italic">
                  * Thank you for your feedback! Your review will be visible immediately.
                </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              key={review.id}
              className="group"
            >
              <div className="flex gap-4 items-start">
                {review.userPhoto ? (
                  <img src={review.userPhoto} className="w-12 h-12 rounded-full border border-gold/10" alt={review.userName} />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center border border-gold/10">
                    <User className="w-6 h-6 text-gold/40" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-dark text-sm">{review.userName}</h4>
                      <p className="text-[0.65rem] text-mid uppercase tracking-widest">
                        {review.timestamp?.toDate().toLocaleDateString('en-IN', {
                           day: 'numeric',
                           month: 'long',
                           year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${review.rating >= s ? 'fill-gold text-gold' : 'text-gold/20'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-mid text-sm leading-relaxed font-serif italic">
                    "{review.comment}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-cream/5 rounded-3xl border border-dashed border-gold/10">
            <MessageSquare className="w-12 h-12 text-gold/20 mx-auto mb-4" />
            <p className="text-mid font-serif italic">Be the first to share your experience with this collection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
