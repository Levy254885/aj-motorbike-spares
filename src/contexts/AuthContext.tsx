import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import type { AppUser, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  firebaseReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isCashier: boolean;
  isStorekeeper: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * If the login user has no row in Firestore "users", create one automatically.
 * First user in the system becomes ADMIN. Shop owner email always ADMIN.
 */
async function ensureUserProfile(firebaseUser: User): Promise<AppUser> {
  if (!db) throw new Error('Firestore is not configured');

  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { uid: firebaseUser.uid, ...snap.data() } as AppUser;
  }

  const email = (firebaseUser.email || '').toLowerCase();
  let role: UserRole = 'ADMIN';

  try {
    const existing = await getDocs(query(collection(db, 'users'), limit(1)));
    if (!existing.empty) {
      // Later staff accounts default to CASHIER unless they are the shop owner email
      role = email === 'levybatanga@gmail.com' ? 'ADMIN' : 'CASHIER';
    }
  } catch {
    // If we cannot list users yet, still create this profile as ADMIN for single-shop setup
    role = 'ADMIN';
  }

  if (email === 'levybatanga@gmail.com') {
    role = 'ADMIN';
  }

  const now = new Date().toISOString();
  const profile = {
    email: firebaseUser.email || '',
    displayName:
      firebaseUser.displayName ||
      (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
    role,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, profile);
  return { uid: firebaseUser.uid, ...profile } as AppUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const firebaseReady = isFirebaseConfigured && !!auth && !!db;

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser && db) {
        try {
          const profile = await ensureUserProfile(firebaseUser);
          setAppUser(profile);
        } catch (err) {
          console.error('Failed to load or create user profile:', err);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [firebaseReady]);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setAppUser(null);
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase is not configured');
    await sendPasswordResetEmail(auth, email);
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!appUser) return false;
    return roles.includes(appUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        loading,
        firebaseReady,
        login,
        logout,
        resetPassword,
        hasRole,
        isAdmin: appUser?.role === 'ADMIN',
        isCashier: appUser?.role === 'CASHIER',
        isStorekeeper: appUser?.role === 'STOREKEEPER',
        isManager: appUser?.role === 'MANAGER' || appUser?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
