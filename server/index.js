import http from "http";
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
const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: "*",
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

  socket.on("bookmark-added", async ({ title, url }, ack) => {
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

server.listen(PORT, () => {
  console.log(`🚀 Realtime server running on port ${PORT}`);
});