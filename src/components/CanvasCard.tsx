"use client";

import { UseCaseCanvas, FitLevel } from "@/lib/useCaseCanvas";
import { cn } from "@/lib/utils";

interface Props {
  canvas: UseCaseCanvas;
  isPreview?: boolean;
  onUpdateFit?: (importance: FitLevel, frequency: FitLevel) => void;
}

const levelLabel: Record<FitLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const gridLevels: FitLevel[] = ["high", "medium", "low"]; // Ordre inversé pour la matrice

export const CanvasCard = ({ canvas, isPreview = false, onUpdateFit }: Props) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* General section - fond gris */}
      <div className="bg-emerald-500 px-4 py-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">General</h3>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Problem to solve</p>
          <p className="mt-1 text-sm text-zinc-700">{canvas.problemToSolve || "En cours de collecte..."}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Use case description</p>
          <p className="mt-1 text-sm text-zinc-700">{canvas.useCaseDescription || "En cours de collecte..."}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Data & product used</p>
          {canvas.dataAndProductUsed.length > 0 ? (
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
              {canvas.dataAndProductUsed.slice(0, 3).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-zinc-400">En cours...</p>
          )}
        </div>
      </div>

      {/* Objectives & key results - fond vert */}
      <div className="bg-emerald-500 px-4 py-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
          Objectives & key results – Strategic fit assessment
        </h3>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Business objective</p>
          <p className="mt-1 text-sm text-zinc-700">{canvas.businessObjective || "En cours de collecte..."}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Key results</p>
          {canvas.keyResults.length > 0 ? (
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
              {canvas.keyResults.map((kr, idx) => (
                <li key={idx}>{kr}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-zinc-400">En cours...</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Stakeholders</p>
          {canvas.stakeholders.length > 0 ? (
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
              {canvas.stakeholders.slice(0, 4).map((sh, idx) => (
                <li key={idx}>{sh}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-zinc-400">En cours...</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Strategic fit</p>
          <div className="relative mt-2">
            {/* Matrice 4x4 */}
            <div className="grid grid-cols-4 gap-[2px] text-[9px]">
              <div className="col-span-1" />
              {gridLevels.map((freq) => (
                <div key={freq} className="text-center font-semibold text-zinc-500">
                  {levelLabel[freq]}
                </div>
              ))}
              {gridLevels.map((importance) => (
                <>
                  <div key={`label-${importance}`} className="flex items-center justify-end pr-1 text-right font-semibold text-zinc-500">
                    {levelLabel[importance]}
                  </div>
                  {gridLevels.map((frequency) => (
                    <button
                      type="button"
                      key={`${importance}-${frequency}`}
                      onClick={() => onUpdateFit?.(importance, frequency)}
                      disabled={!onUpdateFit}
                      className={cn(
                        "aspect-square rounded border border-zinc-300 bg-white transition",
                        onUpdateFit && "hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer",
                        !onUpdateFit && "cursor-default",
                        importance === canvas.strategicFit.importance && frequency === canvas.strategicFit.frequency
                          ? "border-emerald-600 bg-emerald-400"
                          : "",
                      )}
                      title={onUpdateFit ? `Importance ${levelLabel[importance]} / Fréquence ${levelLabel[frequency]}` : undefined}
                    />
                  ))}
                </>
              ))}
            </div>
            
            {/* Labels axes */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold italic text-zinc-600">
              Frequency →
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold italic text-zinc-600" style={{ transformOrigin: "left center" }}>
              Importance / Value ↑
            </div>
          </div>
          <p className="mt-6 text-xs italic text-zinc-600">
            <span className="font-semibold">{levelLabel[canvas.strategicFit.importance]}</span> importance / 
            <span className="font-semibold"> {levelLabel[canvas.strategicFit.frequency]}</span> frequency
          </p>
        </div>
      </div>
      
      {isPreview && (
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-center">
          <p className="text-xs text-zinc-500">Aperçu temps réel · Mis à jour automatiquement pendant l'entretien</p>
        </div>
      )}
    </div>
  );
};

