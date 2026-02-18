"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {

  // ================== STATES ==================
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ================== AUTH STATE ==================

useEffect(() => {
  const handleOAuthRedirect = async () => {
    const hash = window.location.hash;

    if (hash && hash.includes("access_token")) {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (!error) {
        window.location.hash = "";
      }
    }
  };

  handleOAuthRedirect();
}, []);





  useEffect(() => {
  const initAuth = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log("Session error:", error);
      return;
    }

    if (data.session) {
      setUser(data.session.user);
    }
  };

  initAuth();

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null);
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);


  // ================== LOAD DATA ==================
  useEffect(() => {
    if (!user) return;

    fetchBookmarks();
    fetchFolders();
  }, [user]);

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  const fetchFolders = async () => {
    const { data } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id);

    setFolders(data || []);
  };

  // ================== AUTH FUNCTIONS ==================
  const handleEmailLogin = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  };

  const handleSignup = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) alert(error.message);
  };

  const handleGoogleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
};


  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ================== BOOKMARK ==================
  const addBookmark = async () => {
    if (!url || !user) return;

    let finalTitle = title || new URL(url).hostname.replace("www.", "");

    await supabase.from("bookmarks").insert([
      {
        title: finalTitle,
        url,
        user_id: user.id,
        folder_id: selectedFolder,
      },
    ]);

    setTitle("");
    setUrl("");
    fetchBookmarks();
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    fetchBookmarks();
  };

  // ================== FOLDER ==================
  const addFolder = async () => {
    if (!newFolder || !user) return;

    await supabase.from("folders").insert([
      {
        name: newFolder,
        user_id: user.id,
      },
    ]);

    setNewFolder("");
    fetchFolders();
  };

  const deleteFolder = async (id: string) => {
    await supabase.from("folders").delete().eq("id", id);
    setSelectedFolder(null);
    fetchFolders();
    fetchBookmarks();
  };

  // ================== AUTH UI ==================
  if (!user) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="bg-white/5 backdrop-blur-lg p-8 rounded-xl w-96 border border-white/10 shadow-lg text-center">

        <h2 className="text-2xl font-bold mb-6">
          Welcome to BookmarkNest
        </h2>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:scale-105 transition"
        >
          Continue with Google
        </button>

      </div>
    </div>
  );
}


  // ================== DASHBOARD ==================
  return (
    <div className="flex min-h-screen bg-black text-white">

      {/* Sidebar */}
      <div className="w-64 bg-white/5 backdrop-blur-lg border-r border-white/10 p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Folders</h2>

        <div className="mb-4 flex gap-2">
          <input
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            placeholder="New folder"
            className="flex-1 p-2 rounded bg-gray-800 text-sm"
          />
          <button onClick={addFolder} className="bg-green-500 px-3 rounded">
            +
          </button>
        </div>

        <button
  onClick={() => setSelectedFolder(null)}
  className={`block w-full text-left p-2 rounded-lg transition-all duration-200 ${
    selectedFolder === null
      ? "bg-green-600 text-white shadow-md"
      : "hover:bg-white/10"
  }`}
>
  All Bookmarks ({bookmarks.length})
</button>


      {folders.map((folder) => {
  const count = bookmarks.filter(
    (b) => b.folder_id === folder.id
  ).length;

  return (
    <div key={folder.id} className="flex items-center justify-between group">
      <button
        onClick={() => setSelectedFolder(folder.id)}
        className={`flex-1 text-left p-2 rounded-lg transition-all duration-200 ${
          selectedFolder === folder.id
            ? "bg-green-600 text-white shadow-md"
            : "hover:bg-white/10"
        }`}
      >
        {folder.name} ({count})
      </button>

      <button
        onClick={() => deleteFolder(folder.id)}
        className="ml-2 text-red-500 opacity-0 group-hover:opacity-100 transition"
      >
        ❌
      </button>
    </div>
  );
})}

      </div>

      {/* Main */}
      <div className="flex-1 p-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">BookmarkNest</h1>
          <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded-lg">
            Logout
          </button>
        </div>


      
<div className="mb-6">
  <input
    type="text"
    placeholder="Search bookmarks..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full p-3 rounded-lg bg-white/5 backdrop-blur border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
  />
</div>



        <div className="mb-6 flex gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bookmark Title"
            className="p-2 rounded bg-gray-800 flex-1"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Bookmark URL"
            className="p-2 rounded bg-gray-800 flex-1"
          />
          <button onClick={addBookmark} className="bg-green-500 px-4 py-2 rounded-lg">
            Add
          </button>
        </div>

        {bookmarks
          .filter((b) =>
            selectedFolder ? b.folder_id === selectedFolder : true
          )
          .filter((b) =>
            b.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-gray-900 p-4 rounded-lg flex justify-between items-center mb-4"
            >
              <div>
                <p className="font-semibold">{bookmark.title}</p>
                <a href={bookmark.url} target="_blank" className="text-blue-400 text-sm">
                  {bookmark.url}
                </a>
              </div>
              <button
                onClick={() => deleteBookmark(bookmark.id)}
                className="bg-red-500 px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
