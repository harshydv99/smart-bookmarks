"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/button";
import { signInWithGoogle } from "@/lib/auth";
import {
  Card,
  CardContent,
} from "@/components/card";
import {
  Bookmark,
  Loader2,
  Shield,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default function Home() {
  const router = useRouter();
  const [supabase] = useState(() => getSupabase());
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    await signInWithGoogle({ supabase, setError });
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!loading && session) {
      router.replace("/dashboard");
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LandingPage onSignIn={handleSignIn} error={error} />;
  }

  return null;
}

// ─── Landing Page ────────────────────────────────────────────────────

function LandingPage({ onSignIn, error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Bookmark className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              Smart Bookmarks
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Save, organize, and sync your bookmarks in real-time across all
              your browser tabs.
            </p>
          </div>

          {/* Sign In Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 px-8">
              <Button
                onClick={onSignIn}
                size="lg"
                className="w-full gap-3 text-base h-14 rounded-xl font-medium"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#fff"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#fff"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fff"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#fff"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
              {error && (
                <p className="text-sm text-destructive mt-4 text-center">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Real-time Sync
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Private & Secure
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Cross-tab
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center p-4 text-xs text-muted-foreground">
        Powered by Supabase & Next.js
      </footer>
    </div>
  );
}
