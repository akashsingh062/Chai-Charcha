"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
}

// Auth Context 
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

  // Defining states to access across all components
  const [user, setUserState] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedAuth = localStorage.getItem("isLoggedIn");
    const timer = setTimeout(() => {
      if (savedAuth !== null) {
        setUserState(savedAuth === "true");
      }
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const setUser = (val: boolean) => {
    setUserState(val);
    localStorage.setItem("isLoggedIn", String(val));
  };

  const login = () => setUser(true);
  const logout = () => setUser(false);

  const userData: UserProfile | null = user ? {
    name: "Aarav Dev",
    email: "chai_lover@dev.in",
    role: "Full Stack Engineer",
    avatar: "AD",
    reputation: 342,
  } : null;

  // Values to be provided to the context
  const value = {
    user: mounted ? user : true,
    setUser,
    userData,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



// Export hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
