"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  const handleSocialSignIn = async (provider: "google" | "github") => {
    setGlobalError("");
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `Failed to sign in with ${provider}.`;
      setGlobalError(message);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-(--background) text-(--foreground) px-4 overflow-hidden py-16 transition-colors duration-300">
      {/* Ambient Chai Glow Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-linear-to-b from-[#D97706]/15 to-transparent rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-linear-to-t from-[#F59E0B]/10 to-transparent rounded-full filter blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-(--card-background)/80 backdrop-blur-xl border border-(--card-border) shadow-2xl rounded-2xl p-8 sm:p-10 transition-all duration-300 hover:border-(--input-focus-border)/50">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-(--input-bg) border border-(--input-border) text-(--link-color) mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
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
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-(--foreground) via-(--foreground) to-(--link-color) bg-clip-text text-transparent">
            Chai Charcha
          </h1>
          <p className="text-(--text-secondary) text-sm mt-2">
            Brew code, share thoughts, & spark discussions.
          </p>
        </div>

        {/* Subtitle */}
        <h2 className="text-xl font-bold text-center text-(--foreground) mb-6">
          Create your account
        </h2>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSocialSignIn("google")}
            className="flex items-center justify-center py-2.5 px-4 rounded-xl border border-(--input-border) bg-(--input-bg) hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) hover:border-(--input-focus-border) transition-all duration-200 font-medium text-sm cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignIn("github")}
            className="flex items-center justify-center py-2.5 px-4 rounded-xl border border-(--input-border) bg-(--input-bg) hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) hover:border-(--input-focus-border) transition-all duration-200 font-medium text-sm cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2 text-(--foreground)" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-(--card-border)"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-(--card-background) px-2 text-(--text-secondary)">
              Or continue with
            </span>
          </div>
        </div>

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
            <label className="block text-xs font-semibold uppercase tracking-wider text-(--text-secondary) mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-(--text-secondary)/70">
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
                className={`w-full pl-10 pr-4 py-3 bg-(--input-bg) border ${errors.name ? "border-red-500" : "border-(--input-border)"} rounded-xl text-(--foreground) placeholder-(--text-secondary)/50 focus:outline-none focus:border-(--input-focus-border) focus:ring-2 focus:ring-(--input-focus-ring) focus:bg-(--input-focus-bg) transition-all duration-200`}
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-(--text-secondary) mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-(--text-secondary)/70">
                <span className="text-sm font-semibold select-none">@</span>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className={`w-full pl-8 pr-4 py-3 bg-(--input-bg) border ${errors.username ? "border-red-500" : "border-(--input-border)"} rounded-xl text-(--foreground) placeholder-(--text-secondary)/50 focus:outline-none focus:border-(--input-focus-border) focus:ring-2 focus:ring-(--input-focus-ring) focus:bg-(--input-focus-bg) transition-all duration-200`}
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-(--text-secondary) mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-(--text-secondary)/70">
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
                className={`w-full pl-10 pr-4 py-3 bg-(--input-bg) border ${errors.email ? "border-red-500" : "border-(--input-border)"} rounded-xl text-(--foreground) placeholder-(--text-secondary)/50 focus:outline-none focus:border-(--input-focus-border) focus:ring-2 focus:ring-(--input-focus-ring) focus:bg-(--input-focus-bg) transition-all duration-200`}
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-(--text-secondary) mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-(--text-secondary)/70">
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
                className={`w-full pl-10 pr-10 py-3 bg-(--input-bg) border ${errors.password ? "border-red-500" : "border-(--input-border)"} rounded-xl text-(--foreground) placeholder-(--text-secondary)/50 focus:outline-none focus:border-(--input-focus-border) focus:ring-2 focus:ring-(--input-focus-ring) focus:bg-(--input-focus-bg) transition-all duration-200`}
              />
              {/* Toggle Visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-(--text-secondary)/70 hover:text-(--foreground) transition-colors"
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
            className={`w-full py-3.5 px-4 bg-linear-to-r from-[#D97706] to-[#F59E0B] hover:from-[#B45309] hover:to-[#D97706] text-white font-bold rounded-xl shadow-lg transition-all duration-300 transform active:scale-[0.98] ${loading ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]"}`}
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
        <div className="mt-8 text-center text-sm text-(--text-secondary) border-t border-(--card-border) pt-6">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="text-(--link-color) hover:text-(--link-hover-color) font-semibold transition-colors duration-200"
          >
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
