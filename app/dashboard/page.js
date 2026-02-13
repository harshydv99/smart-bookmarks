"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { signOut } from "@/lib/auth";
import { useBookmarks } from "@/lib/bookmarks";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import {
  Bookmark,
  ExternalLink,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    bookmarks,
    url,
    setUrl,
    title,
    setTitle,
    error,
    adding,
    setupNeeded,
    addBookmark,
    deleteBookmark,
    resetBookmarksState,
  } = useBookmarks({ supabase, session });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
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
      setUser(nextSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await signOut({ supabase });
    resetBookmarksState();
    setSession(null);
    setUser(null);
    router.replace("/");
  };

  const [showUnauthorized, setShowUnauthorized] = useState(false);

  useEffect(() => {
    if (loading || session) {
      setShowUnauthorized(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowUnauthorized(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [loading, session]);

  useEffect(() => {
    if (!showUnauthorized) return;
    const timer = setTimeout(() => {
      router.replace("/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [showUnauthorized, router]);

  if (loading || (!session && !showUnauthorized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Checking authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <Card className="w-full max-w-md border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Not Authorized</CardTitle>
            <CardDescription className="text-amber-700">
              You are not logged in. Redirecting to home...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting in 3 seconds
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.replace("/")}
                className="ml-2"
              >
                Go Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Bookmark className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold">Smart Bookmarks</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user?.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full ring-2 ring-primary/10"
                />
              )}
              <span className="text-sm text-muted-foreground hidden sm:inline font-medium">
                {user?.user_metadata?.full_name || user?.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 mt-2">
        <Card className="shadow-sm border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Bookmark
            </CardTitle>
            <CardDescription>
              Save a new bookmark to your private collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={addBookmark}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Input
                type="text"
                placeholder="Bookmark title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="flex-1 h-11"
              />
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="flex-1 h-11"
              />
              <Button
                type="submit"
                disabled={adding}
                className="gap-2 h-11 px-6"
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              Your Bookmarks
            </h2>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bookmark className="h-16 w-16 mb-4 opacity-15" />
                <p className="text-xl font-medium mb-1">No bookmarks yet</p>
                <p className="text-sm">
                  Add your first bookmark above to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((bookmark) => (
                <Card
                  key={bookmark.id}
                  className="group hover:shadow-md transition-all duration-200 border-0 shadow-sm"
                >
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="font-semibold text-foreground truncate">
                        {bookmark.title}
                      </h3>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary truncate flex items-center gap-1.5 mt-1 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{bookmark.url}</span>
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {new Date(bookmark.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBookmark(bookmark.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
