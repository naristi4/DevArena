"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const { t } = useLanguage();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t.auth.invalidCredentials);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-dark px-4">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Main login card */}
      <div className="relative z-10 w-full max-w-md">

        {/* Logo section */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center p-2.5 rounded-xl bg-primary shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white" style={{ fontSize: "30px" }}>
                rocket_launch
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">DevArena</h1>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">{t.auth.welcome}</h2>
            <p className="text-slate-400 text-sm">{t.auth.subtitle}</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 ml-1">
                {t.auth.email}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-xl">
                    mail
                  </span>
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-4 py-3 bg-background-dark border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="text-sm font-semibold text-slate-300">
                  {t.auth.password}
                </label>
                <a href="#" className="text-xs font-semibold text-primary hover:underline">
                  {t.auth.forgotPassword}
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-xl">
                    lock
                  </span>
                </div>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-12 py-3 bg-background-dark border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-primary focus:ring-primary/50 bg-background-dark accent-primary"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400 font-medium">
                {t.auth.remember}
              </label>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
                {error}
              </p>
            )}

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary/90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-lg shadow-primary/25"
            >
              {loading ? t.auth.signingIn : t.auth.signIn}
              {!loading && (
                <span className="absolute right-4 flex items-center transition-transform group-hover:translate-x-1">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              )}
            </button>
          </form>

          {/* Social login divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-[#1a172e] text-slate-500 font-medium tracking-wider">
                  {t.auth.orContinueWith}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              {/* Google — decorative */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                </svg>
                {t.auth.google}
              </button>

              {/* GitHub — decorative */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                {t.auth.github}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-500">
          {t.auth.noAccount}{" "}
          <a href="#" className="font-bold text-primary hover:underline">
            {t.auth.joinSquad}
          </a>
        </p>

      </div>

      {/* Powered by Melonn watermark */}
      <div className="fixed bottom-10 right-10 flex items-center gap-2 opacity-50 select-none pointer-events-none">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
          Powered by Melonn
        </span>
      </div>
    </div>
  );
}
