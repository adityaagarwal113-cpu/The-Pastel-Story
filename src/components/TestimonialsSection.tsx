import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { fetchTestimonials, Testimonial } from '../lib/contentful';
import { Entry } from 'contentful';

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Entry<Testimonial>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonialsData();
  }, []);

  const fetchTestimonialsData = async () => {
    const data = await fetchTestimonials(true);
    setTestimonials(data);
    setLoading(false);
  };

  if (loading || testimonials.length === 0) return null;

  return (
    <section className="py-24 px-6 sm:px-12 bg-white/40">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-micro text-gold mb-4 block">Customer Love</span>
          <h2 className="font-serif text-5xl text-dark italic">
            Stories from <span className="text-gold-d not-italic">Our Clients</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <motion.div
              key={testimonial.sys.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#faf8f6] p-8 border border-gold/10 hover:luxury-shadow transition-all"
            >
              <Quote className="w-8 h-8 text-gold/20 mb-4" />

              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.fields.rating ? 'fill-gold text-gold' : 'text-gold/20'
                    }`}
                  />
                ))}
              </div>

              <p className="text-mid text-sm leading-relaxed mb-6 italic">
                "{testimonial.fields.reviewText}"
              </p>

              <div className="pt-4 border-t border-gold/10">
                <p className="font-bold text-dark text-sm">{testimonial.fields.customerName}</p>
                {testimonial.fields.customerLocation && (
                  <p className="text-micro text-mid/60">{testimonial.fields.customerLocation}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
