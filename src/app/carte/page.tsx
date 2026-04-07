"use client";

import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Map = dynamic(() => import("../../components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500">
      Chargement de la carte...
    </div>
  ),
});

function CarteContent() {
  const params = useSearchParams();
  const besoin = params.get("besoin") ?? "tous";
  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1">
        <Map besoin={besoin} />
      </main>
    </div>
  );
}

export default function CartePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-900 flex items-center justify-center text-slate-500">Chargement...</div>}>
      <CarteContent />
    </Suspense>
  );
}
