import React, { useState } from "react";
import {
  MessageSquare,
  ChevronRight,
  Clock,
  Users,
  ArrowLeft,
  TrendingUp,
  Heart,
  Star,
  Send,
  Smile,
} from "lucide-react";

type Comment = {
  id: number;
  author: string;
  text: string;
  date: string;
  likes: number;
  liked: boolean;
};

type Post = {
  id: number;
  title: string;
  author: string;
  date: string;
  replies: number;
  category: string;
  preview: string;
  likes: number;
  liked: boolean;
  favorite: boolean;
  reactions: number;
  reacted: boolean;
  comments: Comment[];
};

type Subforum = {
  id: string;
  name: string;
  description: string;
  posts: number;
  lastPost: string;
};

type Category = {
  id: string;
  name: string;
  icon: string;
  subforums: Subforum[];
};

type View =
  | { type: "overview" }
  | { type: "subforum"; categoryId: string; subforumId: string; name: string };

const initialPosts: Post[] = [
  {
    id: 1,
    title: "Welche Insulinpumpe nutzt ihr aktuell?",
    author: "DiabetesKrieger88",
    date: "vor 12 Min.",
    replies: 23,
    category: "Pumpenzubehör",
    preview:
      "Ich bin gerade auf der Suche nach einer neuen Pumpe und würde gerne eure Erfahrungen hören...",
    likes: 12,
    liked: false,
    favorite: false,
    reactions: 4,
    reacted: false,
    comments: [
      {
        id: 101,
        author: "Mia",
        text: "Ich nutze aktuell die Omnipod 5 und bin sehr zufrieden.",
        date: "vor 5 Min.",
        likes: 0,
        liked: false,
      },
    ],
  },
  {
    id: 2,
    title: "Tipp: Kohlenhydrate beim Wandern richtig berechnen",
    author: "BergtourMia",
    date: "vor 1 Std.",
    replies: 11,
    category: "Sport",
    preview: "Nach vielen langen Wanderungen habe ich endlich eine Methode gefunden...",
    likes: 8,
    liked: false,
    favorite: false,
    reactions: 3,
    reacted: false,
    comments: [],
  },
  {
    id: 3,
    title: "Libre 3 vs. Dexcom G7 – ein ehrlicher Vergleich",
    author: "SensorProfi",
    date: "vor 3 Std.",
    replies: 47,
    category: "Blutzuckermessgeräte",
    preview: "Ich habe beide Systeme über mehrere Monate getestet...",
    likes: 21,
    liked: false,
    favorite: true,
    reactions: 9,
    reacted: false,
    comments: [
      {
        id: 301,
        author: "User123",
        text: "Danke für den Vergleich, das hilft mir sehr bei meiner Entscheidung.",
        date: "vor 1 Std.",
        likes: 0,
        liked: false,
      },
      {
        id: 302,
        author: "DiabetesFan",
        text: "Ich finde den Dexcom G7 auch genauer, aber Libre ist günstiger.",
        date: "vor 25 Min.",
        likes: 0,
        liked: false,
      },
    ],
  },
];

const categories: Category[] = [
  {
    id: "diabetes-typ1",
    name: "Diabetes Typ 1",
    icon: "💉",
    subforums: [
      {
        id: "allgemein",
        name: "Allgemein",
        description: "Allgemeine Fragen und Diskussionen rund um Typ-1-Diabetes",
        posts: 1243,
        lastPost: "vor 5 Min.",
      },
      {
        id: "pumpenbehoer",
        name: "Pumpenzubehör",
        description: "Infusets, Katheter, Reservoire und alles rund um die Pumpe",
        posts: 876,
        lastPost: "vor 12 Min.",
      },
      {
        id: "bz-geraete",
        name: "Blutzuckermessgeräte",
        description: "CGM-Systeme, Sensoren und Geräte im Vergleich",
        posts: 2134,
        lastPost: "vor 3 Std.",
      },
    ],
  },
  {
    id: "ernaehrung-sport",
    name: "Ernährung & Sport",
    icon: "🥗",
    subforums: [
      {
        id: "ernaehrung",
        name: "Ernährung",
        description: "Rezepte, KH-Berechnung und diabetesfreundliche Küche",
        posts: 3421,
        lastPost: "vor 30 Min.",
      },
      {
        id: "sport",
        name: "Sport & Bewegung",
        description: "Insulin anpassen beim Sport, Ausdauer und Krafttraining",
        posts: 1876,
        lastPost: "vor 1 Std.",
      },
    ],
  },
];

export function Forum() {
  const [view, setView] = useState<View>({ type: "overview" });
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostText, setNewPostText] = useState("");

  const [openCommentPostId, setOpenCommentPostId] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  function createPost(category = "Forum") {
    if (!newPostTitle.trim() || !newPostText.trim()) return;

    const newPost: Post = {
      id: Date.now(),
      title: newPostTitle,
      author: "User",
      date: "gerade eben",
      replies: 0,
      category,
      preview: newPostText,
      likes: 0,
      liked: false,
      favorite: false,
      reactions: 0,
      reacted: false,
      comments: [],
    };

    setPosts((oldPosts) => [newPost, ...oldPosts]);
    setNewPostTitle("");
    setNewPostText("");
  }

  function likePost(id: number) {
    setPosts((oldPosts) =>
      oldPosts.map((post) =>
        post.id === id
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? Math.max(0, post.likes - 1) : post.likes + 1,
            }
          : post
      )
    );
  }

  function toggleFavorite(id: number) {
    setPosts((oldPosts) =>
      oldPosts.map((post) =>
        post.id === id ? { ...post, favorite: !post.favorite } : post
      )
    );
  }

  function reactPost(id: number) {
    setPosts((oldPosts) =>
      oldPosts.map((post) =>
        post.id === id
          ? {
              ...post,
              reacted: !post.reacted,
              reactions: post.reacted
                ? Math.max(0, post.reactions - 1)
                : post.reactions + 1,
            }
          : post
      )
    );
  }

  function likeComment(postId: number, commentId: number) {
    setPosts((oldPosts) =>
      oldPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      liked: !comment.liked,
                      likes: comment.liked
                        ? Math.max(0, (comment.likes ?? 0) - 1)
                        : (comment.likes ?? 0) + 1,
                    }
                  : comment
              ),
            }
          : post
      )
    );
  }

  function toggleCommentBox(id: number) {
    setOpenCommentPostId((currentId) => (currentId === id ? null : id));
  }

  function updateCommentInput(postId: number, value: string) {
    setCommentInputs((oldInputs) => ({
      ...oldInputs,
      [postId]: value,
    }));
  }

  function addComment(postId: number) {
    const text = commentInputs[postId];

    if (!text || !text.trim()) return;

    const newComment: Comment = {
      id: Date.now(),
      author: "User",
      text,
      date: "gerade eben",
      likes: 0,
      liked: false,
    };

    setPosts((oldPosts) =>
      oldPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, newComment],
              replies: post.replies + 1,
            }
          : post
      )
    );

    setCommentInputs((oldInputs) => ({
      ...oldInputs,
      [postId]: "",
    }));
  }

  const shownPosts =
    view.type === "subforum"
      ? posts.filter((post) => post.category === view.name || post.category === "Forum")
      : posts;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#6495ED] text-white px-4 py-6">
        {view.type === "subforum" ? (
          <button
            onClick={() => setView({ type: "overview" })}
            className="mb-3 flex items-center gap-1 text-white"
          >
            <ArrowLeft size={18} />
            Zurück
          </button>
        ) : null}

        <h1 className="text-white mb-1">
          {view.type === "subforum" ? view.name : "Willkommen im Community-Forum!"}
        </h1>

        <p className="text-blue-100 text-sm">
          Beiträge erstellen, lesen, liken, favorisieren, kommentieren und Kommentare liken.
        </p>
      </div>

      <div className="max-w-screen-lg mx-auto px-4 py-5 space-y-6">
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100">
          <h2 className="text-gray-800 mb-3">Neuen Forum-Post erstellen</h2>

          <input
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="Titel deines Beitrags"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 mb-2 outline-none focus:border-[#6495ED]"
          />

          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="Schreibe deinen Beitrag..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 mb-3 min-h-[90px] outline-none focus:border-[#6495ED]"
          />

          <button
            onClick={() =>
              createPost(view.type === "subforum" ? view.name : "Forum")
            }
            className="bg-[#6495ED] text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Send size={16} />
            Post erstellen
          </button>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-[#6495ED]" />
            <h2 className="text-gray-800">Letzte Beiträge</h2>
          </div>

          <div className="space-y-3">
            {shownPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#6495ED]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 mb-1">{post.title}</p>
                    <p className="text-gray-500 text-sm">{post.preview}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {post.comments.length} Kommentare
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.date}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="text-xs bg-[#6495ED]/10 text-[#6495ED] px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {post.author}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => likePost(post.id)}
                    className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
                      post.liked
                        ? "bg-[#6495ED] text-white"
                        : "bg-blue-50 text-[#6495ED]"
                    }`}
                  >
                    <Heart size={13} fill={post.liked ? "white" : "none"} />
                    {post.likes}
                  </button>

                  <button
                    onClick={() => toggleFavorite(post.id)}
                    className="text-xs bg-blue-50 text-[#6495ED] px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    <Star size={13} fill={post.favorite ? "#6495ED" : "none"} />
                    {post.favorite ? "Favorit" : "Favorisieren"}
                  </button>

                  <button
                    onClick={() => reactPost(post.id)}
                    className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
                      post.reacted
                        ? "bg-[#6495ED] text-white"
                        : "bg-blue-50 text-[#6495ED]"
                    }`}
                  >
                    <Smile size={13} />
                    {post.reactions}
                  </button>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => toggleCommentBox(post.id)}
                    className="w-full bg-[#6495ED]/10 text-[#6495ED] px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm"
                  >
                    <MessageSquare size={16} />
                    Kommentieren / Antworten
                  </button>

                  {openCommentPostId === post.id && (
                    <div className="mt-3">
                      <textarea
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => updateCommentInput(post.id, e.target.value)}
                        placeholder="Schreibe eine Antwort..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 mb-2 min-h-[80px] outline-none focus:border-[#6495ED]"
                      />

                      <button
                        onClick={() => addComment(post.id)}
                        className="bg-[#6495ED] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
                      >
                        <Send size={15} />
                        Antwort senden
                      </button>
                    </div>
                  )}

                  {post.comments.length > 0 && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-3">
                      <p className="text-sm text-gray-700 mb-2">
                        {post.comments.length}{" "}
                        {post.comments.length === 1 ? "Kommentar" : "Kommentare"}
                      </p>

                      <div className="space-y-2">
                        {post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-white rounded-xl px-3 py-2 border border-gray-100"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-[#6495ED]">
                                {comment.author}
                              </span>
                              <span className="text-xs text-gray-400">
                                {comment.date}
                              </span>
                            </div>

                            <p className="text-sm text-gray-700">{comment.text}</p>

                            <div className="mt-2">
                              <button
                                onClick={() => likeComment(post.id, comment.id)}
                                className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
                                  comment.liked
                                    ? "bg-[#6495ED] text-white"
                                    : "bg-blue-50 text-[#6495ED]"
                                }`}
                              >
                                <Heart
                                  size={12}
                                  fill={comment.liked ? "white" : "none"}
                                />
                                {comment.likes ?? 0}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {view.type === "overview" && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-[#6495ED]" />
              <h2 className="text-gray-800">Unterbereiche</h2>
            </div>

            <div className="space-y-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-[#6495ED]/5 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-gray-800">{cat.name}</span>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {cat.subforums.map((sf) => (
                      <button
                        key={sf.id}
                        onClick={() =>
                          setView({
                            type: "subforum",
                            categoryId: cat.id,
                            subforumId: sf.id,
                            name: sf.name,
                          })
                        }
                        className="w-full text-left px-4 py-3 hover:bg-[#6495ED]/5 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[#6495ED]">{sf.name}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {sf.description}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-0.5 shrink-0 text-xs text-gray-400">
                          <span>{sf.posts} Beiträge</span>
                          <span>{sf.lastPost}</span>
                          <ChevronRight size={14} className="text-gray-300 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}