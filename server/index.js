import http from "http";
import express from "express";
import { Server } from "socket.io";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseservicerolekey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseservicerolekey) {
  throw new Error("Missing Supabase env vars for websocket server");
}

const PORT = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://smart-bookmarks-harshydv99.vercel.app, https://smart-bookmarks.onrender.com, http://localhost:3000",
  },
});

const supabase = createClient(supabaseUrl, supabaseservicerolekey);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      next(new Error("Missing auth token"));
      return;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      next(new Error("Unauthorized"));
      return;
    }

    socket.data.userId = user.id;
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  socket.join(userId);
  console.log(`✅ Client connected: ${socket.data.userId}`);

  socket.on("bookmark-added", async ({ title, url }, ack) => {
    console.log(`Received add request for bookmark "${title}" from user ${userId}`);
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ title, url, user_id: userId })
      .select()
      .single();

    if (error || !data) {
      ack?.({ ok: false, error: error?.message || "Failed to add bookmark" });
      return;
    }

    io.to(userId).emit("bookmark-added", data);
    ack?.({ ok: true, data });
  });

  socket.on("bookmark-deleted", async ({ id }, ack) => {
    console.log(`Received delete request for bookmark ${id} from user ${userId}`);
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      ack?.({ ok: false, error: error.message || "Failed to delete bookmark" });
      return;
    }

    io.to(userId).emit("bookmark-deleted", { id });
    ack?.({ ok: true, data: { id } });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("OK");
});

server.listen(PORT, () => {
  console.log(`🚀 Realtime server running on port ${PORT}`);
});
