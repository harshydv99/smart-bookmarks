import { useState, useEffect, useCallback } from "react";
import { socket } from "@/lib/socket";

function emitWithAck(event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (response) => {
      if (!response?.ok) {
        reject(new Error(response?.error || "Socket request failed"));
        return;
      }
      resolve(response.data);
    });
  });
}

export function useBookmarks({ supabase, session }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!session) return;

    const { data, error: fetchError } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      if (
        fetchError.code === "42P01" ||
        fetchError.message?.includes("does not exist")
      ) {
        setSetupNeeded(true);
      } else {
        setError(fetchError.message);
      }
      return;
    }

    setBookmarks(data || []);
    setSetupNeeded(false);
  }, [session, supabase]);

  useEffect(() => {
    if (!session?.access_token) return;

    fetchBookmarks();

    const handleConnectError = (err) => {
      setError(err?.message || "Realtime connection failed");
    };

    const handleBookmarkAdded = (bookmark) => {
      setBookmarks((prev) => {
        if (prev.some((item) => item.id === bookmark.id)) return prev;
        return [bookmark, ...prev];
      });
    };

    const handleBookmarkDeleted = ({ id }) => {
      setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
    };

    socket.auth = { token: session.access_token };
    socket.connect();
    socket.on("connect_error", handleConnectError);
    socket.on("bookmark-added", handleBookmarkAdded);
    socket.on("bookmark-deleted", handleBookmarkDeleted);

    return () => {
      socket.off("connect_error", handleConnectError);
      socket.off("bookmark-added", handleBookmarkAdded);
      socket.off("bookmark-deleted", handleBookmarkDeleted);
      socket.disconnect();
    };
  }, [session, fetchBookmarks]);

  const addBookmark = async (e) => {
    e.preventDefault();
    if (!session || !url.trim() || !title.trim()) return;

    setAdding(true);
    setError(null);

    try {
      await emitWithAck("bookmark-added", {
        title: title.trim(),
        url: url.trim(),
      });
      setUrl("");
      setTitle("");
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const deleteBookmark = async (id) => {
    if (!session) return;
    setError(null);

    try {
      await emitWithAck("bookmark-deleted", { id });
    } catch (err) {
      setError(err.message);
    }
  };

  const resetBookmarksState = () => {
    setBookmarks([]);
    setSetupNeeded(false);
    setUrl("");
    setTitle("");
    setError(null);
  };

  return {
    bookmarks,
    url,
    setUrl,
    title,
    setTitle,
    error,
    adding,
    setupNeeded,
    fetchBookmarks,
    addBookmark,
    deleteBookmark,
    resetBookmarksState,
  };
}
