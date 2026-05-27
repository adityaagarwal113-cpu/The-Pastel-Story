import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';
import { fetchBlogPosts, getAssetUrl, BlogPost } from '../lib/contentful';
import { Entry } from 'contentful';
import { Footer } from '../components/Footer';

interface BlogListProps {
  setView: (view: any) => void;
  siteConfig: any;
}

export function BlogList({ setView, siteConfig }: BlogListProps) {
  const [blogs, setBlogs] = useState<Entry<BlogPost>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    const posts = await fetchBlogPosts(50);
    setBlogs(posts);
    setLoading(false);
  };

  const categories = ['all', ...new Set(blogs.map(b => b.fields.category))];
  const filteredBlogs = selectedCategory === 'all'
    ? blogs
    : blogs.filter(b => b.fields.category === selectedCategory);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <>
      <Helmet>
        <title>Fashion Blog - Style Guides & Trends | The Pastel Story</title>
        <meta name="description" content="Explore our fashion blog for style guides, trend reports, and inspiration. Discover how to style pastel silhouettes and create your perfect wardrobe." />
        <meta name="keywords" content="fashion blog, style guide, pastel fashion trends, Indian fashion, boutique style, wardrobe tips" />
        <link rel="canonical" href="https://thepastelstory.in/#blog" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Fashion Blog - Style Guides & Trends | The Pastel Story" />
        <meta property="og:description" content="Explore fashion inspiration and styling tips from The Pastel Story." />
      </Helmet>

      <div className="bg-[#faf8f6] min-h-screen pt-24">
        <header className="max-w-[1400px] mx-auto px-6 sm:px-12 pt-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="text-micro text-gold mb-4 block">Style Stories</span>
            <h1 className="font-serif text-5xl sm:text-7xl text-dark mb-6 tracking-tight italic">
              Fashion <span className="text-gold-d not-italic">Insights</span>
            </h1>
            <p className="text-mid text-sm tracking-widest max-w-2xl mx-auto opacity-60">
              Discover styling tips, trend reports, and the stories behind our handpicked collections
            </p>
          </motion.div>
        </header>

        {/* Category Filter */}
        <div className="sticky top-20 z-30 bg-white/60 backdrop-blur-xl border-y border-gold/10 py-6 px-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-wrap items-center gap-4 justify-center">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 text-[0.65rem] uppercase tracking-widest font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-dark text-white'
                      : 'bg-cream text-mid border border-gold/10 hover:border-gold'
                  }`}
                >
                  {cat === 'all' ? 'All Stories' : cat.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-16">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredBlogs.map((blog, index) => {
                const imageUrl = getAssetUrl(blog.fields.featuredImage);

                return (
                  <motion.article
                    key={blog.sys.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer"
                  >
                    {imageUrl && (
                      <div className="aspect-[16/10] overflow-hidden mb-6 bg-[#eeebe7]">
                        <img
                          src={imageUrl}
                          alt={blog.fields.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-micro text-mid/60">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(blog.fields.publishedAt || blog.sys.createdAt)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Tag className="w-3 h-3" />
                          {blog.fields.category.replace('-', ' ')}
                        </span>
                      </div>

                      <h2 className="font-serif text-2xl text-dark leading-tight group-hover:text-gold transition-colors">
                        {blog.fields.title}
                      </h2>

                      {blog.fields.excerpt && (
                        <p className="text-sm text-mid leading-relaxed line-clamp-3">
                          {blog.fields.excerpt}
                        </p>
                      )}

                      {blog.fields.tags && blog.fields.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {blog.fields.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-[0.6rem] px-3 py-1 bg-gold/10 text-gold rounded-full uppercase tracking-wider"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gold text-micro font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
                        <span>Read More</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

          {!loading && filteredBlogs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-mid opacity-60">No blog posts found in this category.</p>
            </div>
          )}
        </div>

        <Footer setView={setView} siteConfig={siteConfig} />
      </div>
    </>
  );
}
