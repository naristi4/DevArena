"use client";

import { useRef, useState } from "react";
import type { Attachment } from "@/lib/pipeline";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf")                             return "picture_as_pdf";
  if (ext === "docx" || ext === "doc")           return "description";
  if (ext === "pptx" || ext === "ppt")           return "slideshow";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "image";
  return "attach_file";
}

function getFileIconColor(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf")                             return "text-red-400";
  if (ext === "docx" || ext === "doc")           return "text-blue-400";
  if (ext === "pptx" || ext === "ppt")           return "text-orange-400";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "text-emerald-400";
  return "text-slate-400";
}

/** Returns a brand icon (material symbol name) + color for known link domains */
function getLinkMeta(url: string): { icon: string; color: string; domain: string } {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    if (hostname.includes("figma.com"))    return { icon: "design_services", color: "text-purple-400", domain: "figma.com"  };
    if (hostname.includes("notion.so"))    return { icon: "auto_stories",    color: "text-slate-300",  domain: "notion.so"  };
    if (hostname.includes("docs.google"))  return { icon: "edit_document",   color: "text-blue-400",   domain: "docs.google.com" };
    if (hostname.includes("loom.com"))     return { icon: "videocam",        color: "text-violet-400", domain: "loom.com"   };
    if (hostname.includes("miro.com"))     return { icon: "dashboard",       color: "text-yellow-400", domain: "miro.com"   };
    if (hostname.includes("github.com"))   return { icon: "code",            color: "text-slate-300",  domain: "github.com" };
    if (hostname.includes("linear.app"))   return { icon: "linear_scale",    color: "text-indigo-400", domain: "linear.app" };
    return { icon: "link", color: "text-primary", domain: hostname };
  } catch {
    return { icon: "link", color: "text-primary", domain: "" };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  projectId:          string;
  initialAttachments: Attachment[];
  currentUser:        string;
  isAdmin:            boolean;
  canEdit:            boolean;  // true for admin + same-squad members
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectAttachments({
  projectId,
  initialAttachments,
  currentUser,
  isAdmin,
  canEdit,
}: Props) {
  const { t } = useLanguage();
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [error, setError]             = useState<string | null>(null);
  const [busy, setBusy]               = useState(false);

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkName, setLinkName]           = useState("");
  const [linkUrl, setLinkUrl]             = useState("");
  const [linkError, setLinkError]         = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Add link ────────────────────────────────────────────────────────────────

  function openLinkModal() {
    setLinkName("");
    setLinkUrl("");
    setLinkError(null);
    setShowLinkModal(true);
  }

  async function handleSaveLink() {
    const name = linkName.trim();
    const url  = linkUrl.trim();

    if (!name || !url) {
      setLinkError("Both name and URL are required.");
      return;
    }
    try { new URL(url); } catch {
      setLinkError(t.projectDetail.linkInvalidUrl);
      return;
    }
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      setLinkError(t.projectDetail.linkInvalidUrl);
      return;
    }

    setBusy(true);
    setLinkError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/attachments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, url }),
      });
      if (!res.ok) {
        const data = await res.json();
        setLinkError(data.error ?? "Failed to save link.");
        return;
      }
      const att: Attachment = await res.json();
      setAttachments((prev) => [att, ...prev]);
      setShowLinkModal(false);
    } catch {
      setLinkError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── Upload file ─────────────────────────────────────────────────────────────

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected

    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const res = await fetch(`/api/projects/${projectId}/attachments`, {
        method: "POST",
        body:   formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Upload failed.");
        return;
      }
      const att: Attachment = await res.json();
      setAttachments((prev) => [att, ...prev]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch { /* silently ignore */ }
  }

  function canDelete(att: Attachment): boolean {
    if (isAdmin) return true;
    return canEdit && att.uploaded_by === currentUser;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-primary/20 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-200">{t.projectDetail.additionalDocs}</h3>
            {attachments.length > 0 && (
              <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
                {attachments.length}
              </span>
            )}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              {/* Upload File */}
              <button
                onClick={handleUploadClick}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">upload</span>
                {t.projectDetail.uploadFile}
              </button>

              {/* Add Link */}
              <button
                onClick={openLinkModal}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">add_link</span>
                {t.projectDetail.addLink}
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Busy indicator */}
        {busy && (
          <div className="px-5 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2 text-xs text-primary">
            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
            {t.projectDetail.uploading}
          </div>
        )}

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
            <p className="text-xs text-slate-600 mt-1">{t.projectDetail.attachmentHint}</p>
          </div>
        ) : (
          <div className="divide-y divide-primary/10 max-h-96 overflow-y-auto">
            {attachments.map((att) => {
              const isLink = att.type === "link";
              const linkMeta = isLink ? getLinkMeta(att.file_url) : null;

              return (
                <div
                  key={att.id}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-primary/5 transition-colors group"
                >
                  {/* Icon */}
                  <div
                    className={`size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${
                      isLink ? linkMeta!.color : getFileIconColor(att.file_name)
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isLink ? linkMeta!.icon : getFileIcon(att.file_name)}
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
                      {isLink
                        ? `${linkMeta!.domain} · ${att.uploaded_by} · ${formatDate(att.uploaded_at)}`
                        : `${att.uploaded_by} · ${formatDate(att.uploaded_at)}`}
                    </p>
                  </a>

                  {/* Type badge */}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isLink
                      ? "bg-violet-500/10 text-violet-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {isLink ? "LINK" : "FILE"}
                  </span>

                  {/* Delete */}
                  {canDelete(att) && (
                    <button
                      onClick={() => handleDelete(att.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      title={t.projectDetail.deleteAttachment}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Link Modal ── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-primary/20 rounded-2xl w-full max-w-md shadow-2xl">

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">add_link</span>
                <h2 className="text-sm font-bold text-slate-100">{t.projectDetail.addLinkTitle}</h2>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t.projectDetail.linkName}
                </label>
                <input
                  type="text"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder={t.projectDetail.linkNamePlaceholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t.projectDetail.linkUrl}
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveLink(); }}
                  placeholder={t.projectDetail.linkUrlPlaceholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
                />
              </div>

              {/* Inline error */}
              {linkError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
                  <span className="material-symbols-outlined text-[14px] shrink-0">error</span>
                  {linkError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-primary/20 flex justify-end gap-3">
              <button
                onClick={() => setShowLinkModal(false)}
                disabled={busy}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSaveLink}
                disabled={busy || !linkName.trim() || !linkUrl.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {busy && (
                  <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                )}
                {busy ? t.projectDetail.saving : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
