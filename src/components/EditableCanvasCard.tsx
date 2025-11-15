"use client";

import { useState } from "react";
import { UseCaseCanvas, FitLevel } from "@/lib/useCaseCanvas";
import { cn } from "@/lib/utils";
import { Edit2, Save, X } from "lucide-react";

interface Props {
  canvas: UseCaseCanvas;
  onUpdate: (updatedCanvas: UseCaseCanvas) => void;
}

const levelLabel: Record<FitLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const gridLevels: FitLevel[] = ["high", "medium", "low"];

export const EditableCanvasCard = ({ canvas, onUpdate }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCanvas, setEditedCanvas] = useState(canvas);

  const handleSave = () => {
    onUpdate(editedCanvas);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedCanvas(canvas);
    setIsEditing(false);
  };

  const updateField = (field: keyof UseCaseCanvas, value: any) => {
    setEditedCanvas((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: "dataAndProductUsed" | "keyResults" | "stakeholders", index: number, value: string) => {
    setEditedCanvas((prev) => {
      const arr = [...(prev[field] as string[])];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (field: "dataAndProductUsed" | "keyResults" | "stakeholders") => {
    setEditedCanvas((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), ""],
    }));
  };

  const removeArrayItem = (field: "dataAndProductUsed" | "keyResults" | "stakeholders", index: number) => {
    setEditedCanvas((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const currentCanvas = isEditing ? editedCanvas : canvas;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Header avec bouton édition */}
      <div className="flex items-center justify-between bg-emerald-500 px-4 py-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Canevas Use Case</h3>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/30"
          >
            <Edit2 className="h-3 w-3" />
            Éditer
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-white/90"
            >
              <Save className="h-3 w-3" />
              Sauvegarder
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/30"
            >
              <X className="h-3 w-3" />
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* General section */}
      <div className="grid gap-4 p-4 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Problem to solve</p>
          {isEditing ? (
            <textarea
              value={currentCanvas.problemToSolve}
              onChange={(e) => updateField("problemToSolve", e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-700 focus:border-emerald-500 focus:outline-none"
              rows={3}
            />
          ) : (
            <p className="mt-1 text-sm text-zinc-700">{currentCanvas.problemToSolve || "En cours..."}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Use case description</p>
          {isEditing ? (
            <textarea
              value={currentCanvas.useCaseDescription}
              onChange={(e) => updateField("useCaseDescription", e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-700 focus:border-emerald-500 focus:outline-none"
              rows={3}
            />
          ) : (
            <p className="mt-1 text-sm text-zinc-700">{currentCanvas.useCaseDescription || "En cours..."}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Data & product used</p>
          {isEditing ? (
            <div className="mt-1 space-y-1">
              {currentCanvas.dataAndProductUsed.map((item, idx) => (
                <div key={idx} className="flex gap-1">
                  <input
                    value={item}
                    onChange={(e) => updateArrayField("dataAndProductUsed", idx, e.target.value)}
                    className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("dataAndProductUsed", idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem("dataAndProductUsed")}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                + Ajouter
              </button>
            </div>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
              {currentCanvas.dataAndProductUsed.slice(0, 3).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Objectives section */}
      <div className="bg-emerald-500 px-4 py-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
          Objectives & key results – Strategic fit assessment
        </h3>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Business objective</p>
          {isEditing ? (
            <textarea
              value={currentCanvas.businessObjective}
              onChange={(e) => updateField("businessObjective", e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-700"
              rows={3}
            />
          ) : (
            <p className="mt-1 text-sm text-zinc-700">{currentCanvas.businessObjective || "En cours..."}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Key results</p>
          {isEditing ? (
            <div className="mt-1 space-y-1">
              {currentCanvas.keyResults.map((kr, idx) => (
                <div key={idx} className="flex gap-1">
                  <input
                    value={kr}
                    onChange={(e) => updateArrayField("keyResults", idx, e.target.value)}
                    className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("keyResults", idx)}
                    className="text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem("keyResults")}
                className="text-xs text-emerald-600"
              >
                + Ajouter
              </button>
            </div>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
              {currentCanvas.keyResults.map((kr, idx) => (
                <li key={idx}>{kr}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Stakeholders</p>
          {isEditing ? (
            <div className="mt-1 space-y-1">
              {currentCanvas.stakeholders.map((sh, idx) => (
                <div key={idx} className="flex gap-1">
                  <input
                    value={sh}
                    onChange={(e) => updateArrayField("stakeholders", idx, e.target.value)}
                    className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("stakeholders", idx)}
                    className="text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem("stakeholders")}
                className="text-xs text-emerald-600"
              >
                + Ajouter
              </button>
            </div>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
              {currentCanvas.stakeholders.slice(0, 4).map((sh, idx) => (
                <li key={idx}>{sh}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Strategic fit</p>
          <div className="relative mt-2">
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
                      onClick={() =>
                        updateField("strategicFit", {
                          ...currentCanvas.strategicFit,
                          importance,
                          frequency,
                        })
                      }
                      className={cn(
                        "aspect-square rounded border border-zinc-300 bg-white transition hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer",
                        importance === currentCanvas.strategicFit.importance && frequency === currentCanvas.strategicFit.frequency
                          ? "border-emerald-600 bg-emerald-400"
                          : "",
                      )}
                      title={`Importance ${levelLabel[importance]} / Fréquence ${levelLabel[frequency]}`}
                    />
                  ))}
                </>
              ))}
            </div>
            
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold italic text-zinc-600">
              Frequency →
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold italic text-zinc-600" style={{ transformOrigin: "left center" }}>
              Importance / Value ↑
            </div>
          </div>
          <div className="mt-6">
            {isEditing ? (
              <textarea
                value={currentCanvas.strategicFit.rationale}
                onChange={(e) =>
                  updateField("strategicFit", {
                    ...currentCanvas.strategicFit,
                    rationale: e.target.value,
                  })
                }
                placeholder="Rationale..."
                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
                rows={2}
              />
            ) : (
              <p className="text-xs italic text-zinc-600">
                <span className="font-semibold">{levelLabel[currentCanvas.strategicFit.importance]}</span> importance / 
                <span className="font-semibold"> {levelLabel[currentCanvas.strategicFit.frequency]}</span> frequency
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-center">
        <p className="text-xs text-zinc-500">
          {isEditing ? "Mode édition · Modifiez les champs puis sauvegardez" : "Canevas normalisé · Cliquez sur 'Éditer' pour ajuster"}
        </p>
      </div>
    </div>
  );
};

