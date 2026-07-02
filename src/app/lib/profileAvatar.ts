// Gemeinsame Avatar-Logik für Profil und Navigation.
// Einzige Quelle für Farbpalette und Farbwahl, damit Profilseite und
// Fußleiste denselben Avatar anzeigen.

const STORAGE_KEY = "profileData";

// Farbpalette für den Buchstaben-Avatar. Bewusst andere Töne als das
// App-Cornflower (#6495ED), damit sich das Profilbild abhebt.
export const AVATAR_COLORS = [
  "#E9967A", // Lachs
  "#8FBC8F", // Salbeigrün
  "#DDA0DD", // Pflaume
  "#F0A868", // Orange
  "#5EAAA8", // Petrol
  "#C08497", // Altrosa
  "#9575CD", // Violett
  "#4DB6AC", // Türkis
];

// Wählt anhand des Namens stabil eine Farbe aus der Palette, sodass derselbe
// Nutzer immer dieselbe Hintergrundfarbe erhält.
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export type ProfileAvatar = {
  avatar: string; // Data-URL des hochgeladenen Bilds, leer = Initiale zeigen
  initial: string; // Anzuzeigender Buchstabe
  color: string; // Hintergrundfarbe für die Initiale
};

// Liest das gespeicherte Profil und liefert die Daten für die Avatar-Anzeige.
export function getProfileAvatar(): ProfileAvatar {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const vorname = (p.vorname || "").trim();
      const nachname = (p.nachname || "").trim();
      const initial =
        vorname.charAt(0).toUpperCase() ||
        nachname.charAt(0).toUpperCase() ||
        "?";
      const color =
        p.avatarColor || avatarColor(`${vorname}${nachname}` || "?");
      return { avatar: p.avatar || "", initial, color };
    }
  } catch (err) {
    console.error("Profil konnte nicht geladen werden", err);
  }
  return { avatar: "", initial: "?", color: AVATAR_COLORS[0] };
}
