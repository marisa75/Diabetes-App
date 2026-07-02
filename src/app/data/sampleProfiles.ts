// ─── Beispieldaten: Profile mit Events in ganz Deutschland ───────────────────
//
// 5 vollständige Beispielprofile für Entwicklung/Tests. Jedes Profil hat eigene
// „Meine Events" inkl. Geo-Koordinaten: die beiden ersten liegen in der
// Heimatstadt Hamburg, vier weitere sind über deutsche Städte verteilt.
//
// Die Typen spiegeln die in den Komponenten verwendeten Strukturen wider:
//   - ProfileData → src/app/components/Profile.tsx
//   - MyEvent     → src/app/components/Profile.tsx
//
// Kategorien orientieren sich an CATEGORY_COLORS in Events.tsx:
//   "Ernährung" | "Austausch" | "Bewegung" | "Typ 1" | "Typ 2" | "Rezepte"

export interface SampleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  description: string;
  address: string;
  geo: { lat: number; lng: number };
}

export interface SampleProfile {
  id: string;
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  avatar: string; // leer = Initiale anzeigen
  events: SampleEvent[];
}

export const SAMPLE_PROFILES: SampleProfile[] = [
  // ── 1) Anna Petersen – Eppendorf ───────────────────────────────────────────
  {
    id: "profile-1",
    vorname: "Anna",
    nachname: "Petersen",
    strasse: "Eppendorfer Baum 12",
    plz: "20249",
    ort: "Hamburg",
    avatar: "",
    events: [
      {
        id: "p1-e1",
        title: "Diabetes-Sprechstunde am UKE",
        date: "8. Juli",
        time: "15:00 – 16:30",
        category: "Austausch",
        description:
          "Offene Fragerunde mit Diabetesberaterinnen des Universitätsklinikums Eppendorf.",
        address: "Martinistraße 52, 20246 Hamburg",
        geo: { lat: 53.5901, lng: 9.9753 },
      },
      {
        id: "p1-e2",
        title: "Low-Carb-Kochkurs im Isemarkt-Viertel",
        date: "15. Juli",
        time: "18:30 – 20:30",
        category: "Rezepte",
        description:
          "Gemeinsam kohlenhydratarme Gerichte kochen und BE/KE richtig einschätzen.",
        address: "Eppendorfer Landstraße 42, 20249 Hamburg",
        geo: { lat: 53.5883, lng: 9.9822 },
      },
      {
        id: "p1-e3",
        title: "Diabetes-Stammtisch Berlin-Mitte",
        date: "5. August",
        time: "18:00 – 20:00",
        category: "Austausch",
        description:
          "Offener Abend für Menschen mit Diabetes rund um den Hackeschen Markt.",
        address: "Rosenthaler Straße 40, 10178 Berlin",
        geo: { lat: 52.5244, lng: 13.4015 },
      },
      {
        id: "p1-e4",
        title: "Radtour für stabile Werte – München",
        date: "9. August",
        time: "10:00 – 12:30",
        category: "Bewegung",
        description:
          "Entspannte Runde durch den Englischen Garten mit Blutzucker-Tipps.",
        address: "Englischer Garten 2, 80538 München",
        geo: { lat: 48.1642, lng: 11.6055 },
      },
      {
        id: "p1-e5",
        title: "Kohlenhydrate verstehen – Köln",
        date: "14. August",
        time: "17:30 – 19:00",
        category: "Ernährung",
        description:
          "Workshop zu BE/KE und Portionsgrößen im Alltag, direkt am Rheinufer.",
        address: "Konrad-Adenauer-Ufer 7, 50668 Köln",
        geo: { lat: 50.9490, lng: 6.9660 },
      },
      {
        id: "p1-e6",
        title: "Low-GI-Kochabend Frankfurt",
        date: "19. August",
        time: "18:30 – 20:30",
        category: "Rezepte",
        description:
          "Gemeinsam Gerichte mit niedrigem glykämischen Index zubereiten.",
        address: "Berger Straße 175, 60385 Frankfurt am Main",
        geo: { lat: 50.1270, lng: 8.7100 },
      },
    ],
  },

  // ── 2) Mehmet Yılmaz – Wandsbek ────────────────────────────────────────────
  {
    id: "profile-2",
    vorname: "Mehmet",
    nachname: "Yılmaz",
    strasse: "Wandsbeker Marktstraße 45",
    plz: "22041",
    ort: "Hamburg",
    avatar: "",
    events: [
      {
        id: "p2-e1",
        title: "Diabetes Typ 2 Stammtisch Wandsbek",
        date: "10. Juli",
        time: "17:00 – 19:00",
        category: "Typ 2",
        description:
          "Lockerer Austausch für Menschen mit Typ-2-Diabetes und Angehörige.",
        address: "Wandsbeker Marktstraße 73, 22041 Hamburg",
        geo: { lat: 53.5723, lng: 10.0842 },
      },
      {
        id: "p2-e2",
        title: "Nordic Walking für stabile Werte",
        date: "17. Juli",
        time: "09:30 – 11:00",
        category: "Bewegung",
        description:
          "Gemeinsame Runde um den Eichtalpark – Bewegung und Blutzucker verstehen.",
        address: "Walddörferstraße 100, 22041 Hamburg",
        geo: { lat: 53.5766, lng: 10.0908 },
      },
      {
        id: "p2-e3",
        title: "Typ-2-Stammtisch Stuttgart",
        date: "6. August",
        time: "17:00 – 19:00",
        category: "Typ 2",
        description:
          "Lockerer Austausch für Menschen mit Typ-2-Diabetes im Stuttgarter Westen.",
        address: "Rotebühlplatz 28, 70173 Stuttgart",
        geo: { lat: 48.7727, lng: 9.1706 },
      },
      {
        id: "p2-e4",
        title: "Diabetes & Technik – Düsseldorf",
        date: "11. August",
        time: "18:00 – 19:30",
        category: "Austausch",
        description:
          "Erfahrungsaustausch zu CGM-Sensoren und Pumpen in der Altstadt.",
        address: "Heinrich-Heine-Allee 53, 40213 Düsseldorf",
        geo: { lat: 51.2255, lng: 6.7763 },
      },
      {
        id: "p2-e5",
        title: "Nordic Walking am Cospudener See",
        date: "16. August",
        time: "09:30 – 11:00",
        category: "Bewegung",
        description:
          "Gemeinsame Runde am See bei Leipzig – Bewegung und Glukose verstehen.",
        address: "Cospudener See, 04416 Markkleeberg",
        geo: { lat: 51.2668, lng: 12.3345 },
      },
      {
        id: "p2-e6",
        title: "Ernährungsworkshop Dresden",
        date: "22. August",
        time: "16:00 – 17:30",
        category: "Ernährung",
        description:
          "Kohlenhydrate richtig einschätzen – Workshop an der Elbe.",
        address: "Terrassenufer 12, 01067 Dresden",
        geo: { lat: 51.0538, lng: 13.7420 },
      },
    ],
  },

  // ── 3) Laura Schmidt – Altona / Ottensen ───────────────────────────────────
  {
    id: "profile-3",
    vorname: "Laura",
    nachname: "Schmidt",
    strasse: "Ottenser Hauptstraße 10",
    plz: "22765",
    ort: "Hamburg",
    avatar: "",
    events: [
      {
        id: "p3-e1",
        title: "Eltern-Café Typ 1 in Ottensen",
        date: "12. Juli",
        time: "10:00 – 12:00",
        category: "Typ 1",
        description:
          "Austausch für Eltern von Kindern mit Typ-1-Diabetes bei Kaffee und Kuchen.",
        address: "Ottenser Hauptstraße 10, 22765 Hamburg",
        geo: { lat: 53.5525, lng: 9.9345 },
      },
      {
        id: "p3-e2",
        title: "Ernährungsworkshop an der Elbe",
        date: "20. Juli",
        time: "16:00 – 17:30",
        category: "Ernährung",
        description:
          "Kohlenhydrate richtig einschätzen – Picknick-Workshop am Elbstrand Övelgönne.",
        address: "Övelgönne 1, 22605 Hamburg",
        geo: { lat: 53.5462, lng: 9.9083 },
      },
      {
        id: "p3-e3",
        title: "Eltern-Café Typ 1 – Bremen",
        date: "7. August",
        time: "10:00 – 12:00",
        category: "Typ 1",
        description:
          "Austausch für Eltern von Kindern mit Typ-1-Diabetes an der Weser.",
        address: "Schlachte 30, 28195 Bremen",
        geo: { lat: 53.0758, lng: 8.8035 },
      },
      {
        id: "p3-e4",
        title: "Ernährungsberatung Hannover",
        date: "12. August",
        time: "16:30 – 18:00",
        category: "Ernährung",
        description:
          "Praktische Tipps für den Alltag – rund um den Maschsee.",
        address: "Rudolf-von-Bennigsen-Ufer 1, 30169 Hannover",
        geo: { lat: 52.3607, lng: 9.7466 },
      },
      {
        id: "p3-e5",
        title: "Diabetes-Treffen Nürnberg",
        date: "18. August",
        time: "17:00 – 19:00",
        category: "Austausch",
        description:
          "Offenes Treffen für Menschen mit Diabetes in der Altstadt.",
        address: "Hauptmarkt 18, 90403 Nürnberg",
        geo: { lat: 49.4542, lng: 11.0775 },
      },
      {
        id: "p3-e6",
        title: "Gesund kochen in Dortmund",
        date: "24. August",
        time: "19:00 – 20:30",
        category: "Rezepte",
        description:
          "Alltagstaugliche Gerichte mit stabilem Blutzucker zubereiten.",
        address: "Hansastraße 95, 44137 Dortmund",
        geo: { lat: 51.5100, lng: 7.4650 },
      },
    ],
  },

  // ── 4) Jonas Becker – HafenCity ────────────────────────────────────────────
  {
    id: "profile-4",
    vorname: "Jonas",
    nachname: "Becker",
    strasse: "Am Kaiserkai 56",
    plz: "20457",
    ort: "Hamburg",
    avatar: "",
    events: [
      {
        id: "p4-e1",
        title: "Diabetes & Technik: CGM-Sensoren im Alltag",
        date: "9. Juli",
        time: "18:00 – 19:30",
        category: "Austausch",
        description:
          "Vortrag und Erfahrungsaustausch zu Sensoren wie Dexcom und Libre.",
        address: "Überseeallee 16, 20457 Hamburg",
        geo: { lat: 53.5409, lng: 10.0008 },
      },
      {
        id: "p4-e2",
        title: "Yoga für einen ruhigen Blutzucker",
        date: "23. Juli",
        time: "08:00 – 09:00",
        category: "Bewegung",
        description:
          "Sanftes Morgen-Yoga am Grasbrookpark – entspannt in den Tag starten.",
        address: "Grasbrookpark, 20457 Hamburg",
        geo: { lat: 53.5384, lng: 9.9963 },
      },
      {
        id: "p4-e3",
        title: "CGM-Sensoren im Alltag – Essen",
        date: "8. August",
        time: "18:00 – 19:30",
        category: "Austausch",
        description:
          "Vortrag und Erfahrungsaustausch zu Dexcom und Libre im Ruhrgebiet.",
        address: "Kettwiger Straße 2, 45127 Essen",
        geo: { lat: 51.4520, lng: 7.0132 },
      },
      {
        id: "p4-e4",
        title: "Yoga für ruhige Werte – Freiburg",
        date: "13. August",
        time: "08:00 – 09:00",
        category: "Bewegung",
        description:
          "Sanftes Morgen-Yoga im Seepark – entspannt in den Tag starten.",
        address: "Sundgauallee, 79110 Freiburg im Breisgau",
        geo: { lat: 48.0060, lng: 7.8110 },
      },
      {
        id: "p4-e5",
        title: "Typ-2-Austausch Münster",
        date: "17. August",
        time: "17:00 – 18:30",
        category: "Typ 2",
        description:
          "Gespräche und Tipps für den Alltag mit Typ-2-Diabetes am Aasee.",
        address: "Annette-Allee 3, 48149 Münster",
        geo: { lat: 51.9540, lng: 7.6120 },
      },
      {
        id: "p4-e6",
        title: "Ernährung an der Förde – Kiel",
        date: "23. August",
        time: "16:00 – 17:30",
        category: "Ernährung",
        description:
          "Kohlenhydrate einschätzen mit Blick auf die Kieler Förde.",
        address: "Kiellinie 70, 24105 Kiel",
        geo: { lat: 54.3390, lng: 10.1490 },
      },
    ],
  },

  // ── 5) Sophie Wagner – Winterhude ──────────────────────────────────────────
  {
    id: "profile-5",
    vorname: "Sophie",
    nachname: "Wagner",
    strasse: "Mühlenkamp 8",
    plz: "22303",
    ort: "Hamburg",
    avatar: "",
    events: [
      {
        id: "p5-e1",
        title: "Diabetes-Treffen im Stadtpark",
        date: "13. Juli",
        time: "15:00 – 17:00",
        category: "Austausch",
        description:
          "Offenes Treffen für Menschen mit Diabetes – bei gutem Wetter auf der Festwiese.",
        address: "Südring 5B, 22303 Hamburg",
        geo: { lat: 53.5962, lng: 10.0171 },
      },
      {
        id: "p5-e2",
        title: "Gesund kochen mit niedrigem GI",
        date: "21. Juli",
        time: "19:00 – 20:30",
        category: "Rezepte",
        description:
          "Alltagstaugliche Gerichte mit niedrigem glykämischen Index zubereiten.",
        address: "Mühlenkamp 43, 22303 Hamburg",
        geo: { lat: 53.5828, lng: 10.0121 },
      },
      {
        id: "p5-e3",
        title: "Diabetes-Treffen am Rhein – Mainz",
        date: "9. August",
        time: "15:00 – 17:00",
        category: "Austausch",
        description:
          "Offenes Treffen für Menschen mit Diabetes am Rheinufer.",
        address: "Rheinstraße 55, 55116 Mainz",
        geo: { lat: 50.0010, lng: 8.2760 },
      },
      {
        id: "p5-e4",
        title: "Kochkurs mit niedrigem GI – Heidelberg",
        date: "15. August",
        time: "18:30 – 20:30",
        category: "Rezepte",
        description:
          "Gemeinsam kohlenhydratbewusste Gerichte in der Altstadt kochen.",
        address: "Hauptstraße 120, 69117 Heidelberg",
        geo: { lat: 49.4120, lng: 8.7080 },
      },
      {
        id: "p5-e5",
        title: "Aktiv am Lech – Augsburg",
        date: "20. August",
        time: "09:30 – 11:00",
        category: "Bewegung",
        description:
          "Gemeinsame Bewegungsrunde am Lech mit Blutzucker-Tipps.",
        address: "Am Eiskanal 30, 86161 Augsburg",
        geo: { lat: 48.3480, lng: 10.9210 },
      },
      {
        id: "p5-e6",
        title: "Eltern-Café Typ 1 – Rostock",
        date: "25. August",
        time: "10:00 – 12:00",
        category: "Typ 1",
        description:
          "Austausch für Eltern von Kindern mit Typ-1-Diabetes an der Ostsee.",
        address: "Am Strande 3, 18055 Rostock",
        geo: { lat: 54.0910, lng: 12.1370 },
      },
    ],
  },
];

export default SAMPLE_PROFILES;
