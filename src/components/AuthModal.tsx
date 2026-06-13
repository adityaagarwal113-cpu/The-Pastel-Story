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
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest } = useAuth();
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

  const handleGuestSignIn = async () => {
    try {
      setIsLoading(true);
      await signInAsGuest();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during guest authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const getFriendlyErrorMessage = (errorString: string | null) => {
    if (!errorString) return null;
    
    let mainError = errorString;
    try {
      const startIdx = errorString.indexOf('{');
      const endIdx = errorString.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonCandidate = errorString.substring(startIdx, endIdx + 1);
        const parsed = JSON.parse(jsonCandidate);
        if (parsed.error) {
          mainError = parsed.error;
        }
      }
    } catch (e) {
      // Ignore
    }

    if (errorString.includes('auth/network-request-failed') || mainError.includes('auth/network-request-failed')) {
      return {
        title: 'Connection Security Block',
        desc: 'Unable to connect to authentication servers. On Windows 7, this is due to expired operating system security certificates. On mobiles, it can be due to third-party cookie/popup tracking restrictions. You can use Guest Login to bypass this instantly!',
        points: [
          'Windows 7 fix: Use Firefox browser which has its own built-in certificated store.',
          'Mobile/Tablet fix: Open the preview directly as a full tab by clicking "Open in a new tab" at the top right.',
          'Bypass Fix: Click the "Login as Guest (Bypass Error)" button below to enter the shop instantly!'
        ],
        isNetwork: true
      };
    }

    if (errorString.includes('auth/unauthorized-domain') || mainError.includes('auth/unauthorized-domain')) {
      return {
        title: 'Unauthorized Domain',
        desc: `Firebase authentication does not recognize this browser domain yet (${window.location.hostname}). Please add this domain under Firebase Console -> Authentication -> Authorized Domains and wait 2 minutes.`
      };
    }

    if (errorString.includes('auth/email-already-in-use') || mainError.includes('auth/email-already-in-use')) {
      return {
        title: 'Account Already Exists',
        desc: 'This email is already associated with an account. Try signing in directly.'
      };
    }

    if (errorString.includes('auth/weak-password') || mainError.includes('auth/weak-password')) {
      return {
        title: 'Weak Password',
        desc: 'Your password should be at least 6 characters long.'
      };
    }

    if (
      errorString.includes('auth/invalid-credential') || mainError.includes('auth/invalid-credential') ||
      errorString.includes('auth/user-not-found') || mainError.includes('auth/user-not-found') ||
      errorString.includes('auth/wrong-password') || mainError.includes('auth/wrong-password')
    ) {
      return {
        title: 'Invalid Credentials',
        desc: 'The email address or password provided is incorrect. Please double check and try again.'
      };
    }

    return {
      title: 'Authentication Update',
      desc: mainError.replace('Firebase: ', '')
    };
  };

  const friendlyError = getFriendlyErrorMessage(error);

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-white z-[210] overflow-y-auto max-h-[90vh] rounded-[2.5rem] shadow-2xl"
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

              {friendlyError && (
                <div className="mb-6 p-4 bg-red-50/80 text-red-800 rounded-2xl border border-red-100 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[0.75rem] uppercase tracking-wider text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    {friendlyError.title}
                  </div>
                  <p className="text-[0.7rem] sm:text-[0.75rem] text-red-700/90 leading-relaxed">
                    {friendlyError.desc}
                  </p>
                  {friendlyError.points && (
                    <ul className="mt-2 text-[0.65rem] text-red-800 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
                      {friendlyError.points.map((pt, idx) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  )}
                  {friendlyError.isNetwork && (
                    <button
                      type="button"
                      onClick={handleGuestSignIn}
                      className="mt-3 w-full py-2.5 bg-red-800 text-white hover:bg-black rounded-xl text-center text-[0.65rem] tracking-[0.2em] font-bold uppercase transition-all shadow-md"
                    >
                      Login as Guest (Bypass Error)
                    </button>
                  )}
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

              <div className="space-y-3">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full py-4 bg-white border border-cream rounded-2xl font-bold text-[0.65rem] tracking-[0.2em] uppercase flex items-center justify-center gap-4 hover:bg-cream transition-all"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" loading="lazy" decoding="async" />
                  Google Account
                </button>

                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  className="w-full py-4 bg-cream/30 hover:bg-gold hover:text-white text-gold border border-gold/10 rounded-2xl font-bold text-[0.65rem] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all shadow-sm"
                >
                  <span>🌸</span> Continue as Guest (Bypass Login)
                </button>
              </div>

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
