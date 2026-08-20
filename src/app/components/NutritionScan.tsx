import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  ImageIcon,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save,
  RotateCcw,
  X,
  Plus,
  Minus,
  Info,
  Zap,
  Droplets,
  Wheat,
  Flame,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "./ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = "upload" | "loading" | "result" | "saved";

interface Ingredient {
  id: string;
  name: string;
  weight: number;
  unit: string;
}

interface NutritionData {
  meal: string;
  confidence: number;
  portion: number;
  portionUnit: string;
  diabetes: {
    carbs: number;
    sugar: number;
    fiber: number;
    be: number;
    calories: number;
  };
  full: {
    protein: number;
    fat: number;
    saturatedFat: number;
    sodium: number;
    potassium: number;
  };
  ingredients: Ingredient[];
}
interface HistoryEntry {
  id: string;
  date: string;
  data: NutritionData;
  imageSrc: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_RESULT: NutritionData = {
  meal: "Vollkornbrot mit Käse & Tomate",
  confidence: 87,
  portion: 150,
  portionUnit: "g",
  diabetes: {
    carbs: 28.4,
    sugar: 2.5,
    fiber: 5.2,
    be: 2.3,
    calories: 285,
  },
  full: {
    protein: 14.2,
    fat: 10.8,
    saturatedFat: 6.1,
    sodium: 420,
    potassium: 280,
  },
  ingredients: [
    { id: "1", name: "Vollkornbrot", weight: 80, unit: "g" },
    { id: "2", name: "Gouda Käse", weight: 40, unit: "g" },
    { id: "3", name: "Tomate", weight: 30, unit: "g" },
  ],
};
function convertLogmealToNutritionData(logmealData: any): NutritionData {
  const nutrition = logmealData.nutritional_info;
  const carbs = nutrition?.totalNutrients?.CHOCDF?.quantity ?? 0;
  
  return {
    meal: logmealData.foodName ?? "Unbekannte Mahlzeit",
    confidence: Math.round((logmealData.prob ?? 0) * 100),
    portion: nutrition?.totalWeight ?? 100,
    portionUnit: "g",
    diabetes: {
      carbs: Math.round(carbs * 10) / 10,
      sugar: Math.round((nutrition?.totalNutrients?.SUGAR?.quantity ?? 0) * 10) / 10,
      fiber: Math.round((nutrition?.totalNutrients?.FIBTG?.quantity ?? 0) * 10) / 10,
      be: Math.round((carbs / 12) * 10) / 10,  // BE = KH ÷ 12
      calories: Math.round(nutrition?.calories ?? 0),
    },
    full: {
      protein: Math.round((nutrition?.totalNutrients?.PROCNT?.quantity ?? 0) * 10) / 10,
      fat: Math.round((nutrition?.totalNutrients?.FAT?.quantity ?? 0) * 10) / 10,
      saturatedFat: Math.round((nutrition?.totalNutrients?.FASAT?.quantity ?? 0) * 10) / 10,
      sodium: Math.round(nutrition?.totalNutrients?.NA?.quantity ?? 0),
      potassium: Math.round(nutrition?.totalNutrients?.K?.quantity ?? 0),
    },
    ingredients: logmealData.foodItems?.map((item: any, i: number) => ({
      id: String(i),
      name: item.name,
      weight: item.quantity ?? 100,
      unit: "g"
    })) ?? []
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cornflower = "#6495ED";

function ConfidenceBadge({ score }: { score: number }) {
  const isLow = score < 75;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        isLow
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700"
      )}
    >
      {isLow ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      {score}% Konfidenz
    </span>
  );
}

// ─── Upload Card ──────────────────────────────────────────────────────────────

function UploadCard({ onCapture }: { onCapture: (src: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      onCapture(url);
    },
    [onCapture]
  );

  const startCamera = useCallback(async () => {
    setScanning(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }

    const { BrowserMultiFormatReader } = await import("@zxing/library");
    const reader = new BrowserMultiFormatReader();

    reader.decodeFromVideoDevice(null, videoRef.current!, async (result, err) => {
      if (result) {
        const barcode = result.getText();
        reader.reset();
        stream.getTracks().forEach(t => t.stop());
        setScanning(false);

        const response = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        );
        const data = await response.json();

        if (data.status === 1) {
          onCapture(`barcode:${JSON.stringify(data.product)}`);
        } else {
          alert("Produkt nicht gefunden!");
        }
      }
    });
  }, [onCapture]);

  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setScanning(false);
  }, []);

  const takePhoto = useCallback(() => {
  const video = videoRef.current;
  if (!video) return;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d")?.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL("image/jpeg");

  // Kamera stoppen
  const stream = video.srcObject as MediaStream;
  stream?.getTracks().forEach(t => t.stop());
  setScanning(false);

  onCapture(dataUrl);
}, [onCapture]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Hero Illustration */}
      <div
        className="relative rounded-3xl overflow-hidden flex flex-col items-center justify-center py-12 px-6 text-center"
        style={{ background: `linear-gradient(135deg, #EEF3FD 0%, #D6E4FF 100%)` }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-md"
          style={{ backgroundColor: cornflower }}
        >
          <Camera className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-gray-800 mb-1">Mahlzeit analysieren</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Fotografiere dein Essen oder scanne einen Barcode.
        </p>
      </div>

      {/* Kamera-Ansicht */}
      {scanning && (
        <div className="flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full rounded-2xl" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white rounded-lg w-48 h-32 opacity-60" />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">
            Barcode wird automatisch erkannt — oder Foto aufnehmen
          </p>
          <button
            onClick={takePhoto}
            className="w-full py-3 rounded-2xl text-white text-sm font-medium"
            style={{ backgroundColor: cornflower }}
          >
            📷 Foto aufnehmen
          </button>
          <button
            onClick={stopCamera}
            className="w-full py-3 rounded-2xl bg-red-50 text-red-400 text-sm font-medium"
          >
            Abbrechen
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {!scanning && (
        <div className="flex flex-col gap-3">
          <button
            onClick={startCamera}
            className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98]"
          >
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${cornflower}20` }}
            >
              <Camera className="w-5 h-5" style={{ color: cornflower }} />
            </span>
            <div className="text-left">
              <p className="text-gray-800 text-sm font-medium">Kamera öffnen</p>
              <p className="text-gray-400 text-xs">Foto aufnehmen oder Barcode scannen</p>
            </div>
            <div className="ml-auto text-gray-300">›</div>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98]"
          >
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${cornflower}20` }}
            >
              <ImageIcon className="w-5 h-5" style={{ color: cornflower }} />
            </span>
            <div className="text-left">
              <p className="text-gray-800 text-sm font-medium">Aus Galerie wählen</p>
              <p className="text-gray-400 text-xs">Bild hochladen</p>
            </div>
            <div className="ml-auto text-gray-300">›</div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-600">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Für medizinische Entscheidungen immer einen Arzt oder Diabetesberater
          hinzuziehen. Analysewerte sind Schätzungen.
        </span>
      </div>
    </motion.div>
  );
}


// ─── Loading State ─────────────────────────────────────────────────────────────

function AnalysisLoading({ imageSrc }: { imageSrc: string }) {
  const steps = [
    "Bild wird hochgeladen…",
    "Lebensmittel werden erkannt…",
    "Nährwerte werden berechnet…",
    "BE/KE-Werte werden ermittelt…",
  ];
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) {
          clearInterval(interval);
          return p;
        }
        return p + 2;
      });
    }, 60);

    const stepInterval = setInterval(() => {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }, 900);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      {/* Image Preview */}
      <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-lg">
        {imageSrc !== "camera" ? (
          <img src={imageSrc} alt="Zu analysierende Mahlzeit" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, #EEF3FD, #D6E4FF)` }}
          >
            <Camera className="w-16 h-16 text-blue-300" />
          </div>
        )}
        {/* Scanning overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${cornflower}40 50%, transparent 100%)`,
          }}
          animate={{ y: ["-100%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ border: `2px solid ${cornflower}` }}
        />
      </div>

      {/* Progress */}
      <div className="w-full max-w-sm space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">{steps[step]}</p>
          <span className="text-sm font-medium" style={{ color: cornflower }}>
            {progress}%
          </span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: i <= step ? cornflower : "#E5E7EB" }}
            animate={{ scale: i === step ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.6, repeat: i === step ? Infinity : 0 }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Bild wird analysiert…
      </div>
    </motion.div>
  );
}

// ─── Diabetes Highlight Card ───────────────────────────────────────────────────

function DiabetesHighlightCard({ data }: { data: NutritionData["diabetes"] }) {
  const items = [
    {
      label: "Kohlenhydrate",
      value: data.carbs,
      unit: "g",
      icon: Wheat,
      color: "#6495ED",
      max: 50,
      tip: "< 50g/Mahlzeit empfohlen",
    },
    {
      label: "Broteinheiten",
      value: data.be,
      unit: "BE",
      icon: Zap,
      color: "#8B5CF6",
      max: 4,
      tip: "1 BE = 12g Kohlenhydrate",
    },
    {
      label: "Kalorien",
      value: data.calories,
      unit: "kcal",
      icon: Flame,
      color: "#F97316",
      max: 600,
      tip: "Richtgröße für Hauptmahlzeit",
    },
    {
      label: "Zucker",
      value: data.sugar,
      unit: "g",
      icon: Droplets,
      color: "#EC4899",
      max: 25,
      tip: "Freier Zucker",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: `linear-gradient(135deg, #EEF3FD, #D6E4FF)` }}
      >
        <Zap className="w-4 h-4" style={{ color: cornflower }} />
        <span className="text-sm font-medium" style={{ color: cornflower }}>
          Diabetes-relevante Werte
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const pct = Math.min((item.value / item.max) * 100, 100);
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl p-3 space-y-2"
              style={{ backgroundColor: `${item.color}10` }}
            >
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4" style={{ color: item.color }} />
                <span className="text-xs text-gray-400">{item.tip}</span>
              </div>
              <div>
                <span className="text-xl font-semibold" style={{ color: item.color }}>
                  {item.value}
                </span>
                <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
              </div>
              <p className="text-xs text-gray-500">{item.label}</p>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Fiber row */}
      <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wheat className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-gray-600">Ballaststoffe</span>
          <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100">
            Gut!
          </Badge>
        </div>
        <span className="font-medium text-emerald-600">{data.fiber} g</span>
      </div>
    </div>
  );
}

// ─── Ingredients List ──────────────────────────────────────────────────────────

function IngredientsList({
  ingredients,
  onUpdate,
}: {
  ingredients: Ingredient[];
  onUpdate: (updated: Ingredient[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const adjust = (id: string, delta: number) => {
    onUpdate(
      ingredients.map((ing) =>
        ing.id === id
          ? { ...ing, weight: Math.max(1, ing.weight + delta) }
          : ing
      )
    );
  };

  const remove = (id: string) => {
    onUpdate(ingredients.filter((ing) => ing.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center justify-between"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-sm font-medium text-gray-800">
          Erkannte Bestandteile ({ingredients.length})
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {ingredients.map((ing) => (
                <div key={ing.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cornflower}15` }}
                  >
                    <span className="text-xs" style={{ color: cornflower }}>
                      {ing.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{ing.name}</p>
                  </div>
                  {/* Weight stepper */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjust(ing.id, -5)}
                      className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-3 h-3 text-gray-500" />
                    </button>
                    <span className="text-sm text-gray-700 w-12 text-center">
                      {ing.weight}g
                    </span>
                    <button
                      onClick={() => adjust(ing.id, 5)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: `${cornflower}20` }}
                    >
                      <Plus className="w-3 h-3" style={{ color: cornflower }} />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(ing.id)}
                    className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Warning Banner ────────────────────────────────────────────────────────────

function UncertaintyWarning({ confidence }: { confidence: number }) {
  if (confidence >= 80) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3"
    >
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-800">Unsichere Analyse</p>
        <p className="text-xs text-amber-600 mt-0.5">
          Konfidenz unter 80%. Bitte überprüfe die erkannten Zutaten und
          korrigiere sie ggf. manuell. Für präzise BE-Berechnungen empfehlen
          wir eine manuelle Eingabe.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Full Nutrition Table ──────────────────────────────────────────────────────

function NutritionTable({ data }: { data: NutritionData }) {
  const [expanded, setExpanded] = useState(false);

  const rows = [
    { label: "Eiweiß", value: data.full.protein, unit: "g" },
    { label: "Fett gesamt", value: data.full.fat, unit: "g" },
    { label: "davon gesättigt", value: data.full.saturatedFat, unit: "g", sub: true },
    { label: "Natrium", value: data.full.sodium, unit: "mg" },
    { label: "Kalium", value: data.full.potassium, unit: "mg" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center justify-between"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-sm font-medium text-gray-800">
          Vollständige Nährwerttabelle
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-gray-600",
                          row.sub && "pl-8 text-gray-400"
                        )}
                      >
                        {row.label}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                        {row.value} {row.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  data,
  onClose,
  onSave,
}: {
  data: NutritionData;
  onClose: () => void;
  onSave: (updated: NutritionData) => void;
}) {
  const [meal, setMeal] = useState(data.meal);
  const [portion, setPortion] = useState(String(data.portion));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-gray-900">Manuell korrigieren</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-600 text-sm mb-1.5 block">Mahlzeit</Label>
            <Input
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              className="rounded-xl border-gray-200"
            />
          </div>
          <div>
            <Label className="text-gray-600 text-sm mb-1.5 block">
              Portionsgröße (g)
            </Label>
            <Input
              value={portion}
              type="number"
              onChange={(e) => setPortion(e.target.value)}
              className="rounded-xl border-gray-200"
            />
          </div>
          <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-600">
            Nährwerte werden automatisch auf die neue Portionsgröße umgerechnet.
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            className="flex-1 rounded-xl text-white"
            style={{ backgroundColor: cornflower }}
            onClick={() => {
              const scale = Number(portion) / data.portion;
              onSave({
                ...data,
                meal,
                portion: Number(portion),
                diabetes: {
                  carbs: Math.round(data.diabetes.carbs * scale * 10) / 10,
                  sugar: Math.round(data.diabetes.sugar * scale * 10) / 10,
                  fiber: Math.round(data.diabetes.fiber * scale * 10) / 10,
                  be: Math.round(data.diabetes.be * scale * 10) / 10,
                  calories: Math.round(data.diabetes.calories * scale),
                },
                full: {
                  protein: Math.round(data.full.protein * scale * 10) / 10,
                  fat: Math.round(data.full.fat * scale * 10) / 10,
                  saturatedFat: Math.round(data.full.saturatedFat * scale * 10) / 10,
                  sodium: Math.round(data.full.sodium * scale),
                  potassium: Math.round(data.full.potassium * scale),
                },
              });
              onClose();
            }}
          >
            Übernehmen
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Result View ───────────────────────────────────────────────────────────────

function ResultView({
  imageSrc,
  data,
  onReset,
  onSave,
}: {
  imageSrc: string;
  data: NutritionData;
  onReset: () => void;
  onSave: () => void;
}) {
  const [nutrition, setNutrition] = useState(data);
  const [ingredients, setIngredients] = useState(data.ingredients);

  const totalOriginalWeight = data.ingredients.reduce((sum, ing) => sum + ing.weight, 0);

  const handleIngredientsUpdate = useCallback((updated: Ingredient[]) => {
    setIngredients(updated);

    // Neue Gesamtmenge berechnen
    const newTotalWeight = updated.reduce((sum, ing) => sum + ing.weight, 0);
    if (totalOriginalWeight === 0) return;

    const scale = newTotalWeight / totalOriginalWeight;

    // Nährwerte skalieren
    setNutrition({
      ...data,
      portion: Math.round(newTotalWeight),
      diabetes: {
        carbs: Math.round(data.diabetes.carbs * scale * 10) / 10,
        sugar: Math.round(data.diabetes.sugar * scale * 10) / 10,
        fiber: Math.round(data.diabetes.fiber * scale * 10) / 10,
        be: Math.round(data.diabetes.be * scale * 10) / 10,
        calories: Math.round(data.diabetes.calories * scale),
      },
      full: {
        protein: Math.round(data.full.protein * scale * 10) / 10,
        fat: Math.round(data.full.fat * scale * 10) / 10,
        saturatedFat: Math.round(data.full.saturatedFat * scale * 10) / 10,
        sodium: Math.round(data.full.sodium * scale),
        potassium: Math.round(data.full.potassium * scale),
      },
    });
  }, [data, totalOriginalWeight]);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Meal Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {imageSrc !== "camera" && (
            <div className="h-40 w-full overflow-hidden">
              <img
                src={imageSrc}
                alt={nutrition.meal}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="px-4 py-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-gray-900 leading-tight">{nutrition.meal}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <ConfidenceBadge score={nutrition.confidence} />
                <span className="text-xs text-gray-400">
                  Portion: {nutrition.portion} {nutrition.portionUnit}
                </span>
              </div>
            </div>
            <button
              onClick={onReset}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Warning if low confidence */}
        <UncertaintyWarning confidence={nutrition.confidence} />

        {/* Diabetes Highlight */}
        <DiabetesHighlightCard data={nutrition.diabetes} />

        {/* Ingredients */}
        <IngredientsList ingredients={ingredients} onUpdate={handleIngredientsUpdate} />

        {/* Full Nutrition Table */}
        <NutritionTable data={nutrition} />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2 pb-6">
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-gray-200 text-gray-700 gap-2"
            onClick={() => setShowEdit(true)}
          >
            <Pencil className="w-4 h-4" />
            Manuell korrigieren
          </Button>
          <Button
            className="flex-1 rounded-xl text-white gap-2"
            style={{ backgroundColor: cornflower }}
            onClick={onSave}
          >
            <Save className="w-4 h-4" />
            Analyse speichern
          </Button>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <EditModal
            data={nutrition}
            onClose={() => setShowEdit(false)}
            onSave={(updated) => setNutrition(updated)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Saved Confirmation ────────────────────────────────────────────────────────

function SavedConfirmation({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 gap-5 text-center"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
        style={{ backgroundColor: "#D1FAE5" }}
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <div>
        <h2 className="text-gray-800">Analyse gespeichert!</h2>
        <p className="text-gray-500 text-sm mt-1">
          Die Nährwertanalyse wurde in deinem Tagebuch gespeichert.
        </p>
      </div>
      <button
        onClick={onReset}
        className="text-sm font-medium"
        style={{ color: cornflower }}
      >
        Neue Analyse starten
      </button>
    </motion.div>
  );
}

// ─── History View ──────────────────────────────────────────────────────────────

function HistoryView() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("scan-history") || "[]");
    setEntries(stored);
  }, []);

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem("scan-history", JSON.stringify(updated));
  };

  const saveEdit = (updated: NutritionData) => {
    if (!editingEntry) return;
    const newEntries = entries.map(e =>
      e.id === editingEntry.id ? { ...e, data: updated } : e
    );
    setEntries(newEntries);
    localStorage.setItem("scan-history", JSON.stringify(newEntries));
    setEditingEntry(null);
  };
  const duplicateEntry = (entry: HistoryEntry) => {
  const newEntry: HistoryEntry = {
    ...entry,
    id: Date.now().toString(),
    date: new Date().toLocaleString("de-DE"),
  };
  const updated = [newEntry, ...entries];
  setEntries(updated);
  localStorage.setItem("scan-history", JSON.stringify(updated));
};

  // Einträge nach Datum gruppieren
  const grouped = entries.reduce((acc: Record<string, HistoryEntry[]>, entry) => {
    const dateKey = new Date(Number(entry.id)).toLocaleDateString("de-DE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${cornflower}15` }}>
          <Camera className="w-8 h-8" style={{ color: cornflower }} />
        </div>
        <p className="text-gray-500 text-sm">Noch keine gespeicherten Analysen</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5 pb-6">
        {Object.entries(grouped).map(([date, dayEntries]) => (
          <div key={date}>
            {/* Datums-Header */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
              >
                {date}
              </div>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">{dayEntries.length} Scan{dayEntries.length > 1 ? "s" : ""}</span>
            </div>

            {/* Einträge des Tages */}
            <div className="flex flex-col gap-3">
              {dayEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    {entry.imageSrc ? (
                      <img src={entry.imageSrc} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cornflower}15` }}>
                        <Camera className="w-6 h-6" style={{ color: cornflower }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{entry.data.meal}</p>
                      {/* Uhrzeit */}
                      <p className="text-xs text-gray-400">
                        {new Date(Number(entry.id)).toLocaleTimeString("de-DE", {
                          hour: "2-digit", minute: "2-digit"
                        })} Uhr
                      </p>
                    </div>
                    <button
                      onClick={() => duplicateEntry(entry)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center mr-1"
                      style={{ backgroundColor: "#F0FDF4" }}
                    >
                      <Plus className="w-3 h-3 text-emerald-500" />
                    </button>
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center mr-1"
                      style={{ backgroundColor: `${cornflower}15` }}
                    >
                      <Pencil className="w-3 h-3" style={{ color: cornflower }} />
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2 grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">KH</p>
                      <p className="text-sm font-medium" style={{ color: cornflower }}>{entry.data.diabetes.carbs}g</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">BE</p>
                      <p className="text-sm font-medium text-purple-500">{entry.data.diabetes.be}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">kcal</p>
                      <p className="text-sm font-medium text-orange-500">{entry.data.diabetes.calories}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingEntry && (
          <EditModal
            data={editingEntry.data}
            onClose={() => setEditingEntry(null)}
            onSave={saveEdit}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function NutritionScan() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [imageSrc, setImageSrc] = useState<string>("");
  const [resultData, setResultData] = useState<NutritionData>(MOCK_RESULT);
  const [tab, setTab] = useState<"scan" | "history">("scan"); 

const handleCapture = useCallback(async (src: string) => {
    setImageSrc(src);
    setAppState("loading");

    // Barcode-Fall
    if (src.startsWith("barcode:")) {
      const product = JSON.parse(src.replace("barcode:", ""));
      const nutriments = product.nutriments || {};
      const carbs = nutriments["carbohydrates_100g"] ?? 0;

      setResultData({
        meal: product.product_name ?? "Unbekanntes Produkt",
        confidence: 100,
        portion: 100,
        portionUnit: "g",
        diabetes: {
          carbs: Math.round(carbs * 10) / 10,
          sugar: Math.round((nutriments["sugars_100g"] ?? 0) * 10) / 10,
          fiber: Math.round((nutriments["fiber_100g"] ?? 0) * 10) / 10,
          be: Math.round((carbs / 12) * 10) / 10,
          calories: Math.round(nutriments["energy-kcal_100g"] ?? 0),
        },
        full: {
          protein: Math.round((nutriments["proteins_100g"] ?? 0) * 10) / 10,
          fat: Math.round((nutriments["fat_100g"] ?? 0) * 10) / 10,
          saturatedFat: Math.round((nutriments["saturated-fat_100g"] ?? 0) * 10) / 10,
          sodium: Math.round((nutriments["sodium_100g"] ?? 0) * 1000),
          potassium: 0,
        },
        ingredients: [],
      });
      setAppState("result");
      return;
    }

    try {
      // Blob-URL zu Base64 umwandeln
      const blobResponse = await fetch(src);
      const blob = await blobResponse.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      const response = await fetch('http://localhost:3001/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      });

      const data = await response.json();

      setResultData({
        meal: data.meal,
        confidence: data.confidence,
        portion: data.ingredients?.reduce((sum: number, ing: any) => sum + (ing.weight ?? 0), 0) ?? 100,
        portionUnit: data.ingredients?.[0]?.unit ?? "g",
        diabetes: {
          carbs: data.diabetes?.carbs ?? 0,
          sugar: data.diabetes?.sugar ?? 0,
          fiber: data.diabetes?.fiber ?? 0,
          be: data.diabetes?.be ?? 0,
          calories: data.diabetes?.calories ?? 0,
        },
        full: {
          protein: data.full?.protein ?? 0,
          fat: data.full?.fat ?? 0,
          saturatedFat: 0,
          sodium: 0,
          potassium: 0,
        },
        ingredients: data.ingredients ?? [],
      });

      setAppState("result");
    } catch (err) {
      console.error(err);
      setResultData(MOCK_RESULT);
      setAppState("result");
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState("upload");
    setImageSrc("");
  }, []);

 const handleSave = useCallback(() => {
  const entry: HistoryEntry = {
    id: Date.now().toString(),
    date: new Date().toLocaleString("de-DE"),
    data: resultData,
    imageSrc: imageSrc.startsWith("barcode:") ? "" : imageSrc,
  };

  const existing = JSON.parse(localStorage.getItem("scan-history") || "[]");
  localStorage.setItem("scan-history", JSON.stringify([entry, ...existing]));
  setAppState("saved");
}, [resultData, imageSrc]);
return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${cornflower}20` }}
        >
          <Camera className="w-4 h-4" style={{ color: cornflower }} />
        </div>
        <div>
          <h1 className="text-gray-900 leading-none" style={{ fontSize: "1rem" }}>
            Nährwert-Scan
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">KI-Lebensmittelerkennung</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setTab("scan")}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{
              backgroundColor: tab === "scan" ? cornflower : `${cornflower}15`,
              color: tab === "scan" ? "white" : cornflower,
            }}
          >
            Scan
          </button>
          <button
            onClick={() => setTab("history")}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{
              backgroundColor: tab === "history" ? cornflower : `${cornflower}15`,
              color: tab === "history" ? "white" : cornflower,
            }}
          >
            Historie
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-5">
        {tab === "history" ? (
          <HistoryView />
        ) : (
          <AnimatePresence mode="wait">
            {appState === "upload" && (
              <motion.div key="upload" exit={{ opacity: 0, y: -16 }}>
                <UploadCard onCapture={handleCapture} />
              </motion.div>
            )}
            {appState === "loading" && (
              <motion.div key="loading" exit={{ opacity: 0 }}>
                <AnalysisLoading imageSrc={imageSrc} />
              </motion.div>
            )}
            {appState === "result" && (
              <motion.div key="result" exit={{ opacity: 0 }}>
                <ResultView
                  imageSrc={imageSrc}
                  data={resultData}
                  onReset={handleReset}
                  onSave={handleSave}
                />
              </motion.div>
            )}
            {appState === "saved" && (
              <motion.div key="saved" exit={{ opacity: 0 }}>
                <SavedConfirmation onReset={handleReset} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}