"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PipelineItem } from "@/lib/pipeline";
import EditProjectModal from "@/components/EditProjectModal";
import { deleteProject } from "@/app/actions/project";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  item:    PipelineItem;
  squads:  string[];
  isAdmin: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectDetailActions({ item, squads, isAdmin }: Props) {
  const router = useRouter();
  const [localItem,          setLocalItem]          = useState<PipelineItem>(item);
  const [showEditModal,      setShowEditModal]      = useState(false);
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);
  const [deleting,           setDeleting]           = useState(false);

  async function handleEditSave(updated: PipelineItem) {
    try {
      await fetch(`/api/projects/${updated.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:           updated.title,
          description:     updated.description,
          impact:          updated.impact,
          squadName:       updated.squad,
          prd_url:         updated.prd_url,
          odd_url:         updated.odd_url,
          trd_url:         updated.trd_url,
          start_date:      updated.start_date,
          target_end_date: updated.target_end_date,
          completion_date: updated.completion_date ?? "",
        }),
      });
    } catch {
      // Best-effort — still update local state and refresh
    }
    setLocalItem(updated);
    setShowEditModal(false);
    router.refresh();
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    await deleteProject(localItem.id);
    // deleteProject calls redirect() server-side, so this line is unreachable
    // in practice — but keeps the UI in a "deleting" state until navigation completes.
  }

  return (
    <div className="shrink-0">
      {/* ── Header action buttons ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 text-sm font-medium border border-primary/30 text-slate-300 rounded-lg hover:bg-primary/5 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">share</span>
          Share
        </button>
        {isAdmin && (
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Project
          </button>
        )}
      </div>

      {/* ── Delete button (Admin only) — sits below the header buttons ──────── */}
      {isAdmin && (
        <DeleteProjectButton onRequest={() => setShowDeleteConfirm(true)} />
      )}

      {/* ── Edit modal ──────────────────────────────────────────────────────── */}
      {showEditModal && (
        <EditProjectModal
          item={localItem}
          squads={squads}
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* ── Delete confirmation dialog ──────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden">
            {/* Red accent bar */}
            <div className="h-1 bg-gradient-to-r from-red-500/60 via-red-400/60 to-red-500/60" />

            <div className="px-6 py-6 space-y-4">
              {/* Icon + title */}
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-red-400 text-[20px]">delete_forever</span>
                </div>
                <h2 className="text-base font-black text-white">Delete Project</h2>
              </div>

              {/* Message */}
              <p className="text-sm text-slate-400 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-200">{localItem.title}</span>?
                {" "}This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg border border-primary/30 text-slate-300 hover:bg-primary/5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <>
                      <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                      Deleting…
                    </>
                  ) : (
                    "Delete Project"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Delete trigger button (exported so parent can position it) ───────────────

export function DeleteProjectButton({ onRequest }: { onRequest: () => void }) {
  return (
    <button
      onClick={onRequest}
      className="mt-3 ml-auto px-3 py-1.5 text-xs font-medium border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5"
    >
      <span className="material-symbols-outlined text-[13px]">delete_forever</span>
      Delete Project
    </button>
  );
}
