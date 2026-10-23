import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  getSettings,
  listSimple,
  submitContactMessage,
} from "@/lib/api";
import type { Download, Faq, TeamMember } from "@/lib/types";
import { t2 } from "@/lib/utils";
import { contactSchema, type ContactInput } from "@/lib/schemas";
import { Section, SectionHeading, SEO, Container } from "@/components/shared";
import { Accordion, Button, FieldWrap, Input, Textarea } from "@/components/ui";
import { useUIStore } from "@/store/ui";
import { bdPhoneHref, formatBdPhone } from "@/lib/utils";

function Avatar({ name, photo }: { name: string; photo?: string }) {
  if (photo) return <img src={photo} alt={name} className="h-20 w-20 rounded-full object-cover" width={80} height={80} />;
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal/10 font-display text-xl font-semibold text-teal-dark">
      {initials}
    </div>
  );
}

function TeamPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const teamQ = useQuery({ queryKey: ["team_members"], queryFn: () => listSimple<TeamMember>("team_members") });
  const members = teamQ.data ?? [];
  const core = members.filter((m) => m.group_type === "team");

  return (
    <>
      <SEO title={t("team.title")} description={t("team.subtitle")} />
      <Section>
        <SectionHeading title={t("team.title")} body={t("team.subtitle")} align="center" />
        <h3 className="mt-10 mb-5 font-display text-lg font-semibold text-ink">{t("team.coreTeam")}</h3>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {core.map((m) => (
            <div key={m.id} className="flex flex-col items-center gap-2 text-center">
              <Avatar name={m.name} photo={m.photo_url} />
              <p className="font-medium text-ink">{m.name}</p>
              <p className="text-xs text-ink-muted">{t2(m, "title", lang)}</p>
              <p className="text-xs text-ink-muted/70">{m.department}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function AboutPage() {
  const { t } = useTranslation();
  return (
    <>
      <SEO title={t("about.title")} description={t("about.subtitle")} />
      <Section>
        <SectionHeading title={t("about.title")} body={t("about.subtitle")} align="center" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold text-ink">{t("about.missionTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {t("home.heroSubtitle")}
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold text-ink">{t("about.visionTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("home.ctaBody")}</p>
          </div>
        </div>
        <div className="mt-6 card p-6">
          <h3 className="font-display text-lg font-semibold text-ink">{t("about.sourcingTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("about.sourcingBody")}</p>
        </div>
      </Section>
    </>
  );
}

function FaqPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const faqsQ = useQuery({ queryKey: ["faqs"], queryFn: () => listSimple<Faq>("faqs") });
  const faqs = faqsQ.data ?? [];

  return (
    <>
      <SEO title={t("faq.title")} description={t("faq.subtitle")} />
      <Section>
        <SectionHeading title={t("faq.title")} body={t("faq.subtitle")} align="center" />
        <div className="mx-auto mt-10 max-w-2xl">
          <Accordion
            items={faqs.map((f) => ({ id: f.id, question: t2(f, "question", lang), answer: t2(f, "answer", lang) }))}
          />
        </div>
      </Section>
    </>
  );
}

function ContactPage() {
  const { t } = useTranslation();
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const downloadsQ = useQuery({ queryKey: ["downloads"], queryFn: () => listSimple<Download>("downloads") });
  const pushToast = useUIStore((s) => s.pushToast);
  const [sent, setSent] = useState(false);
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const phone = settingsQ.data?.contact?.phone || settingsQ.data?.contact_phone;
  const email = settingsQ.data?.contact?.email || settingsQ.data?.contact_email;
  const phoneDigits = phone?.replace(/\D/g, "");
  const tel = phone ? bdPhoneHref(phone) : undefined;
  const address = settingsQ.data?.contact?.address || settingsQ.data?.contact_address_en;
  async function copyContact(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      pushToast("কপি হয়েছে / Copied", "success");
    } catch (error) {
      pushToast(error instanceof Error ? `কপি করা যায়নি / Could not copy: ${error.message}` : "কপি করা যায়নি / Could not copy", "error");
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values: ContactInput) {
    if (values.company) return; // honeypot
    try {
      await submitContactMessage({ name: values.name, email: values.email, phone: values.phone ?? "", subject: values.subject, message: values.message });
      pushToast(t("contact.success"), "success");
      setSent(true);
      reset();
    } catch (error) {
      pushToast(error instanceof Error
        ? `বার্তা পাঠানো যায়নি / Could not send the message: ${error.message}`
        : "বার্তা পাঠানো যায়নি / Could not send the message", "error");
    }
  }

  return (
    <>
      <SEO title={t("contact.title")} description={t("contact.subtitle")} />
      <Section>
        <SectionHeading title={t("contact.title")} body={t("contact.subtitle")} align="center" />
        <div className="mt-10 grid gap-10 sm:grid-cols-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:col-span-3" noValidate>
            <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...register("company")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrap label={t("contact.name")} required error={errors.name?.message}>
                <Input {...register("name")} error={!!errors.name} />
              </FieldWrap>
              <FieldWrap label={t("contact.email")} required error={errors.email?.message}>
                <Input type="email" {...register("email")} error={!!errors.email} />
              </FieldWrap>
            </div>
            <FieldWrap label={t("contact.phone")} error={errors.phone?.message}>
              <Input {...register("phone")} />
            </FieldWrap>
            <FieldWrap label={t("contact.subject")} required error={errors.subject?.message}>
              <Input {...register("subject")} error={!!errors.subject} />
            </FieldWrap>
            <FieldWrap label={t("contact.message")} required error={errors.message?.message}>
              <Textarea rows={5} {...register("message")} error={!!errors.message} />
            </FieldWrap>
            <Button type="submit" disabled={isSubmitting}>
              {t("actions.submit")}
            </Button>
            {sent && <p className="text-sm text-teal-dark">{t("contact.success")}</p>}
          </form>
          <div className="space-y-4 sm:col-span-2">
            <div className="card p-5">
              <h3 className="font-display text-lg font-semibold text-ink">{t("contact.info")}</h3>
              <div className="mt-4 grid gap-3">
                {phone && tel && <div className="rounded-xl border border-border p-4">
                  <span className="text-xl text-teal-dark" aria-hidden="true">☎</span>
                  <p className="mt-2 text-xs text-ink-muted">Call Us</p>
                  <a href={tel} className="text-lg font-bold tabular-nums text-ink hover:text-teal-dark" dir="ltr">{formatBdPhone(phone)}</a>
                  <button type="button" onClick={() => void copyContact(phone)} className="mt-2 block text-xs font-semibold text-teal-dark hover:underline">Copy Phone</button>
                </div>}
                {email && <div className="rounded-xl border border-border p-4">
                  <span className="text-xl text-teal-dark" aria-hidden="true">✉</span>
                  <p className="mt-2 text-xs text-ink-muted">Email</p>
                  <a href={`mailto:${email}`} className="break-all text-sm font-bold text-ink hover:text-teal-dark">{email}</a>
                  <button type="button" onClick={() => void copyContact(email)} className="mt-2 block text-xs font-semibold text-teal-dark hover:underline">Copy Email</button>
                </div>}
              </div>
              {settingsQ.data?.contact?.hours && <p className="mt-3 text-sm text-ink-muted">{settingsQ.data.contact.hours}</p>}
              {settingsQ.data?.contact?.whatsapp_enabled && phoneDigits && (
                <a href={`https://wa.me/${phoneDigits.replace(/^0/, "880")}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-teal-dark hover:underline">
                  {t("contact.whatsapp")}
                </a>
              )}
              {address && <p className="mt-3 text-sm text-ink-muted">{address}</p>}
              {settingsQ.data?.contact?.map_link && <a href={settingsQ.data.contact.map_link} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-teal-dark hover:underline">Open Map ↗</a>}
            </div>
            {(downloadsQ.data ?? []).length > 0 && (
              <div className="card p-5">
                <h3 className="font-display text-lg font-semibold text-ink">{t("contact.resources")}</h3>
                <ul className="mt-2 space-y-2">
                  {(downloadsQ.data ?? []).map((d) => (
                    <li key={d.id}>
                      <a href={d.file_url} className="text-sm text-teal-dark hover:underline">
                        {t2(d, "title", lang)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}

export default function Info({ page }: { page: "team" | "about" | "faq" | "contact" }) {
  if (page === "team") return <TeamPage />;
  if (page === "about") return <AboutPage />;
  if (page === "faq") return <FaqPage />;
  return <ContactPage />;
}

export { Container };
