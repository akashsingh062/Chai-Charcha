"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/context/AuthContext";
import { loginSchema } from "@/lib/Schemas/loginSchema";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    // Validate using Zod schema
    const validation = loginSchema.safeParse({ identifier, password });
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
      await authClient.signIn.email(
        {
          email: identifier,
          password,
          callbackURL: "/admin",
        },
        {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: async () => {
            const session = await authClient.getSession();
            const role = session?.data?.user?.role;
            if (role !== "admin" && role !== "moderator") {
              await authClient.signOut();
              setLoading(false);
              setGlobalError("Access Denied — Moderator or Admin access required");
              return;
            }
            setLoading(false);
            login();
            router.push("/admin");
            router.refresh();
          },
          onError: (ctx) => {
            setLoading(false);
            setGlobalError(
              ctx.error.message || "Invalid credentials. Please verify your details."
            );
          },
        }
      );
    } catch (err: unknown) {
      setLoading(false);
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setGlobalError(message);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-ink-black text-floral-white px-4 py-16 overflow-hidden">
      {/* Ambient Glow Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-linear-to-b from-stormy-teal/15 to-transparent rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-linear-to-t from-vivid-tangerine/10 to-transparent rounded-full filter blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-ink-black/80 backdrop-blur-xl border border-stormy-teal/20 shadow-2xl rounded-2xl p-8 sm:p-10 transition-all hover:border-vivid-tangerine/30">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-stormy-teal/20 text-vivid-tangerine mb-4 shadow-[0_0_15px_rgba(255,125,0,0.2)]">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-floral-white via-floral-white to-vivid-tangerine bg-clip-text text-transparent uppercase">
            Chai Charcha
          </h1>
          <p className="text-dust-grey text-xs mt-2 font-bold uppercase tracking-widest">
            Control Panel Authentication
          </p>
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-950/50 border border-red-500/30 text-red-200 rounded-lg text-xs font-semibold animate-shake">
            <svg
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
          {/* Email or Username Input */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stormy-teal mb-2">
              Email or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dust-grey/70">
                <svg
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
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@domain.com or username"
                className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${
                  errors.identifier ? "border-red-500" : "border-stormy-teal/20"
                } rounded-xl text-floral-white placeholder-dust-grey/50 focus:outline-none focus:border-vivid-tangerine focus:ring-2 focus:ring-vivid-tangerine/15 transition-all`}
              />
            </div>
            {errors.identifier && (
              <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.identifier}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stormy-teal mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dust-grey/70">
                <svg
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
                className={`w-full pl-10 pr-10 py-3 bg-white/5 border ${
                  errors.password ? "border-red-500" : "border-stormy-teal/20"
                } rounded-xl text-floral-white placeholder-dust-grey/50 focus:outline-none focus:border-vivid-tangerine focus:ring-2 focus:ring-vivid-tangerine/15 transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-dust-grey/75 hover:text-floral-white transition-colors"
              >
                {showPassword ? (
                  <svg
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
              <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-linear-to-r from-spicy-paprika to-vivid-tangerine hover:from-spicy-paprika/80 hover:to-vivid-tangerine/80 text-floral-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider text-xs"
          >
            {loading ? "Authenticating Admin..." : "Authenticate Session"}
          </button>
        </form>
      </div>
    </div>
  );
}
