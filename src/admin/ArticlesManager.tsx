import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import DOMPurify from "dompurify";
import { deleteArticle, listArticlesAdmin, listSimple, reorderArticles, saveArticle } from "@/lib/api";
import type { Article, ArticleCategory } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { now } from "@/lib/mockDb";
import { DataTable, MediaUploadField, type Column } from "@/admin/shared";
import { Badge, Button, FieldWrap, Input, Modal, Select } from "@/components/ui";
import { useUIStore } from "@/store/ui";
import { articleAdminSchema } from "@/lib/schemas";

const emptyArticle = (): Article => ({
  id: "",
  slug: "",
  category_id: null,
  title_en: "",
  title_bn: "",
  excerpt_en: "",
  excerpt_bn: "",
  body_en: "",
  body_bn: "",
  cover_image: "",
  author: "",
  status: "draft",
  published_at: null,
  seo_title_en: "",
  seo_title_bn: "",
  seo_description_en: "",
  seo_description_bn: "",
  sort_order: 0,
  created_at: "",
  updated_at: "",
});

function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, Link, Placeholder.configure({ placeholder: "লিখুন... / Write here..." })],
    content: value,
    immediatelyRender: false,
    editorProps: { attributes: { class: "prose prose-sm max-w-none min-h-[160px] focus:outline-none" } },
    onUpdate: ({ editor }: { editor: Editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-2 flex flex-wrap gap-1 border-b border-border pb-2">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>B</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>I</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>H2</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>• List</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>" Quote</ToolbarBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${active ? "bg-teal text-white" : "bg-bg-soft text-ink-muted hover:bg-border/60"}`}
    >
      {children}
    </button>
  );
}

export default function ArticlesManager() {
  const qc = useQueryClient();
  const articlesQ = useQuery({ queryKey: ["articles-admin"], queryFn: listArticlesAdmin });
  const categoriesQ = useQuery({ queryKey: ["article_categories"], queryFn: () => listSimple<ArticleCategory>("article_categories", { includeUnpublished: true }) });
  const pushToast = useUIStore((s) => s.pushToast);
  const [editing, setEditing] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState<Article | null>(null);
  const [lang, setLang] = useState<"en" | "bn">("bn");

  const items = articlesQ.data ?? [];

  function set<K extends keyof Article>(key: K, value: Article[K]) {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave(status?: Article["status"]) {
    if (!editing) return;
    const toSave: Article = {
      ...editing,
      slug: editing.slug || slugify(editing.title_en || editing.title_bn),
      sort_order: editing.sort_order || items.length + 1,
      body_en: DOMPurify.sanitize(editing.body_en, { USE_PROFILES: { html: true } }),
      body_bn: DOMPurify.sanitize(editing.body_bn, { USE_PROFILES: { html: true } }),
      status: status ?? editing.status,
      published_at: (status ?? editing.status) === "published" ? editing.published_at || now() : editing.published_at,
    };
    const validation = articleAdminSchema.safeParse(toSave);
    if (!validation.success) {
      pushToast(validation.error.issues[0]?.message ?? "তথ্য যাচাই করুন / Please check the form", "error");
      return;
    }
    try {
      await saveArticle(toSave);
      await qc.invalidateQueries({ queryKey: ["articles-admin"] });
      await qc.invalidateQueries({ queryKey: ["articles"] });
      await qc.invalidateQueries({ queryKey: ["article"] });
      pushToast("সংরক্ষিত হয়েছে / Saved", "success");
      setEditing(null);
    } catch (error) {
      pushToast(error instanceof Error ? `সংরক্ষণ ব্যর্থ / Save failed: ${error.message}` : "সংরক্ষণ ব্যর্থ / Save failed", "error");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteArticle(deleting.id);
      await qc.invalidateQueries({ queryKey: ["articles-admin"] });
      await qc.invalidateQueries({ queryKey: ["articles"] });
      await qc.invalidateQueries({ queryKey: ["article"] });
      pushToast("মুছে ফেলা হয়েছে / Deleted", "success");
      setDeleting(null);
    } catch (error) {
      pushToast(error instanceof Error ? `মুছতে ব্যর্থ / Delete failed: ${error.message}` : "মুছতে ব্যর্থ / Delete failed", "error");
    }
  }

  const columns: Column<Article>[] = [
    { key: "title_bn", label: "শিরোনাম", render: (a) => `${a.title_bn || "(untitled)"} / ${a.title_en}` },
    { key: "author", label: "Author" },
    {
      key: "status",
      label: "Status",
      render: (a) =>
        a.status === "published" ? <Badge tone="teal">Published</Badge> : a.status === "draft" ? <Badge tone="sand">Draft</Badge> : <Badge>Archived</Badge>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">নিবন্ধ / Articles</h1>
        <Button onClick={() => setEditing(emptyArticle())}>+ নতুন নিবন্ধ / New article</Button>
      </div>

      {articlesQ.isLoading ? (
        <p className="text-ink-muted">Loading...</p>
      ) : (
        <DataTable
          items={items}
          columns={columns}
          onEdit={(a) => setEditing(a)}
          onDelete={(a) => setDeleting(a)}
          onReorder={(ids) => reorderArticles(ids)
            .then(async () => {
              await qc.invalidateQueries({ queryKey: ["articles-admin"] });
              await qc.invalidateQueries({ queryKey: ["articles"] });
            })
            .catch(async (error: unknown) => {
              pushToast(error instanceof Error ? `পুনর্বিন্যাস ব্যর্থ / Reorder failed: ${error.message}` : "পুনর্বিন্যাস ব্যর্থ / Reorder failed", "error");
              await qc.invalidateQueries({ queryKey: ["articles-admin"] });
              await qc.invalidateQueries({ queryKey: ["articles"] });
            })}
        />
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.title_en || "নতুন নিবন্ধ / New article"} wide>
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrap label="Author"><Input value={editing.author} onChange={(e) => set("author", e.target.value)} /></FieldWrap>
              <FieldWrap label="Category">
                <Select value={editing.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}>
                  <option value="">—</option>
                  {(categoriesQ.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name_bn} / {c.name_en}</option>
                  ))}
                </Select>
              </FieldWrap>
              <MediaUploadField label="Cover image URL" value={editing.cover_image} onChange={(value) => set("cover_image", value)} />
              <FieldWrap label="Slug"><Input value={editing.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from title" /></FieldWrap>
            </div>

            <div className="flex gap-2">
              <ToolbarBtn onClick={() => setLang("en")} active={lang === "en"}>English</ToolbarBtn>
              <ToolbarBtn onClick={() => setLang("bn")} active={lang === "bn"}>বাংলা</ToolbarBtn>
            </div>

            {lang === "en" ? (
              <div className="space-y-3">
                <FieldWrap label="Title (EN)"><Input value={editing.title_en} onChange={(e) => set("title_en", e.target.value)} /></FieldWrap>
                <FieldWrap label="Excerpt (EN)"><Input value={editing.excerpt_en} onChange={(e) => set("excerpt_en", e.target.value)} /></FieldWrap>
                <FieldWrap label="Body (EN)">
                  <RichEditor value={editing.body_en} onChange={(html) => set("body_en", html)} />
                </FieldWrap>
              </div>
            ) : (
              <div className="space-y-3">
                <FieldWrap label="Title (বাং)"><Input value={editing.title_bn} onChange={(e) => set("title_bn", e.target.value)} /></FieldWrap>
                <FieldWrap label="Excerpt (বাং)"><Input value={editing.excerpt_bn} onChange={(e) => set("excerpt_bn", e.target.value)} /></FieldWrap>
                <FieldWrap label="Body (বাং)">
                  <RichEditor value={editing.body_bn} onChange={(html) => set("body_bn", html)} />
                </FieldWrap>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button variant="secondary" onClick={() => setEditing(null)}>বাতিল / Cancel</Button>
              <Button variant="secondary" onClick={() => handleSave("draft")}>ড্রাফট সংরক্ষণ / Save draft</Button>
              <Button onClick={() => handleSave("published")}>প্রকাশ করুন / Publish</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="নিশ্চিত করুন / Confirm delete">
        <p className="text-sm text-ink-muted">{deleting?.title_en} — আপনি কি নিশ্চিত? / Are you sure?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>বাতিল / Cancel</Button>
          <Button className="bg-coral text-coral-ink hover:bg-coral/90" onClick={handleDelete}>মুছুন / Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
