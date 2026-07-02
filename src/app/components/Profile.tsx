import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  User,
  MapPin,
  Activity,
  Check,
  Save,
  Calendar,
  Clock,
  CalendarPlus,
  Navigation,
  Camera,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import { getDexcomData } from "../../api/dexcom";
import { AVATAR_COLORS, avatarColor } from "../lib/profileAvatar";

const cornflower = "#6495ED";

// ─── Vom Account erstellte Events ────────────────────────────────────────────
// Basieren auf den bestehenden Events (siehe Events.tsx), jeweils mit
// genauer Adresse und Geo-Koordinaten.

interface MyEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  description: string;
  address: string;
  geo: { lat: number; lng: number };
}

const MY_EVENTS: MyEvent[] = [
  {
    id: "my-1",
    title: "Diabetes-Treffen Berlin",
    date: "22. Juni",
    time: "16:00 – 18:00",
    category: "Austausch",
    description: "Offenes Treffen für Menschen mit Diabetes und Angehörige.",
    address: "Alexanderplatz 3, 10178 Berlin",
    geo: { lat: 52.5219, lng: 13.4132 },
  },
  {
    id: "my-2",
    title: "Diabetes Typ 1 Eltern-Café",
    date: "29. Juni",
    time: "10:00 – 12:00",
    category: "Typ 1",
    description: "Austausch für Eltern von Kindern mit Typ-1-Diabetes.",
    address: "Rathausmarkt 1, 20095 Hamburg",
    geo: { lat: 53.5503, lng: 9.9917 },
  },
  {
    id: "my-3",
    title: "Kochen mit niedrigem glykämischen Index",
    date: "3. Juli",
    time: "19:00 – 20:30",
    category: "Rezepte",
    description:
      "Praktische Tipps für alltagstaugliche Gerichte mit stabilem Blutzucker.",
    address: "Marienplatz 8, 80331 München",
    geo: { lat: 48.1372, lng: 11.5755 },
  },
];

type ProfileData = {
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  avatar: string; // Data-URL des Profilbilds, leer = Initiale anzeigen
  avatarColor: string; // Einmal beim Anlegen festgelegte Hintergrundfarbe
};

const EMPTY_PROFILE: ProfileData = {
  vorname: "",
  nachname: "",
  strasse: "",
  plz: "",
  ort: "",
  avatar: "",
  avatarColor: "",
};

// Maximale Kantenlänge des gespeicherten Profilbilds (px). Das Bild wird beim
// Hochladen herunterskaliert, damit die Data-URL in localStorage klein bleibt.
const AVATAR_MAX_SIZE = 256;

const STORAGE_KEY = "profileData";

function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: ProfileData = { ...EMPTY_PROFILE, ...JSON.parse(raw) };
      // Migration: älteren Profilen ohne gespeicherte Farbe einmalig eine
      // zuweisen, damit sie sich danach nicht mehr ändert.
      if (!data.avatarColor) {
        data.avatarColor = avatarColor(
          `${data.vorname}${data.nachname}`.trim() || "?",
        );
      }
      return data;
    }
  } catch (err) {
    console.error("Profil konnte nicht geladen werden", err);
  }
  return EMPTY_PROFILE;
}

// Liest eine Bilddatei ein, skaliert sie quadratisch herunter und liefert eine
// komprimierte JPEG-Data-URL zurück.
function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const scale = Math.min(1, AVATAR_MAX_SIZE / size);
        const out = Math.round(size * scale);
        const canvas = document.createElement("canvas");
        canvas.width = out;
        canvas.height = out;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas nicht verfügbar"));
          return;
        }
        // Mittiger, quadratischer Ausschnitt des Originalbilds.
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, out, out);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>(loadProfile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sensorConnected, setSensorConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sensorstatus prüfen
  useEffect(() => {
    getDexcomData()
      .then(() => setSensorConnected(true))
      .catch(() => setSensorConnected(false));
  }, []);

  const handleChange =
    (field: keyof ProfileData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfile((prev) => ({ ...prev, [field]: e.target.value }));
      setSaved(false);
    };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    // Input zurücksetzen, damit dasselbe Bild erneut gewählt werden kann.
    e.target.value = "";
    if (!file) return;
    try {
      const avatar = await fileToAvatar(file);
      setProfile((prev) => ({ ...prev, avatar }));
      setSaved(false);
    } catch (err) {
      console.error("Profilbild konnte nicht verarbeitet werden", err);
    }
  };

  const handleRemoveAvatar = () => {
    setProfile((prev) => ({ ...prev, avatar: "" }));
    setSaved(false);
  };

  const initial =
    profile.vorname.trim().charAt(0).toUpperCase() ||
    profile.nachname.trim().charAt(0).toUpperCase() ||
    "?";

  // Beim Anlegen fixierte Farbe verwenden; solange noch keine gespeichert ist
  // (brandneues Profil), eine konstante Standardfarbe zeigen – so ändert sie
  // sich nicht bei jedem eingetippten Buchstaben.
  const avatarBg = profile.avatarColor || AVATAR_COLORS[0];

  const handleSave = () => {
    try {
      // Farbe nur einmal beim Anlegen bestimmen und danach beibehalten.
      const toSave: ProfileData = profile.avatarColor
        ? profile
        : {
            ...profile,
            avatarColor: avatarColor(
              `${profile.vorname}${profile.nachname}`.trim() || "?",
            ),
          };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      setProfile(toSave);
      setSaved(true);
      setEditing(false);
    } catch (err) {
      console.error("Profil konnte nicht gespeichert werden", err);
    }
  };

  const handleCancel = () => {
    // Nicht gespeicherte Änderungen verwerfen und zuletzt gespeicherten
    // Stand wiederherstellen.
    setProfile(loadProfile());
    setEditing(false);
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 max-w-screen-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-500 hover:text-[#6495ED] transition-colors"
            aria-label="Zurück"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold text-[#6495ED]">Profil</h1>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setSaved(false);
              }}
              className="ml-auto flex items-center gap-2 text-[#6495ED] border border-[#6495ED] px-4 py-2 rounded-lg hover:bg-[#6495ED] hover:text-white transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Bearbeiten
            </button>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="p-4 max-w-screen-lg mx-auto space-y-4"
      >
        {/* Persönliche Daten */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5" style={{ color: cornflower }} />
            <h2 className="text-lg text-gray-800">Persönliche Daten</h2>
          </div>

          {/* Profilbild */}
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => editing && fileInputRef.current?.click()}
              disabled={!editing}
              className="group relative w-20 h-20 rounded-full overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-[#6495ED] focus:ring-offset-2 disabled:cursor-default"
              aria-label="Profilbild ändern"
            >
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Profilbild"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className="flex items-center justify-center w-full h-full text-2xl font-semibold text-white select-none"
                  style={{ backgroundColor: avatarBg }}
                >
                  {initial}
                </span>
              )}
              {/* Overlay beim Hover – nur im Bearbeiten-Modus */}
              {editing && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </span>
              )}
            </button>

            {editing && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80"
                  style={{ color: cornflower }}
                >
                  <Camera className="w-4 h-4" />
                  Bild ändern
                </button>
                {profile.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    Entfernen
                  </button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Vorname
              </label>
              <input
                type="text"
                value={profile.vorname}
                onChange={handleChange("vorname")}
                placeholder="Vorname"
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6495ED] focus:ring-1 focus:ring-[#6495ED] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-default"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Nachname
              </label>
              <input
                type="text"
                value={profile.nachname}
                onChange={handleChange("nachname")}
                placeholder="Nachname"
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6495ED] focus:ring-1 focus:ring-[#6495ED] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-default"
              />
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5" style={{ color: cornflower }} />
            <h2 className="text-lg text-gray-800">Adresse</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Straße und Hausnummer
              </label>
              <input
                type="text"
                value={profile.strasse}
                onChange={handleChange("strasse")}
                placeholder="Musterstraße 1"
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6495ED] focus:ring-1 focus:ring-[#6495ED] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-default"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-sm text-gray-600 mb-1">PLZ</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={profile.plz}
                  onChange={handleChange("plz")}
                  placeholder="12345"
                  disabled={!editing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6495ED] focus:ring-1 focus:ring-[#6495ED] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-default"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Ort</label>
                <input
                  type="text"
                  value={profile.ort}
                  onChange={handleChange("ort")}
                  placeholder="Musterstadt"
                  disabled={!editing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6495ED] focus:ring-1 focus:ring-[#6495ED] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-default"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sensor / Dexcom */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5" style={{ color: cornflower }} />
            <h2 className="text-lg text-gray-800">Sensor / Dexcom</h2>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${
                sensorConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-gray-700">
              {sensorConnected ? "Sensor verbunden" : "Sensor nicht verbunden"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = "http://localhost:3001/auth/dexcom";
            }}
            className="w-full sm:w-auto bg-[#6495ED] text-white px-4 py-2 rounded-lg hover:bg-[#5885DC] transition-colors"
          >
            {sensorConnected ? "Dexcom neu verbinden" : "Mit Dexcom verbinden"}
          </button>
        </div>

        {/* Speichern / Abbrechen – nur im Bearbeiten-Modus */}
        {editing && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#6495ED] text-white px-6 py-2 rounded-lg hover:bg-[#5885DC] transition-colors"
            >
              <Save className="w-5 h-5" />
              Speichern
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5" />
              Abbrechen
            </button>
          </div>
        )}

        {/* Meine Events */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CalendarPlus className="w-5 h-5" style={{ color: cornflower }} />
            <h2 className="text-lg text-gray-800">Meine Events</h2>
            <span className="ml-auto text-sm text-gray-400">
              {MY_EVENTS.length} erstellt
            </span>
          </div>

          <div className="space-y-3">
            {MY_EVENTS.map((event) => (
              <div
                key={event.id}
                className="border border-gray-200 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-gray-900 leading-snug">{event.title}</h3>
                  <span
                    className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
                  >
                    {event.category}
                  </span>
                </div>

                <p className="text-gray-500 text-sm">{event.description}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {event.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {event.time}
                  </span>
                </div>

                {/* Adresse & Geo-Daten */}
                <div className="flex items-start gap-1.5 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                  <div>
                    <p>{event.address}</p>
                    <p className="text-xs text-gray-400">
                      {event.geo.lat.toFixed(4)}, {event.geo.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${event.geo.lat},${event.geo.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-80"
                  style={{ color: cornflower }}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Auf Karte anzeigen
                </a>
              </div>
            ))}
          </div>
        </div>

        {saved && !editing && (
          <div className="flex items-center gap-1 text-green-600">
            <Check className="w-5 h-5" />
            Gespeichert
          </div>
        )}
      </form>
    </div>
  );
}
