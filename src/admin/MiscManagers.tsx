import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  deleteAdminUser,
  deleteMessage,
  deleteSubscriber,
  listAdminUsers,
  listAuditLog,
  listMessagesAdmin,
  listSubscribersAdmin,
  markMessageRead,
  saveAdminUser,
} from "@/lib/api";
import type { Profile } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge, EmptyState, Button, FieldWrap, Input, Modal, Select } from "@/components/ui";
import { useUIStore } from "@/store/ui";
import { hasSupabase } from "@/lib/supabase";
import { adminUserCreateSchema, adminUserEditSchema } from "@/lib/schemas";
import type { z } from "zod";

export function MessagesManager() {
  const qc = useQueryClient();
  const messagesQ = useQuery({ queryKey: ["messages"], queryFn: listMessagesAdmin });
  const items = messagesQ.data ?? [];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-semibold text-ink">বার্তা ইনবক্স / Messages</h1>
      {items.length === 0 ? (
        <EmptyState title="কোনো বার্তা নেই / No messages yet" />
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className="card flex items-start justify-between gap-4 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{m.name}</p>
                  {!m.is_read && <Badge tone="coral">New</Badge>}
                </div>
                <p className="text-sm text-ink-muted">{m.email} · {m.phone}</p>
                <p className="mt-1 text-sm font-medium text-ink">{m.subject}</p>
                <p className="text-sm text-ink-muted">{m.message}</p>
                <p className="mt-1 text-xs text-ink-muted/70">{formatDate(m.created_at, "en")}</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await markMessageRead(m.id, !m.is_read);
                    await qc.invalidateQueries({ queryKey: ["messages"] });
                  } catch {
                    window.alert("বার্তা আপডেট করা যায়নি / Could not update message");
                  }
                }}
                className="shrink-0 text-xs font-medium text-teal-dark hover:underline"
              >
                {m.is_read ? "Mark unread" : "Mark read"}
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm("বার্তাটি মুছবেন? / Delete this message?")) return;
                  try {
                    await deleteMessage(m.id);
                    await qc.invalidateQueries({ queryKey: ["messages"] });
                  } catch {
                    window.alert("বার্তা মুছতে ব্যর্থ / Could not delete message");
                  }
                }}
                className="shrink-0 text-xs font-medium text-coral-text hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SubscribersManager() {
  const qc = useQueryClient();
  const pushToast = useUIStore((s) => s.pushToast);
  const subscribersQ = useQuery({ queryKey: ["subscribers"], queryFn: listSubscribersAdmin });
  const items = subscribersQ.data ?? [];

  function exportCsv() {
    const blob = new Blob(["Email,Date\n" + items.map((s) => `${s.email},${s.created_at}`).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shonjibon-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">সাবস্ক্রাইবার / Subscribers</h1>
        <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="কোনো সাবস্ক্রাইবার নেই / No subscribers yet" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink">{s.email}</td>
                  <td className="px-4 py-3 text-ink-muted">{formatDate(s.created_at, "en")}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={async () => {
                        if (!window.confirm("সাবস্ক্রাইবার মুছবেন? / Delete this subscriber?")) return;
                        try {
                          await deleteSubscriber(s.id);
                          await qc.invalidateQueries({ queryKey: ["subscribers"] });
                          pushToast("মুছে ফেলা হয়েছে / Deleted", "success");
                        } catch (error) {
                          pushToast(error instanceof Error ? `মুছতে ব্যর্থ / Delete failed: ${error.message}` : "মুছতে ব্যর্থ / Delete failed", "error");
                        }
                      }}
                      className="text-xs font-medium text-coral-text hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AuditLogManager() {
  const auditQ = useQuery({ queryKey: ["audit_log"], queryFn: listAuditLog });
  const items = auditQ.data ?? [];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-semibold text-ink">অডিট লগ / Audit log</h1>
      {items.length === 0 ? (
        <EmptyState title="কোনো কার্যকলাপ নেই / No activity yet" />
      ) : (
        <div className="space-y-2">
          {items.map((entry) => (
            <details key={entry.id} className="card p-4">
              <summary className="cursor-pointer text-sm font-medium text-ink">
                {entry.action} · {entry.table_name} · {formatDate(entry.created_at, "en")}
              </summary>
              <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <p className="mb-1 font-semibold text-ink-muted">Before</p>
                  <pre className="overflow-x-auto rounded-lg bg-bg-soft p-2">{JSON.stringify(entry.before, null, 2)}</pre>
                </div>
                <div>
                  <p className="mb-1 font-semibold text-ink-muted">After</p>
                  <pre className="overflow-x-auto rounded-lg bg-bg-soft p-2">{JSON.stringify(entry.after, null, 2)}</pre>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

export function UsersManager() {
  const qc = useQueryClient();
  const pushToast = useUIStore((state) => state.pushToast);
  const usersQ = useQuery({ queryKey: ["admin-users"], queryFn: listAdminUsers, enabled: hasSupabase });
  const [editing, setEditing] = useState<Profile | null>(null);
  const createForm = useForm<z.infer<typeof adminUserCreateSchema>>({
    resolver: zodResolver(adminUserCreateSchema),
    defaultValues: { full_name: "", email: "", role: "editor", company: "" },
  });
  const editForm = useForm<z.infer<typeof adminUserEditSchema>>({ resolver: zodResolver(adminUserEditSchema) });

  async function createUser(values: z.infer<typeof adminUserCreateSchema>) {
    if (values.company) return;
    try {
      await saveAdminUser({ action: "create", ...values });
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
      createForm.reset();
      pushToast("আমন্ত্রণ পাঠানো হয়েছে / Invitation sent", "success");
    } catch (error) {
      pushToast(error instanceof Error ? `ব্যবহারকারী যোগ করা যায়নি / Could not add user: ${error.message}` : "ব্যবহারকারী যোগ করা যায়নি / Could not add user", "error");
    }
  }

  async function updateUser(values: z.infer<typeof adminUserEditSchema>) {
    if (!editing) return;
    try {
      await saveAdminUser({ action: "update", id: editing.id, ...values });
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditing(null);
      pushToast("ব্যবহারকারী আপডেট হয়েছে / User updated", "success");
    } catch (error) {
      pushToast(error instanceof Error ? `ব্যবহারকারী আপডেট ব্যর্থ / User update failed: ${error.message}` : "ব্যবহারকারী আপডেট ব্যর্থ / User update failed", "error");
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-semibold text-ink">ব্যবহারকারী / Users</h1>
      {!hasSupabase ? (
        <div className="card p-5">
        <p className="text-sm text-ink-muted">
          Mock mode uses the shared local admin password in Settings. Supabase mode lets a super admin invite, edit, and remove accounts.
        </p>
        </div>
      ) : (
        <>
          <form onSubmit={createForm.handleSubmit(createUser)} className="card grid gap-4 p-5 sm:grid-cols-2">
            <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...createForm.register("company")} />
            <FieldWrap label="Full name" required error={createForm.formState.errors.full_name?.message}>
              <Input {...createForm.register("full_name")} />
            </FieldWrap>
            <FieldWrap label="Email" required error={createForm.formState.errors.email?.message}>
              <Input type="email" {...createForm.register("email")} />
            </FieldWrap>
            <FieldWrap label="Role">
              <Select {...createForm.register("role")}>
                <option value="editor">Editor</option>
                <option value="super_admin">Super admin</option>
              </Select>
            </FieldWrap>
            <div className="flex items-end">
              <Button type="submit" disabled={createForm.formState.isSubmitting}>Invite user</Button>
            </div>
          </form>
          {usersQ.error && <p role="alert" className="text-sm text-coral-text">ব্যবহারকারী লোড ব্যর্থ / Could not load users: {usersQ.error.message}</p>}
          {(usersQ.data ?? []).map((user) => (
            <div key={user.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-ink">{user.full_name}</p>
                <p className="text-sm text-ink-muted">{user.email || user.id} · {user.role}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditing(user);
                    editForm.reset({
                      full_name: user.full_name,
                      role: user.role === "super_admin" ? "super_admin" : "editor",
                    });
                  }}
                  className="text-xs font-medium text-teal-dark hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(`${user.email || user.id} মুছবেন? / Remove this user?`)) return;
                    try {
                      await deleteAdminUser(user.id);
                      await qc.invalidateQueries({ queryKey: ["admin-users"] });
                      pushToast("ব্যবহারকারী মুছে ফেলা হয়েছে / User removed", "success");
                    } catch (error) {
                      pushToast(error instanceof Error ? `ব্যবহারকারী মুছতে ব্যর্থ / Could not remove user: ${error.message}` : "ব্যবহারকারী মুছতে ব্যর্থ / Could not remove user", "error");
                    }
                  }}
                  className="text-xs font-medium text-coral-text hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <Modal open={!!editing} onClose={() => setEditing(null)} title="ব্যবহারকারী সম্পাদনা / Edit user">
            <form onSubmit={editForm.handleSubmit(updateUser)} className="space-y-4">
              <FieldWrap label="Full name" required error={editForm.formState.errors.full_name?.message}>
                <Input {...editForm.register("full_name")} />
              </FieldWrap>
              <FieldWrap label="Role">
                <Select {...editForm.register("role")}>
                  <option value="editor">Editor</option>
                  <option value="super_admin">Super admin</option>
                </Select>
              </FieldWrap>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>Save</Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}
