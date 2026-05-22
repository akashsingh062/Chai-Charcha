"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/context/AuthContext";
import { signupSchema } from "@/lib/Schemas/signupSchema";

export default function SignUpPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const { userData } = useAuth();
  useEffect(() => {
    if (userData) {
      redirect("/");
    }
  }, [userData, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    // 1. Client-Side validation via our robust Zod Schema
    const validation = signupSchema.safeParse({
      name,
      username,
      email,
      password,
    });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      // 2. Register via better-auth client SDK
      await authClient.signUp.email(
        {
          email,
          password,
          name,
          username, // Pass custom fields if configured, fallback schema populates avatar automatically
          image: `https://api.dicebear.com/6.x/avataaars/svg?seed=${username}`,
          avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${username}`,
          bio: "",
          role: "member",
          karma: 0,
          joinedCommunities: [],
          callbackURL: "/",
        } as unknown as Parameters<typeof authClient.signUp.email>[0],
        {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: () => {
            setLoading(false);
            login();
            router.push("/");
            router.refresh();
          },
          onError: (ctx) => {
            setLoading(false);
            setGlobalError(
              ctx.error.message ||
                "An unexpected error occurred during signup.",
            );
          },
        },
      );
    } catch (err: unknown) {
      setLoading(false);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setGlobalError(message);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[var(--background)] text-[var(--foreground)] px-4 overflow-hidden py-16 transition-colors duration-300">
      {/* Ambient Chai Glow Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-linear-to-b from-[#D97706]/15 to-transparent rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-linear-to-t from-[#F59E0B]/10 to-transparent rounded-full filter blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-[var(--card-background)]/80 backdrop-blur-xl border border-[var(--card-border)] shadow-2xl rounded-2xl p-8 sm:p-10 transition-all duration-300 hover:border-[var(--input-focus-border)]/50">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--link-color)] mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
            {/* Steaming Chai Cup SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"
              />
              <path strokeLinecap="round" d="M9 1v2M12 1v2M15 1v2" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--link-color)] bg-clip-text text-transparent">
            Chai Charcha
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2">
            Brew code, share thoughts, & spark discussions.
          </p>
        </div>

        {/* Subtitle */}
        <h2 className="text-xl font-bold text-center text-[var(--foreground)] mb-6">
          Create your account
        </h2>

        {/* Global Error Banner */}
        {globalError && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-950/50 border border-red-500/30 text-red-200 rounded-lg text-sm transition-all duration-300 animate-shake">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 shrink-0 text-red-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]/70">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Full Name"
                className={`w-full pl-10 pr-4 py-3 bg-[var(--input-bg)] border ${errors.name ? "border-red-500" : "border-[var(--input-border)]"} rounded-xl text-[var(--foreground)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] focus:bg-[var(--input-focus-bg)] transition-all duration-200`}
              />
            </div>
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">
                {errors.name}
              </p>
            )}
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]/70">
                <span className="text-sm font-semibold select-none">@</span>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className={`w-full pl-8 pr-4 py-3 bg-[var(--input-bg)] border ${errors.username ? "border-red-500" : "border-[var(--input-border)]"} rounded-xl text-[var(--foreground)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] focus:bg-[var(--input-focus-bg)] transition-all duration-200`}
              />
            </div>
            {errors.username && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">
                {errors.username}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]/70">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email"
                className={`w-full pl-10 pr-4 py-3 bg-[var(--input-bg)] border ${errors.email ? "border-red-500" : "border-[var(--input-border)]"} rounded-xl text-[var(--foreground)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] focus:bg-[var(--input-focus-bg)] transition-all duration-200`}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]/70">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-3 bg-[var(--input-bg)] border ${errors.password ? "border-red-500" : "border-[var(--input-border)]"} rounded-xl text-[var(--foreground)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] focus:bg-[var(--input-focus-bg)] transition-all duration-200`}
              />
              {/* Toggle Visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)]/70 hover:text-[var(--foreground)] transition-colors"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 bg-gradient-to-r from-[#D97706] to-[#F59E0B] hover:from-[#B45309] hover:to-[#D97706] text-white font-bold rounded-xl shadow-lg transition-all duration-300 transform active:scale-[0.98] ${loading ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]"}`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Simmering your account...</span>
              </div>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Footer Switcher */}
        <div className="mt-8 text-center text-sm text-[var(--text-secondary)] border-t border-[var(--card-border)] pt-6">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-[var(--link-color)] hover:text-[var(--link-hover-color)] font-semibold transition-colors duration-200"
          >
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
