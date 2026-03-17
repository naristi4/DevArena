"use client";

import { useRef, useState } from "react";
import type { Attachment } from "@/lib/pipeline";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "image/png",
  "image/jpeg",
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf")                    return "picture_as_pdf";
  if (ext === "docx" || ext === "doc")  return "description";
  if (ext === "pptx" || ext === "ppt")  return "slideshow";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "image";
  return "attach_file";
}

function getFileIconColor(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf")                    return "text-red-400";
  if (ext === "docx" || ext === "doc")  return "text-blue-400";
  if (ext === "pptx" || ext === "ppt")  return "text-orange-400";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "text-emerald-400";
  return "text-slate-400";
}

function formatUploadDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialAttachments: Attachment[];
  currentUser:        string;
  isAdmin:            boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectAttachments({
  initialAttachments,
  currentUser,
  isAdmin,
}: Props) {
  const { t } = useLanguage();
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [error, setError]             = useState<string | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  // ── Upload ─────────────────────────────────────────────────────────────────

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = "";

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t.projectDetail.badFileType);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(t.projectDetail.fileTooLarge);
      return;
    }

    setError(null);

    const newAttachment: Attachment = {
      id:          `att-${Date.now()}`,
      file_name:   file.name,
      file_url:    URL.createObjectURL(file),
      uploaded_by: currentUser,
      uploaded_at: new Date().toISOString(),
    };

    setAttachments((prev) => [...prev, newAttachment]);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  function handleDelete(id: string) {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      // Revoke blob URL to free memory (only for client-uploaded files)
      if (att?.file_url.startsWith("blob:")) {
        URL.revokeObjectURL(att.file_url);
      }
      return prev.filter((a) => a.id !== id);
    });
  }

  function canDelete(att: Attachment): boolean {
    if (isAdmin) return true;
    return att.uploaded_by === currentUser;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-200">{t.projectDetail.additionalDocs}</h3>
          {attachments.length > 0 && (
            <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
              {attachments.length}
            </span>
          )}
        </div>
        <button
          onClick={handleUploadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">upload</span>
          {t.common.upload}
        </button>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-5 py-2.5 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2 text-xs text-red-400">
          <span className="material-symbols-outlined text-[14px] shrink-0">error</span>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400/60 hover:text-red-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Attachment list / empty state */}
      {attachments.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <span className="material-symbols-outlined text-slate-600 text-[30px] block mb-2">
            folder_open
          </span>
          <p className="text-sm text-slate-500">{t.projectDetail.noAttachments}</p>
          <p className="text-xs text-slate-600 mt-1">
            {t.projectDetail.attachmentHint}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-primary/10">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="px-5 py-3 flex items-center gap-3 hover:bg-primary/5 transition-colors group"
            >
              {/* File type icon */}
              <div
                className={`size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${getFileIconColor(att.file_name)}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {getFileIcon(att.file_name)}
                </span>
              </div>

              {/* Name + meta */}
              <a
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 group/link"
              >
                <p className="text-sm font-medium text-slate-200 truncate group-hover/link:text-primary transition-colors">
                  {att.file_name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {att.uploaded_by} · {formatUploadDate(att.uploaded_at)}
                </p>
              </a>

              {/* Delete button — visible on hover, shown only if permitted */}
              {canDelete(att) && (
                <button
                  onClick={() => handleDelete(att.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Delete attachment"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
