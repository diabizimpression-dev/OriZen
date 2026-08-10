"use client";

// ─── Vault — Documents sécurisés ──────────────────────────────────────────────
// Stockage session uniquement (sessionStorage). Aucune donnée ne quitte le device.
// Fermer l'onglet = tout effacé. Zéro backend, zéro cookie.

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Lock, Trash2, Eye,
  FileText, Image, Shield, AlertCircle, X, Download
} from "lucide-react";

interface VaultDoc {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  category: string;
  addedAt: number;
}

const CATEGORIES = [
  { id: "identite",  label: "Identité",        emoji: "🪪" },
  { id: "sante",     label: "Santé",            emoji: "🏥" },
  { id: "logement",  label: "Logement",         emoji: "🏠" },
  { id: "social",    label: "Aide sociale",     emoji: "📋" },
  { id: "justice",   label: "Justice / Droit",  emoji: "⚖️" },
  { id: "autre",     label: "Autre",            emoji: "📎" },
];

const STORAGE_KEY = "orizen_vault_v1";
const MAX_TOTAL_MB = 20;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <Image size={18} className="text-sky-400" />;
  return <FileText size={18} className="text-indigo-400" />;
}

export default function VaultPage() {
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [preview, setPreview] = useState<VaultDoc | null>(null);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setDocs(JSON.parse(raw));
    } catch { /* sessionStorage inaccessible */ }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch { /* quota dépassé */ }
  }, [docs]);

  const totalSize = docs.reduce((acc, d) => acc + d.size, 0);
  const totalMb = totalSize / (1024 * 1024);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !addingCategory) return;

    setUploading(true);
    const newDocs: VaultDoc[] = [];

    for (const file of files) {
      if (totalMb + file.size / (1024 * 1024) > MAX_TOTAL_MB) {
        alert(`Limite de ${MAX_TOTAL_MB} Mo atteinte. Supprimez des documents.`);
        break;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        newDocs.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          category: addingCategory,
          addedAt: Date.now(),
        });
      } catch { /* skip */ }
    }

    setDocs((prev) => [...prev, ...newDocs]);
    setAddingCategory(null);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteDoc = (id: string) => {
    if (confirm("Supprimer ce document ?")) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const clearAll = () => {
    if (confirm("Vider complètement le coffre ?")) {
      setDocs([]);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    docs: docs.filter((d) => d.category === cat.id),
  })).filter((cat) => cat.docs.length > 0);

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#020617]/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-indigo-400" />
              <h1 className="font-bold text-white text-sm">Coffre-fort de documents</h1>
            </div>
            <p className="text-xs text-slate-500">Session uniquement · {formatSize(totalSize)} utilisés</p>
          </div>
          {docs.length > 0 && (
            <button
              onClick={clearAll}
              className="p-2 rounded-xl text-red-400 hover:bg-red-900/20 transition-colors"
              title="Tout effacer"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-5 max-w-lg mx-auto">
        {/* Alerte sécurité */}
        <AnimatePresence>
          {showWarning && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex gap-3"
            >
              <Shield size={18} className="text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-indigo-300 mb-1">Sécurité maximale</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vos documents restent sur votre appareil. Supprimés automatiquement à la fermeture de l&apos;onglet. Aucune donnée envoyée.
                </p>
              </div>
              <button onClick={() => setShowWarning(false)} className="shrink-0 text-slate-600 hover:text-slate-400">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barre d'utilisation */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Espace utilisé</span>
            <span>{formatSize(totalSize)} / {MAX_TOTAL_MB} Mo</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (totalMb / MAX_TOTAL_MB) * 100)}%`,
                background: totalMb > MAX_TOTAL_MB * 0.8 ? "#EF4444" : "#6366F1",
              }}
            />
          </div>
        </div>

        {/* Boutons d'ajout par catégorie */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Ajouter un document
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setAddingCategory(cat.id);
                  setTimeout(() => fileInputRef.current?.click(), 50);
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
                style={{
                  background: addingCategory === cat.id ? "#6366F120" : "#0f172a",
                  borderColor: addingCategory === cat.id ? "#6366F140" : "#1e293b",
                }}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-xs text-slate-400 text-center leading-tight">{cat.label}</span>
                {docs.filter((d) => d.category === cat.id).length > 0 && (
                  <span className="text-xs font-bold text-indigo-400">
                    {docs.filter((d) => d.category === cat.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {uploading && (
          <div className="flex items-center gap-2 mb-4 text-indigo-400 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Traitement en cours…
          </div>
        )}

        {/* Documents groupés par catégorie */}
        {grouped.length === 0 ? (
          <div className="text-center py-14 text-slate-600">
            <Lock size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun document stocké</p>
            <p className="text-xs mt-1">Appuyez sur une catégorie pour ajouter</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{cat.emoji}</span>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{cat.label}</h3>
                  <span className="text-xs text-slate-600">({cat.docs.length})</span>
                </div>
                <div className="flex flex-col gap-2">
                  {cat.docs.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      {getFileIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500">{formatSize(doc.size)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreview(doc)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <a
                          href={doc.dataUrl}
                          download={doc.name}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={() => deleteDoc(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Avertissement légal */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex gap-2">
          <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Ce coffre est temporaire. Pour une conservation pérenne, utilisez Proton Drive ou Cozy Cloud. OriZen ne peut pas récupérer vos documents si vous fermez l&apos;onglet.
          </p>
        </div>
      </div>

      {/* Modale aperçu */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
            onClick={() => setPreview(null)}
          >
            <div
              className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-white font-medium truncate flex-1">{preview.name}</p>
              <div className="flex items-center gap-2">
                <a
                  href={preview.dataUrl}
                  download={preview.name}
                  className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              {preview.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.dataUrl}
                  alt={preview.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : preview.type === "application/pdf" ? (
                <iframe
                  src={preview.dataUrl}
                  className="w-full h-full rounded-lg"
                  title={preview.name}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="text-center text-slate-400" onClick={(e) => e.stopPropagation()}>
                  <FileText size={64} className="mx-auto mb-4 opacity-40" />
                  <p className="text-sm">Aperçu non disponible</p>
                  <a
                    href={preview.dataUrl}
                    download={preview.name}
                    className="mt-4 inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
                  >
                    Télécharger
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
