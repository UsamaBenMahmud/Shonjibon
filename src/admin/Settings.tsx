import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { exportBackup, getSettings, importBackup, resetToDemoData, saveSettings, uploadMedia } from "@/lib/api";
import type { BrandingSettings, Settings as SettingsType, SectionToggles } from "@/lib/types";
import { hasSupabase } from "@/lib/supabase";
import { Button, FieldWrap, Input, Textarea } from "@/components/ui";
import { useUIStore } from "@/store/ui";
import { settingsSchema } from "@/lib/schemas";
import { Logo } from "@/components/shared";

const defaultBranding: BrandingSettings = {
  name_bn: "সঞ্জীবন",
  name_en: "Shonjibon",
  show_bangla_name: true,
  logo_mark_url: "",
  logo_full_url: "",
  logo_dark_url: "",
  logo_height: 40,
  use_mark_only: false,
};

const sectionLabels: { key: keyof SectionToggles; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "impact", label: "Impact counters" },
  { key: "shellDiagram", label: "Shell diagram" },
  { key: "products", label: "Products" },
  { key: "circularEconomy", label: "Circular economy loop" },
  { key: "wasteRing", label: "Waste reduction ring" },
  { key: "journey", label: "Journey timeline" },
  { key: "community", label: "Community preview" },
  { key: "articles", label: "Articles preview" },
  { key: "team", label: "Team preview" },
  { key: "testimonials", label: "Testimonials" },
  { key: "newsletter", label: "Newsletter CTA" },
];

export default function Settings() {
  const qc = useQueryClient();
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const pushToast = useUIStore((s) => s.pushToast);
  const [form, setForm] = useState<SettingsType | null>(null);

  useEffect(() => {
    if (settingsQ.data) {
      const settings = settingsQ.data;
      setForm({
        ...settings,
        contact_email: settings.contact_email ?? settings.contact?.email ?? "",
        social_facebook: settings.social_facebook ?? "",
        social_youtube: settings.social_youtube ?? "",
        social_linkedin: settings.social_linkedin ?? "",
        contact: {
          phone: settings.contact?.phone ?? settings.contact_phone ?? "",
          email: settings.contact?.email ?? settings.contact_email ?? "",
          address: settings.contact?.address ?? settings.contact_address_en ?? "",
          hours: settings.contact?.hours ?? "",
          map_link: settings.contact?.map_link ?? "",
          whatsapp_enabled: settings.contact?.whatsapp_enabled ?? false,
        },
        branding: { ...defaultBranding, ...settings.branding },
        shell_story: settings.shell_story ?? { image_url: "", use_illustration: true },
      });
    }
  }, [settingsQ.data]);

  function set<K extends keyof SettingsType>(key: K, value: SettingsType[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function toggleSection(key: keyof SectionToggles) {
    setForm((prev) => (prev ? { ...prev, sections: { ...prev.sections, [key]: !prev.sections[key] } } : prev));
  }

  function updateBranding<K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) {
    setForm((prev) => prev ? { ...prev, branding: { ...defaultBranding, ...prev.branding, [key]: value } } : prev);
  }

  async function uploadBrandAsset(key: "logo_mark_url" | "logo_full_url" | "logo_dark_url", file: File) {
    try {
      const media = await uploadMedia(file, { alt_en: "Shonjibon logo", alt_bn: "সঞ্জীবন লোগো" });
      updateBranding(key, media.url);
      pushToast("লোগো আপলোড হয়েছে / Logo uploaded", "success");
    } catch (error) {
      pushToast(error instanceof Error ? `আপলোড ব্যর্থ / Upload failed: ${error.message}` : "আপলোড ব্যর্থ / Upload failed", "error");
    }
  }

  async function uploadShellPhoto(file: File) {
    try {
      const media = await uploadMedia(file, { alt_en: "Shrimp shell story photo", alt_bn: "চিংড়ির খোলসের ছবি" });
      setForm((prev) => prev ? { ...prev, shell_story: { image_url: media.url, use_illustration: false } } : prev);
      pushToast("ছবি আপলোড হয়েছে / Photo uploaded", "success");
    } catch (error) {
      pushToast(error instanceof Error ? `আপলোড ব্যর্থ / Upload failed: ${error.message}` : "আপলোড ব্যর্থ / Upload failed", "error");
    }
  }

  async function handleSave() {
    if (!form) return;
    const validation = settingsSchema.safeParse(form);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      const field = issue?.path.map((part) => String(part).replace(/_/g, " ")).join(" → ");
      pushToast(
        issue ? `${field ? `${field}: ` : ""}${issue.message}` : "তথ্য যাচাই করুন / Please check the form",
        "error",
      );
      return;
    }
    try {
      await saveSettings(form);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      pushToast("সংরক্ষিত হয়েছে / Saved", "success");
    } catch (error) {
      pushToast(error instanceof Error ? `সংরক্ষণ ব্যর্থ / Save failed: ${error.message}` : "সংরক্ষণ ব্যর্থ / Save failed", "error");
    }
  }

  function handleExport() {
    const data = exportBackup();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shonjibon-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        importBackup(String(reader.result ?? ""));
        await qc.invalidateQueries();
        pushToast("ইম্পোর্ট সম্পন্ন / Imported", "success");
      } catch (error) {
        pushToast(error instanceof Error ? `ইম্পোর্ট ব্যর্থ / Import failed: ${error.message}` : "ইম্পোর্ট ব্যর্থ / Import failed", "error");
      }
    };
    reader.onerror = () => pushToast("ফাইল পড়া যায়নি / Could not read file", "error");
    reader.readAsText(file);
  }

  async function handleReset() {
    if (!confirm("ডেমো ডেটায় রিসেট করবেন? / Reset to demo data?")) return;
    resetToDemoData();
    await qc.invalidateQueries();
    pushToast("রিসেট সম্পন্ন / Reset complete", "success");
  }

  if (!form) return <p className="text-ink-muted">Loading...</p>;

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-display text-2xl font-semibold text-ink">সেটিংস / Settings</h1>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">হিরো ও মটো / Hero & motto</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrap label="Motto (EN)"><Input value={form.motto_en} onChange={(e) => set("motto_en", e.target.value)} /></FieldWrap>
          <FieldWrap label="মটো (বাং)"><Input value={form.motto_bn} onChange={(e) => set("motto_bn", e.target.value)} /></FieldWrap>
          <FieldWrap label="Hero title (EN)"><Input value={form.hero_title_en} onChange={(e) => set("hero_title_en", e.target.value)} /></FieldWrap>
          <FieldWrap label="হিরো শিরোনাম (বাং)"><Input value={form.hero_title_bn} onChange={(e) => set("hero_title_bn", e.target.value)} /></FieldWrap>
          <FieldWrap label="Hero subtitle (EN)"><Textarea rows={3} value={form.hero_subtitle_en} onChange={(e) => set("hero_subtitle_en", e.target.value)} /></FieldWrap>
          <FieldWrap label="হিরো সাবটাইটেল (বাং)"><Textarea rows={3} value={form.hero_subtitle_bn} onChange={(e) => set("hero_subtitle_bn", e.target.value)} /></FieldWrap>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">খোলসের গল্প / Shell Story</h2>
          <p className="mt-1 text-sm text-ink-muted">Upload a 4:3 shell photo to replace the vector illustration. Hotspot locations remain editable in the Shell Story manager.</p>
        </div>
        {form.shell_story?.image_url && <img src={form.shell_story.image_url} alt="Shell story preview" className="max-h-56 rounded-xl border border-border object-contain" />}
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-ink hover:bg-bg-soft">
            Upload shell photo
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void uploadShellPhoto(file);
            }} />
          </label>
          <Button type="button" variant="secondary" onClick={() => set("shell_story", { image_url: "", use_illustration: true })}>Use vector illustration</Button>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">যোগাযোগ ও সোশ্যাল / Contact & social</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrap label="Phone"><Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} /></FieldWrap>
          <FieldWrap label="Email"><Input value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></FieldWrap>
          <FieldWrap label="Address (EN)"><Input value={form.contact_address_en} onChange={(e) => set("contact_address_en", e.target.value)} /></FieldWrap>
          <FieldWrap label="ঠিকানা (বাং)"><Input value={form.contact_address_bn} onChange={(e) => set("contact_address_bn", e.target.value)} /></FieldWrap>
          <FieldWrap label="Contact hours"><Input value={form.contact?.hours ?? ""} onChange={(e) => set("contact", { ...(form.contact ?? { phone: form.contact_phone, email: form.contact_email, address: form.contact_address_en, hours: "", map_link: "", whatsapp_enabled: false }), hours: e.target.value })} /></FieldWrap>
          <FieldWrap label="Map link"><Input value={form.contact?.map_link ?? ""} onChange={(e) => set("contact", { ...(form.contact ?? { phone: form.contact_phone, email: form.contact_email, address: form.contact_address_en, hours: "", map_link: "", whatsapp_enabled: false }), map_link: e.target.value })} /></FieldWrap>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.contact?.whatsapp_enabled ?? false}
              onChange={(e) => set("contact", { ...(form.contact ?? { phone: form.contact_phone, email: form.contact_email, address: form.contact_address_en, hours: "", map_link: "", whatsapp_enabled: false }), whatsapp_enabled: e.target.checked })}
            />
            Enable WhatsApp contact button
          </label>
          <FieldWrap label="Facebook URL"><Input value={form.social_facebook} onChange={(e) => set("social_facebook", e.target.value)} /></FieldWrap>
          <FieldWrap label="YouTube URL"><Input value={form.social_youtube} onChange={(e) => set("social_youtube", e.target.value)} /></FieldWrap>
          <FieldWrap label="LinkedIn URL"><Input value={form.social_linkedin} onChange={(e) => set("social_linkedin", e.target.value)} /></FieldWrap>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">ব্র্যান্ডিং / Branding</h2>
          <p className="mt-1 text-sm text-ink-muted">Logo mark assets are uploaded to the configured public media bucket.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrap label="Name in Bangla"><Input value={form.branding?.name_bn ?? defaultBranding.name_bn} onChange={(e) => updateBranding("name_bn", e.target.value)} /></FieldWrap>
          <FieldWrap label="Name in English"><Input value={form.branding?.name_en ?? defaultBranding.name_en} onChange={(e) => updateBranding("name_en", e.target.value)} /></FieldWrap>
          <BrandAssetUpload label="Logo mark (icon only)" value={form.branding?.logo_mark_url ?? ""} onUpload={(file) => uploadBrandAsset("logo_mark_url", file)} />
          <BrandAssetUpload label="Full logo artwork" value={form.branding?.logo_full_url ?? ""} onUpload={(file) => uploadBrandAsset("logo_full_url", file)} />
          <BrandAssetUpload label="Dark-mode logo variant" value={form.branding?.logo_dark_url ?? ""} onUpload={(file) => uploadBrandAsset("logo_dark_url", file)} />
          <FieldWrap label={`Logo height (${form.branding?.logo_height ?? 40}px)`}>
            <input className="w-full accent-teal" type="range" min={28} max={64} value={form.branding?.logo_height ?? 40} onChange={(e) => updateBranding("logo_height", Number(e.target.value))} />
          </FieldWrap>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={form.branding?.show_bangla_name ?? true} onChange={(e) => updateBranding("show_bangla_name", e.target.checked)} className="accent-teal" />
          Show Bangla name beside logo
        </label>
        {form.branding?.logo_full_url && !form.branding.logo_mark_url && (
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={form.branding.use_mark_only ?? false} onChange={(e) => updateBranding("use_mark_only", e.target.checked)} className="accent-teal" />
          Use mark only (hide the full logo artwork)
        </label>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Live lockup preview</p>
            <Logo branding={{ ...defaultBranding, ...form.branding }} />
          </div>
          <Button type="button" variant="secondary" onClick={() => set("branding", defaultBranding)}>Reset branding to default</Button>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">হোমপেজ সেকশন / Homepage sections</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {sectionLabels.map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={form.sections[s.key]} onChange={() => toggleSection(s.key)} className="accent-teal" />
              {s.label}
            </label>
          ))}
        </div>
      </section>

      {!hasSupabase && (
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-lg font-semibold text-ink">অ্যাডমিন পাসওয়ার্ড / Admin password</h2>
          <FieldWrap label="Password" hint="Demo mode only — stored locally.">
            <Input value={form.admin_password} onChange={(e) => set("admin_password", e.target.value)} />
          </FieldWrap>
        </section>
      )}

      <Button onClick={handleSave}>সংরক্ষণ করুন / Save settings</Button>

      {!hasSupabase && (
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-lg font-semibold text-ink">ব্যাকআপ / Backup (mock mode)</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleExport}>Export JSON backup</Button>
            <label className="btn-secondary cursor-pointer">
              Import JSON backup
              <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
            </label>
            <Button variant="secondary" className="text-coral-text" onClick={handleReset}>Reset to demo data</Button>
          </div>
        </section>
      )}
    </div>
  );
}

function BrandAssetUpload({ label, value, onUpload }: { label: string; value: string; onUpload: (file: File) => Promise<void> }) {
  return (
    <FieldWrap label={label}>
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="" className="h-12 w-12 rounded-lg border border-border object-contain p-1" />}
        <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-ink hover:bg-bg-soft">
          Upload image
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void onUpload(file);
          }} />
        </label>
      </div>
    </FieldWrap>
  );
}
