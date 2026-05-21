"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

// User Profile Interface
export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
  reputation: number;
}

// Auth Context Type
interface AuthContextType {
  user: boolean;
  setUser: (val: boolean) => void;
  userData: UserProfile | null;
  login: () => void;
  logout: () => void;
  handelSignOut: () => Promise<void>;
}

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Defining states to access across all components
  const [user, setUserState] = useState<boolean>(true);
  const [userData, setUserDataState] = useState<UserProfile | null>({
    name: "Aarav Dev",
    email: "chai_lover@dev.in",
    role: "Full Stack Engineer",
    avatar: "AD",
    reputation: 342,
  });
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const savedAuth = localStorage.getItem("isLoggedIn");
    const timer = setTimeout(() => {
      if (savedAuth !== null) {
        const isLoggedIn = savedAuth === "true";
        setUserState(isLoggedIn);
        if (isLoggedIn) {
          setUserDataState({
            name: "Aarav Dev",
            email: "chai_lover@dev.in",
            role: "Full Stack Engineer",
            avatar: "AD",
            reputation: 342,
          });
        } else {
          setUserDataState(null);
        }
      }
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const setUser = (val: boolean) => {
    setUserState(val);
    localStorage.setItem("isLoggedIn", String(val));
    if (val) {
      setUserDataState({
        name: "Aarav Dev",
        email: "chai_lover@dev.in",
        role: "Full Stack Engineer",
        avatar: "AD",
        reputation: 342,
      });
    } else {
      setUserDataState(null);
    }
  };

  const login = () => setUser(true);
  const logout = () => setUser(false);

  const handelSignOut = async () => {
    try {
      await authClient.signOut();
      setUser(false);
      setUserDataState(null);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Values to be provided to the context
  const value = {
    user: mounted ? user : true,
    setUser,
    userData,
    login,
    logout,
    handelSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
