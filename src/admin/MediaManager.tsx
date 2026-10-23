import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteMedia, listMedia, updateMedia, uploadMedia } from "@/lib/api";
import { Button, EmptyState, Input } from "@/components/ui";
import { useUIStore } from "@/store/ui";
import { mediaMetadataSchema } from "@/lib/schemas";

export default function MediaManager() {
  const qc = useQueryClient();
  const mediaQ = useQuery({ queryKey: ["media"], queryFn: listMedia });
  const pushToast = useUIStore((s) => s.pushToast);
  const fileInput = useRef<HTMLInputElement>(null);
  const [altEn, setAltEn] = useState("");
  const [altBn, setAltBn] = useState("");
  const [altDrafts, setAltDrafts] = useState<Record<string, { alt_en: string; alt_bn: string }>>({});

  async function handleFile(file: File) {
    try {
      await uploadMedia(file, { alt_en: altEn, alt_bn: altBn });
      await qc.invalidateQueries({ queryKey: ["media"] });
      pushToast("আপলোড সম্পন্ন / Uploaded", "success");
      setAltEn("");
      setAltBn("");
    } catch (error) {
      pushToast(error instanceof Error ? `আপলোড ব্যর্থ / Upload failed: ${error.message}` : "আপলোড ব্যর্থ / Upload failed", "error");
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url);
    pushToast("URL কপি হয়েছে / URL copied", "success");
  }

  const items = mediaQ.data ?? [];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-semibold text-ink">মিডিয়া লাইব্রেরি / Media library</h1>
      <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Input placeholder="Alt text (EN)" value={altEn} onChange={(e) => setAltEn(e.target.value)} />
          <Input placeholder="Alt text (বাং)" value={altBn} onChange={(e) => setAltBn(e.target.value)} />
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button type="button" onClick={() => fileInput.current?.click()}>
          আপলোড / Upload
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="কোনো মিডিয়া নেই / No media yet" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((m) => (
            <div key={m.id} className="card space-y-2 p-3">
              {m.kind === "image" ? (
                <img src={m.url} alt={m.alt_en} className="h-28 w-full rounded-lg object-cover" />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-lg bg-bg-soft text-sm text-ink-muted">PDF</div>
              )}
              <Input
                aria-label="Alt text (English)"
                placeholder="Alt text (EN)"
                value={altDrafts[m.id]?.alt_en ?? m.alt_en}
                onChange={(event) => setAltDrafts((drafts) => ({
                  ...drafts,
                  [m.id]: { alt_en: event.target.value, alt_bn: drafts[m.id]?.alt_bn ?? m.alt_bn },
                }))}
              />
              <Input
                aria-label="Alt text (Bangla)"
                placeholder="Alt text (বাং)"
                value={altDrafts[m.id]?.alt_bn ?? m.alt_bn}
                onChange={(event) => setAltDrafts((drafts) => ({
                  ...drafts,
                  [m.id]: { alt_en: drafts[m.id]?.alt_en ?? m.alt_en, alt_bn: event.target.value },
                }))}
              />
              <div className="flex justify-between">
                <button
                  onClick={async () => {
                    const values = altDrafts[m.id] ?? { alt_en: m.alt_en, alt_bn: m.alt_bn };
                    const validation = mediaMetadataSchema.safeParse(values);
                    if (!validation.success) {
                      pushToast(validation.error.issues[0]?.message ?? "তথ্য যাচাই করুন / Please check the form", "error");
                      return;
                    }
                    try {
                      await updateMedia(m.id, values.alt_en, values.alt_bn);
                      await qc.invalidateQueries({ queryKey: ["media"] });
                      setAltDrafts((drafts) => {
                        const next = { ...drafts };
                        delete next[m.id];
                        return next;
                      });
                      pushToast("সংরক্ষিত হয়েছে / Saved", "success");
                    } catch (error) {
                      pushToast(error instanceof Error ? `সংরক্ষণ ব্যর্থ / Save failed: ${error.message}` : "সংரক্ষণ ব্যর্থ / Save failed", "error");
                    }
                  }}
                  className="text-xs font-medium text-teal-dark hover:underline"
                >
                  Save alt
                </button>
                <button onClick={() => copyUrl(m.url)} className="text-xs font-medium text-teal-dark hover:underline">
                  Copy URL
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deleteMedia(m.id);
                      await qc.invalidateQueries({ queryKey: ["media"] });
                      pushToast("মুছে ফেলা হয়েছে / Deleted", "success");
                    } catch (error) {
                      pushToast(error instanceof Error ? `মুছতে ব্যর্থ / Delete failed: ${error.message}` : "মুছতে ব্যর্থ / Delete failed", "error");
                    }
                  }}
                  className="text-xs font-medium text-coral-text hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
