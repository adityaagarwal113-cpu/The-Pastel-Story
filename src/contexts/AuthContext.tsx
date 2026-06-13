import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem('guest_user');
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userDocRef);

          if (!userSnap.exists()) {
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              createdAt: serverTimestamp(),
            });
          }
        } catch (error) {
          console.warn('Setting user profile doc failed on Firestore.', error);
          try {
            handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
          } catch (e) {
            // Logged to console but not crash auth context setup
          }
        }
        setUser(firebaseUser);
      } else {
        const storedGuest = localStorage.getItem('guest_user');
        if (storedGuest) {
          try {
            setUser(JSON.parse(storedGuest));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Ensure we explicitly catch popup block or domain issues
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      console.log('Current Hostname:', window.location.hostname);
      
      if (error.code === 'auth/unauthorized-domain') {
        alert(
          `Domain Unauthorized: Firebase doesn't recognize "${window.location.hostname}". \n\n` +
          `If you've already added this to Authorized Domains, please wait 2-3 minutes for Firebase to propagate. \n\n` +
          `On mobile, also ensure you don't have "Prevent Cross-Site Tracking" or "Block All Cookies" enabled in your browser settings.`
        );
      } else if (error.code === 'auth/popup-closed-by-user') {
        // Normal behavior
      } else {
        alert(`Login Error: ${error.message}`);
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
      
      // Create firestore doc immediately for profile
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: name,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users/signup');
    }
  };

  const signInAsGuest = async () => {
    const guestUser = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: 'guest@pastelstory.com',
      displayName: 'Pastel Guest',
      photoURL: null,
      isAnonymous: true,
    } as any;
    localStorage.setItem('guest_user', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const logout = async () => {
    localStorage.removeItem('guest_user');
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
