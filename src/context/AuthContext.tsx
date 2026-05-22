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

// Extended Better-Auth User Interface
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  username?: string;
  avatar?: string;
  bio?: string;
  role?: string;
  karma?: number;
  reputation?: number;
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
  const [user, setUserState] = useState<boolean>(false);
  const [userData, setUserDataState] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  // Retrieve active session from better-auth and alias to sessionData to avoid collisions
  const { data: sessionData } = authClient.useSession(); 

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sessionData) {
        setUserState(true);
        localStorage.setItem("isLoggedIn", "true");
        const dbUser = sessionData.user as unknown as ExtendedUser;
        if (dbUser) {
          setUserDataState({
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role || "member",
            avatar: dbUser.avatar || dbUser.image || 'https://avatar.iran.liara.run/public/boy?username=' + (dbUser.username || dbUser.name),
            reputation: typeof dbUser.reputation === 'number' ? dbUser.reputation : 342,
          });
        }
      } else if (mounted && sessionData === null) {
        setUserState(false);
        localStorage.setItem("isLoggedIn", "false");
        setUserDataState(null);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [sessionData, mounted]);

  useEffect(() => {
    const savedAuth = localStorage.getItem("isLoggedIn");
    const timer = setTimeout(() => {
      if (savedAuth !== null) {
        const isLoggedIn = savedAuth === "true";
        setUserState(isLoggedIn);
        if (isLoggedIn) {
          setUserDataState(userData);
        } else {
          setUserDataState(null);
        }
      } else {
        setUserState(false);
        setUserDataState(null);
      }
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const setUser = (val: boolean) => {
    setUserState(val);
    localStorage.setItem("isLoggedIn", String(val));
    if (val) {
      setUserDataState(userData);
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
    user: mounted ? user : false,
    setUser,
    userData: mounted ? userData : null,
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
