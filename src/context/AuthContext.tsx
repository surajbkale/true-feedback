"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";

interface AuthUser {
  firebaseUser: FirebaseUser;
  username: string | null;
  email: string | null;
}

interface AuthContextValue {
  authUser: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  authUser: null,
  loading: true,
});

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch the MongoDB profile to get the username
          const res = await api.get<{
            success: boolean;
            data: { username: string; email: string };
          }>("/api/auth/me");

          setAuthUser({
            firebaseUser,
            username: res.data.data.username ?? null,
            email: firebaseUser.email,
          });
        } catch {
          // Token valid but no MongoDB profile yet (mid-registration edge case)
          setAuthUser({ firebaseUser, username: null, email: firebaseUser.email });
        }
      } else {
        setAuthUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ authUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
