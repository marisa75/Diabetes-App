import { useState } from "react";
import { MessageSquare, ChevronRight, Clock, Users, ArrowLeft, TrendingUp } from "lucide-react";
import React from "react";


type Post = {
  id: number;
  title: string;
  author: string;
  date: string;
  replies: number;
  category: string;
  preview: string;
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

const recentPosts: Post[] = [
  {
    id: 1,
    title: "Welche Insulinpumpe nutzt ihr aktuell?",
    author: "DiabetesKrieger88",
    date: "vor 12 Min.",
    replies: 23,
    category: "Pumpenzubehör",
    preview: "Ich bin gerade auf der Suche nach einer neuen Pumpe und würde gerne eure Erfahrungen hören...",
  },
  {
    id: 2,
    title: "Tipp: Kohlenhydrate beim Wandern richtig berechnen",
    author: "BergtourMia",
    date: "vor 1 Std.",
    replies: 11,
    category: "Sport",
    preview: "Nach vielen langen Wanderungen habe ich endlich eine Methode gefunden, die für mich gut funktioniert...",
  },
  {
    id: 3,
    title: "Libre 3 vs. Dexcom G7 – ein ehrlicher Vergleich",
    author: "SensorProfi",
    date: "vor 3 Std.",
    replies: 47,
    category: "Blutzuckermessgeräte",
    preview: "Ich habe beide Systeme über mehrere Monate getestet und möchte meine Erfahrungen teilen...",
  },
  {
    id: 4,
    title: "Rezept: Proteinreicher Frühstücks-Bowl ohne Kohlenhydrat-Spitzen",
    author: "KochExpertin_T1D",
    date: "vor 5 Std.",
    replies: 8,
    category: "Ernährung",
    preview: "Dieses Rezept hat meinen Morgen-BZ wirklich stabilisiert. Hier ist mein Geheimrezept...",
  },
  {
    id: 5,
    title: "Neu diagnostiziert – wie fangt ihr an?",
    author: "NeuDiabetiker2024",
    date: "vor 8 Std.",
    replies: 34,
    category: "Allgemein",
    preview: "Hallo zusammen, ich wurde vor zwei Wochen diagnostiziert und bin noch sehr überwältigt...",
  },
];

const categories: Category[] = [
  {
    id: "diabetes-typ1",
    name: "Diabetes Typ 1",
    icon: "💉",
    subforums: [
      { id: "allgemein", name: "Allgemein", description: "Allgemeine Fragen und Diskussionen rund um Typ-1-Diabetes", posts: 1243, lastPost: "vor 5 Min." },
      { id: "pumpenbehoer", name: "Pumpenzubehör", description: "Infusets, Katheter, Reservoire und alles rund um die Pumpe", posts: 876, lastPost: "vor 12 Min." },
      { id: "bz-geraete", name: "Blutzuckermessgeräte", description: "CGM-Systeme, Sensoren und klassische Geräte im Vergleich", posts: 2134, lastPost: "vor 3 Std." },
      { id: "closed-loop", name: "Closed-Loop & AID", description: "Automatisierte Insulinabgabe, Loop-Apps und Hybrid-Systeme", posts: 654, lastPost: "vor 1 Std." },
      { id: "neudiagnose", name: "Neudiagnose & Einsteiger", description: "Für alle, die am Anfang ihrer Diabetes-Reise stehen", posts: 432, lastPost: "gestern" },
    ],
  },
  {
    id: "diabetes-typ2",
    name: "Diabetes Typ 2",
    icon: "🩺",
    subforums: [
      { id: "allgemein-t2", name: "Allgemein", description: "Allgemeine Diskussionen zum Typ-2-Diabetes", posts: 987, lastPost: "vor 20 Min." },
      { id: "medikamente", name: "Medikamente & Therapie", description: "Erfahrungen mit Tabletten, Injektionen und Therapieformen", posts: 543, lastPost: "vor 2 Std." },
      { id: "lebensstil", name: "Lebensstil & Prävention", description: "Gewichtsmanagement, Bewegung und Ernährungsumstellung", posts: 765, lastPost: "gestern" },
    ],
  },
  {
    id: "ernaehrung-sport",
    name: "Ernährung & Sport",
    icon: "🥗",
    subforums: [
      { id: "ernaehrung", name: "Ernährung", description: "Rezepte, KH-Berechnung, Low Carb und diabetesfreundliche Küche", posts: 3421, lastPost: "vor 30 Min." },
      { id: "sport", name: "Sport & Bewegung", description: "Insulin anpassen beim Sport, Ausdauer, Krafttraining und mehr", posts: 1876, lastPost: "vor 1 Std." },
      { id: "reisen", name: "Reisen mit Diabetes", description: "Tipps für Flugreisen, Zeitzonenwechsel und Auslandsaufenthalte", posts: 654, lastPost: "vor 4 Std." },
    ],
  },
  {
    id: "psyche-community",
    name: "Psyche & Community",
    icon: "💬",
    subforums: [
      { id: "diabetes-burnout", name: "Diabetes-Burnout & Motivation", description: "Umgang mit Erschöpfung und neue Motivation finden", posts: 432, lastPost: "vor 2 Std." },
      { id: "familie", name: "Familie & Alltag", description: "Leben mit Diabetes im Familienalltag, Kinder und Partner", posts: 876, lastPost: "gestern" },
      { id: "beruf", name: "Beruf & Schule", description: "Diabetes am Arbeitsplatz, Rechte und praktische Tipps", posts: 321, lastPost: "vor 3 Tagen" },
    ],
  },
];

const subforum_posts: Record<string, Post[]> = {
  allgemein: [
    { id: 10, title: "Neu diagnostiziert – wie fangt ihr an?", author: "NeuDiabetiker2024", date: "vor 8 Std.", replies: 34, category: "Allgemein", preview: "Hallo zusammen, ich wurde vor zwei Wochen diagnostiziert..." },
    { id: 11, title: "HbA1c-Zielwerte – was ist realistisch?", author: "GlykamiaGuru", date: "gestern", replies: 19, category: "Allgemein", preview: "Mein Arzt empfiehlt unter 7%, aber ich frage mich..." },
    { id: 12, title: "Tipps für den Winter mit der Pumpe", author: "WinterDiabetiker", date: "vor 2 Tagen", replies: 12, category: "Allgemein", preview: "Die Kälte macht meinem Insulin zu schaffen..." },
  ],
  pumpenbehoer: [
    { id: 20, title: "Welche Insulinpumpe nutzt ihr aktuell?", author: "DiabetesKrieger88", date: "vor 12 Min.", replies: 23, category: "Pumpenzubehör", preview: "Ich bin gerade auf der Suche nach einer neuen Pumpe..." },
    { id: 21, title: "Infuset-Empfehlung für empfindliche Haut", author: "HautSensibel", date: "vor 6 Std.", replies: 8, category: "Pumpenzubehör", preview: "Meine Haut reagiert stark auf das Klebeband..." },
  ],
  "bz-geraete": [
    { id: 30, title: "Libre 3 vs. Dexcom G7 – ein ehrlicher Vergleich", author: "SensorProfi", date: "vor 3 Std.", replies: 47, category: "Blutzuckermessgeräte", preview: "Ich habe beide Systeme über mehrere Monate getestet..." },
    { id: 31, title: "Fehlalarmrate beim Libre 3 – eure Erfahrungen?", author: "SensorNutzer", date: "gestern", replies: 22, category: "Blutzuckermessgeräte", preview: "Mein Sensor schlägt nachts oft Alarm obwohl der Wert..." },
  ],
  ernaehrung: [
    { id: 40, title: "Rezept: Proteinreicher Frühstücks-Bowl", author: "KochExpertin_T1D", date: "vor 5 Std.", replies: 8, category: "Ernährung", preview: "Dieses Rezept hat meinen Morgen-BZ wirklich stabilisiert..." },
    { id: 41, title: "KH zählen – Apps im Vergleich", author: "AppFan", date: "vor 1 Tag", replies: 15, category: "Ernährung", preview: "Ich habe verschiedene Apps zum Kohlenhydratzählen ausprobiert..." },
  ],
  sport: [
    { id: 50, title: "Tipp: Kohlenhydrate beim Wandern richtig berechnen", author: "BergtourMia", date: "vor 1 Std.", replies: 11, category: "Sport", preview: "Nach vielen langen Wanderungen habe ich endlich eine Methode..." },
    { id: 51, title: "Krafttraining mit Typ-1 – Basalrate anpassen", author: "GymDiabetiker", date: "vor 2 Tagen", replies: 29, category: "Sport", preview: "Beim Krafttraining verhält sich mein BZ ganz anders als beim Ausdauersport..." },
  ],
};

type View =
  | { type: "overview" }
  | { type: "subforum"; categoryId: string; subforumId: string; name: string };

export function Forum() {
  const [view, setView] = useState<View>({ type: "overview" });

  if (view.type === "subforum") {
    const posts = subforum_posts[view.subforumId] ?? [];
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setView({ type: "overview" })}
            className="text-[#6495ED] flex items-center gap-1"
          >
            <ArrowLeft size={18} />
            <span>Zurück</span>
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 truncate">{view.name}</span>
        </div>

        <div className="max-w-screen-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800">{view.name}</h2>
            <button className="bg-[#6495ED] text-white px-4 py-2 rounded-xl text-sm">
              + Neuer Beitrag
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p>Noch keine Beiträge. Sei der Erste!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-[#6495ED] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 mb-1">{post.title}</p>
                      <p className="text-gray-500 text-sm line-clamp-2">{post.preview}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        {post.replies}
                      </span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span className="bg-[#6495ED]/10 text-[#6495ED] px-2 py-0.5 rounded-full">
                      {post.author}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Banner */}
      <div className="bg-[#6495ED] text-white px-4 py-6">
        <h1 className="text-white mb-1">Willkommen im Community-Forum!</h1>
        <p className="text-blue-100 text-sm">
          Tausch dich mit Gleichgesinnten aus, teile deine Erfahrungen und unterstütze andere auf ihrem Weg mit Diabetes.
        </p>
      </div>

      <div className="max-w-screen-lg mx-auto px-4 py-5 space-y-6">
        {/* Recent Posts */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-[#6495ED]" />
            <h2 className="text-gray-800">Letzte Beiträge</h2>
          </div>
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-[#6495ED] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 mb-0.5">{post.title}</p>
                    <p className="text-gray-500 text-sm line-clamp-1">{post.preview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {post.replies}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.date}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-xs bg-[#6495ED]/10 text-[#6495ED] px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories & Subforums */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-[#6495ED]" />
            <h2 className="text-gray-800">Unterbereiche</h2>
          </div>
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-[#6495ED]/5 border-b border-gray-100 flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-gray-800">{cat.name}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {cat.subforums.map((sf) => (
                    <button
                      key={sf.id}
                      onClick={() =>
                        setView({ type: "subforum", categoryId: cat.id, subforumId: sf.id, name: sf.name })
                      }
                      className="w-full text-left px-4 py-3 hover:bg-[#6495ED]/5 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[#6495ED]">{sf.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{sf.description}</p>
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
      </div>
    </div>
  );
}
