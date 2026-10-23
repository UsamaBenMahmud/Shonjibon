import { useEffect, useState, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, EmptyState, Input, Modal, Select, Textarea, FieldWrap } from "@/components/ui";
import { useUIStore } from "@/store/ui";
import { genId } from "@/lib/utils";
import { uploadMedia } from "@/lib/api";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Generic, schema-driven building blocks reused by every admin manager page.
// ---------------------------------------------------------------------------

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

export function DataTable<T extends { id: string; sort_order?: number }>({
  items,
  columns,
  onEdit,
  onDelete,
  onAdd,
  onReorder,
  addLabel = "নতুন যোগ করুন / Add new",
  emptyTitle = "কিছু নেই / Nothing yet",
}: {
  items: T[];
  columns: Column<T>[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onAdd?: () => void;
  onReorder?: (orderedIds: string[]) => void;
  addLabel?: string;
  emptyTitle?: string;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [localItems, setLocalItems] = useState(items);
  useEffect(() => setLocalItems(items), [items]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localItems.findIndex((i) => i.id === active.id);
    const newIndex = localItems.findIndex((i) => i.id === over.id);
    const next = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(next);
    onReorder?.(next.map((i) => i.id));
  }

  return (
    <div className="space-y-4">
      {onAdd && (
        <div className="flex justify-end">
          <Button onClick={onAdd}>+ {addLabel}</Button>
        </div>
      )}
      {localItems.length === 0 ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-soft text-left text-ink-muted">
                {onReorder && <th className="w-8 px-3 py-3" />}
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">···</th>
              </tr>
            </thead>
            {onReorder ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={localItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {localItems.map((item) => (
                      <SortableRow key={item.id} item={item} columns={columns} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                  </tbody>
                </SortableContext>
              </DndContext>
            ) : (
              <tbody>
                {localItems.map((item) => (
                  <Row key={item.id} item={item} columns={columns} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </tbody>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

function Row<T extends { id: string }>({
  item,
  columns,
  onEdit,
  onDelete,
  dragHandleProps,
}: {
  item: T;
  columns: Column<T>[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  dragHandleProps?: { attributes: Record<string, unknown>; listeners: Record<string, unknown> | undefined };
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-bg-soft/50">
      {dragHandleProps && (
        <td className="px-3 py-3 text-ink-muted/50" {...dragHandleProps.attributes} {...(dragHandleProps.listeners ?? {})}>
          <span className="cursor-grab select-none">⠿</span>
        </td>
      )}
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3 text-ink">
          {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
        </td>
      ))}
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button onClick={() => onEdit(item)} className="text-xs font-medium text-teal-dark hover:underline">
            সম্পাদনা/Edit
          </button>
          <button onClick={() => onDelete(item)} className="text-xs font-medium text-coral-text hover:underline">
            মুছুন/Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function SortableRow<T extends { id: string }>({
  item,
  columns,
  onEdit,
  onDelete,
}: {
  item: T;
  columns: Column<T>[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border bg-surface last:border-0 hover:bg-bg-soft/50">
      <td className="px-3 py-3 text-ink-muted/50" {...attributes} {...listeners}>
        <span className="cursor-grab select-none">⠿</span>
      </td>
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3 text-ink">
          {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
        </td>
      ))}
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button onClick={() => onEdit(item)} className="text-xs font-medium text-teal-dark hover:underline">
            সম্পাদনা/Edit
          </button>
          <button onClick={() => onDelete(item)} className="text-xs font-medium text-coral-text hover:underline">
            মুছুন/Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// --- Schema-driven ContentForm ---------------------------------------------

export type FieldSpec =
  | { kind: "text"; key: string; label: string; required?: boolean }
  | { kind: "image"; key: string; label: string }
  | { kind: "file"; key: string; label: string }
  | { kind: "textarea"; key: string; label: string }
  | { kind: "photos"; key: string; label: string }
  | { kind: "number"; key: string; label: string }
  | { kind: "boolean"; key: string; label: string }
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: "bilingual-text"; key: string; label: string; required?: boolean }
  | { kind: "bilingual-textarea"; key: string; label: string };

export function ContentForm<T extends { id: string }>({
  fields,
  initial,
  onSubmit,
  onCancel,
  showPublished = true,
}: {
  fields: FieldSpec[];
  initial: Partial<T>;
  onSubmit: (values: Partial<T>) => void;
  onCancel: () => void;
  showPublished?: boolean;
}) {
  const [values, setValues] = useState<Record<string, unknown>>({ ...initial });
  const pushToast = useUIStore((s) => s.pushToast);

  useEffect(() => setValues({ ...initial }), [initial]);

  function set(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const shape: Record<string, z.ZodTypeAny> = {
      company: z.string().max(0, "অনুরোধটি যাচাই করা যায়নি / Submission could not be verified").optional(),
    };
    if (showPublished) shape.is_published = z.boolean();
    for (const field of fields) {
      const text = field.kind === "bilingual-text" || field.kind === "bilingual-textarea";
      if (text) {
        const valueSchema = "required" in field && field.required
          ? z.string().trim().min(1, `${field.label}: প্রয়োজনীয় / required`)
          : z.string().optional();
        shape[`${field.key}_en`] = valueSchema;
        shape[`${field.key}_bn`] = valueSchema;
      } else if (field.kind === "text" || field.kind === "image" || field.kind === "file" || field.kind === "textarea") {
        shape[field.key] = "required" in field && field.required
          ? z.string().trim().min(1, `${field.label}: প্রয়োজনীয় / required`)
          : z.string().optional();
      } else if (field.kind === "number") {
        shape[field.key] = z.number().finite().nullable().optional();
      } else if (field.kind === "boolean") {
        shape[field.key] = z.boolean().optional();
      } else if (field.kind === "select") {
        shape[field.key] = z.enum(field.options.map((option) => option.value) as [string, ...string[]]);
      } else if (field.kind === "photos") {
        shape[field.key] = z.array(z.object({
          id: z.string(),
          url: z.string().trim().min(1, "ছবির URL দিন / Add a photo"),
          caption_en: z.string(),
          caption_bn: z.string(),
          sort_order: z.number(),
        })).optional();
      }
    }
    const result = z.object(shape).safeParse(values);
    if (!result.success) {
      pushToast(result.error.issues[0]?.message ?? "তথ্য যাচাই করুন / Please check the form", "error");
      return;
    }
    onSubmit({ ...values, id: (values.id as string) || genId() } as Partial<T>);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" value={String(values.company ?? "")} onChange={(e) => set("company", e.target.value)} />
      {fields.map((f) => (
        <div key={f.key}>
          {f.kind === "bilingual-text" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldWrap label={`${f.label} (EN)`} required={f.required}>
                <Input value={String(values[`${f.key}_en`] ?? "")} onChange={(e) => set(`${f.key}_en`, e.target.value)} />
              </FieldWrap>
              <FieldWrap label={`${f.label} (বাং)`} required={f.required}>
                <Input value={String(values[`${f.key}_bn`] ?? "")} onChange={(e) => set(`${f.key}_bn`, e.target.value)} />
              </FieldWrap>
            </div>
          )}
          {f.kind === "bilingual-textarea" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldWrap label={`${f.label} (EN)`}>
                <Textarea rows={3} value={String(values[`${f.key}_en`] ?? "")} onChange={(e) => set(`${f.key}_en`, e.target.value)} />
              </FieldWrap>
              <FieldWrap label={`${f.label} (বাং)`}>
                <Textarea rows={3} value={String(values[`${f.key}_bn`] ?? "")} onChange={(e) => set(`${f.key}_bn`, e.target.value)} />
              </FieldWrap>
            </div>
          )}
          {f.kind === "text" && (
            <FieldWrap label={f.label} required={f.required}>
              <Input value={String(values[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} />
            </FieldWrap>
          )}
          {(f.kind === "image" || f.kind === "file") && (
            <MediaUploadField
              label={f.label}
              value={String(values[f.key] ?? "")}
              onChange={(value) => set(f.key, value)}
              accept={f.kind === "file" ? "application/pdf,image/jpeg,image/png,image/webp,image/gif" : undefined}
              uploadLabel={f.kind === "file" ? "ফাইল আপলোড / Upload file" : undefined}
            />
          )}
          {f.kind === "photos" && (
            <CommunityPhotosField
              label={f.label}
              items={(values[f.key] as { id: string; url: string; caption_en: string; caption_bn: string; sort_order: number }[] | undefined) ?? []}
              onChange={(items) => set(f.key, items)}
            />
          )}
          {f.kind === "textarea" && (
            <FieldWrap label={f.label}>
              <Textarea rows={3} value={String(values[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} />
            </FieldWrap>
          )}
          {f.kind === "number" && (
            <FieldWrap label={f.label}>
              <Input
                type="number"
                value={String(values[f.key] ?? "")}
                onChange={(e) => set(f.key, e.target.value === "" ? null : Number(e.target.value))}
              />
            </FieldWrap>
          )}
          {f.kind === "boolean" && (
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={Boolean(values[f.key])}
                onChange={(e) => set(f.key, e.target.checked)}
                className="h-4 w-4 rounded border-border accent-teal"
              />
              {f.label}
            </label>
          )}
          {f.kind === "select" && (
            <FieldWrap label={f.label}>
              <Select value={String(values[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)}>
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FieldWrap>
          )}
        </div>
      ))}
      {showPublished && (
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={Boolean(values.is_published)}
            onChange={(event) => set("is_published", event.target.checked)}
            className="h-4 w-4 rounded border-border accent-teal"
          />
          প্রকাশিত / Published
        </label>
      )}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          বাতিল / Cancel
        </Button>
        <Button type="submit">সংরক্ষণ / Save</Button>
      </div>
    </form>
  );
}

export function MediaUploadField({
  label,
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  uploadLabel = "ছবি আপলোড / Upload image",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  uploadLabel?: string;
}) {
  const pushToast = useUIStore((state) => state.pushToast);
  const [uploading, setUploading] = useState(false);
  return (
    <FieldWrap label={label}>
      <div className="space-y-2">
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink-muted hover:bg-bg-soft">
          {uploading ? "আপলোড হচ্ছে / Uploading..." : uploadLabel}
          <input
            type="file"
            accept={accept}
            disabled={uploading}
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setUploading(true);
              try {
                const item = await uploadMedia(file, { alt_en: "", alt_bn: "" });
                onChange(item.url);
                pushToast("আপলোড সম্পন্ন / Uploaded", "success");
              } catch (error) {
                pushToast(error instanceof Error ? error.message : "আপলোড ব্যর্থ / Upload failed", "error");
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
      </div>
    </FieldWrap>
  );
}

type CommunityPhotoFieldItem = {
  id: string;
  url: string;
  caption_en: string;
  caption_bn: string;
  sort_order: number;
};

function CommunityPhotosField({
  label,
  items,
  onChange,
}: {
  label: string;
  items: CommunityPhotoFieldItem[];
  onChange: (items: CommunityPhotoFieldItem[]) => void;
}) {
  const pushToast = useUIStore((state) => state.pushToast);
  return (
    <FieldWrap label={label}>
      <div className="space-y-3">
        {items.map((photo, index) => (
          <div key={photo.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
            <Input aria-label="Photo URL" value={photo.url} onChange={(event) => onChange(items.map((item) => item.id === photo.id ? { ...item, url: event.target.value } : item))} />
            <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs text-ink-muted">
              ছবি আপলোড / Upload photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  try {
                    const media = await uploadMedia(file, { alt_en: photo.caption_en, alt_bn: photo.caption_bn });
                    onChange(items.map((item) => item.id === photo.id ? { ...item, url: media.url } : item));
                  } catch (error) {
                    pushToast(error instanceof Error ? error.message : "আপলোড ব্যর্থ / Upload failed", "error");
                  }
                }}
              />
            </label>
            <Input aria-label="Caption (English)" placeholder="Caption (EN)" value={photo.caption_en} onChange={(event) => onChange(items.map((item) => item.id === photo.id ? { ...item, caption_en: event.target.value } : item))} />
            <Input aria-label="Caption (Bangla)" placeholder="Caption (বাং)" value={photo.caption_bn} onChange={(event) => onChange(items.map((item) => item.id === photo.id ? { ...item, caption_bn: event.target.value } : item))} />
            <div className="flex gap-3 sm:col-span-2">
              <button type="button" disabled={index === 0} onClick={() => onChange(arrayMove(items, index, index - 1).map((item, order) => ({ ...item, sort_order: order + 1 })))} className="text-xs text-teal-dark disabled:opacity-40">↑ Move up</button>
              <button type="button" disabled={index === items.length - 1} onClick={() => onChange(arrayMove(items, index, index + 1).map((item, order) => ({ ...item, sort_order: order + 1 })))} className="text-xs text-teal-dark disabled:opacity-40">↓ Move down</button>
              <button type="button" onClick={() => onChange(items.filter((item) => item.id !== photo.id))} className="text-xs text-coral-text">মুছুন / Remove</button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => onChange([...items, { id: genId(), url: "", caption_en: "", caption_bn: "", sort_order: items.length + 1 }])}>
          + ছবি যোগ করুন / Add photo
        </Button>
      </div>
    </FieldWrap>
  );
}

// --- Manager page shell: DataTable + modal ContentForm, wired to any CRUD API.

export function ManagerPage<T extends { id: string; sort_order?: number }>({
  title,
  fields,
  columns,
  items,
  isLoading,
  onSave,
  onDelete,
  onReorder,
  emptyItem,
  headerAction,
  showPublished = true,
}: {
  title: string;
  fields: FieldSpec[];
  columns: Column<T>[];
  items: T[];
  isLoading?: boolean;
  onSave: (item: Partial<T>) => Promise<void> | void;
  onDelete: (item: T) => Promise<void> | void;
  onReorder?: (orderedIds: string[]) => void;
  emptyItem: Partial<T>;
  headerAction?: ReactNode;
  showPublished?: boolean;
}) {
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const pushToast = useUIStore((s) => s.pushToast);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {headerAction}
      </div>
      {isLoading ? (
        <p className="text-ink-muted">Loading...</p>
      ) : (
        <DataTable
          items={items}
          columns={columns}
          onAdd={() => setEditing(showPublished ? { ...emptyItem, is_published: true } as Partial<T> : { ...emptyItem })}
          onEdit={(item) => setEditing(showPublished
            ? { ...item, is_published: (item as T & { is_published?: boolean }).is_published ?? true }
            : { ...item })}
          onDelete={(item) => setDeleting(item)}
          onReorder={onReorder}
        />
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={title} wide>
        {editing && (
          <ContentForm
            fields={fields}
            initial={editing}
            onCancel={() => setEditing(null)}
            showPublished={showPublished}
            onSubmit={async (values) => {
              try {
                await onSave(values);
                pushToast("সংরক্ষিত হয়েছে / Saved", "success");
                setEditing(null);
              } catch (error) {
                pushToast(error instanceof Error ? `সংরক্ষণ ব্যর্থ / Save failed: ${error.message}` : "সংরক্ষণ ব্যর্থ / Save failed", "error");
              }
            }}
          />
        )}
      </Modal>
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="নিশ্চিত করুন / Confirm delete">
        <p className="text-sm text-ink-muted">আপনি কি নিশ্চিত? / Are you sure?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            বাতিল / Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-coral text-coral-ink hover:bg-coral/90"
            onClick={async () => {
              try {
                if (deleting) await onDelete(deleting);
                pushToast("মুছে ফেলা হয়েছে / Deleted", "success");
                setDeleting(null);
              } catch (error) {
                pushToast(error instanceof Error ? `মুছতে ব্যর্থ / Delete failed: ${error.message}` : "মুছতে ব্যর্থ / Delete failed", "error");
              }
            }}
          >
            মুছুন / Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
