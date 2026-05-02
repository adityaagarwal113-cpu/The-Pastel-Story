import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name) throw new Error('Name is required');
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-dark/60 backdrop-blur-md z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-white z-[210] overflow-hidden rounded-[2.5rem] shadow-2xl"
          >
            <div className="relative p-8 sm:p-10">
              <button 
                onClick={onClose} 
                className="absolute top-8 right-8 text-mid hover:text-gold transition-colors bg-cream/50 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blush/20 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                  🌸
                </div>
                <h2 className="font-serif text-3xl text-dark mb-2 italic">
                  {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-light text-[0.65rem] tracking-[0.2em] uppercase">
                  {mode === 'signin' ? 'Sign in to your story' : 'Join the pastel story'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-500 text-[0.7rem] rounded-xl border border-red-100 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mid opacity-40" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-cream/30 border-transparent focus:bg-white focus:border-gold/30 rounded-2xl text-sm outline-none transition-all placeholder:text-mid/40"
                    />
                  </div>
                )}
                
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mid opacity-40" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-cream/30 border-transparent focus:bg-white focus:border-gold/30 rounded-2xl text-sm outline-none transition-all placeholder:text-mid/40"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mid opacity-40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-cream/30 border-transparent focus:bg-white focus:border-gold/30 rounded-2xl text-sm outline-none transition-all placeholder:text-mid/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-mid opacity-40 hover:opacity-100 hover:text-gold transition-all"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-dark text-white rounded-2xl font-bold text-[0.7rem] tracking-[0.2em] uppercase flex items-center justify-center gap-3 hover:bg-gold transition-all shadow-xl shadow-dark/10 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="my-8 flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-cream" />
                <span className="text-[0.6rem] text-mid uppercase tracking-[0.2em] opacity-40">or continue with</span>
                <div className="h-[1px] flex-1 bg-cream" />
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full py-4 bg-white border border-cream rounded-2xl font-bold text-[0.65rem] tracking-[0.2em] uppercase flex items-center justify-center gap-4 hover:bg-cream transition-all"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                Google Account
              </button>

              <div className="mt-10 text-center">
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-[0.65rem] text-mid hover:text-gold transition-colors tracking-widest uppercase font-bold"
                >
                  {mode === 'signin' ? "Don't have an account? Create one" : "Already a customer? Sign in"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
