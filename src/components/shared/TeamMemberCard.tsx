import type { TeamMember } from "@/lib/types";
import type { Lang } from "@/lib/types";
import { t2 } from "@/lib/utils";

export function TeamMemberCard({ member, lang }: { member: TeamMember; lang: Lang }) {
  const linkedin = safeLinkedIn(member.linkedin_url || member.links?.linkedin || "");
  const candidateEmail = member.public_email || member.links?.email || "";
  const email = member.show_public_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)
    ? candidateEmail
    : "";
  const photoAlt = lang === "bn" ? member.photo_alt_bn : member.photo_alt_en;

  return (
    <article className="flex h-full flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {member.photo_url ? (
        <img
          src={member.photo_url}
          alt={photoAlt || member.name}
          width={96}
          height={96}
          loading="lazy"
          className="h-24 w-24 rounded-full object-cover ring-4 ring-teal/10"
        />
      ) : (
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full bg-teal/10 font-display text-2xl font-semibold text-teal-dark ring-4 ring-teal/5"
          aria-hidden="true"
        >
          {member.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}
        </div>
      )}
      <h3 className="mt-4 font-semibold leading-snug text-ink">{member.name}</h3>
      <p className="mt-1 text-sm font-medium leading-snug text-teal-dark">{t2(member, "title", lang)}</p>
      {member.department && <p className="mt-1 text-xs text-ink-muted">{member.department}</p>}
      {(member.bio_en || member.bio_bn) && (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{t2(member, "bio", lang)}</p>
      )}
      {(linkedin || email) && (
        <div className="mt-4 flex justify-center gap-3 border-t border-border pt-4">
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} on LinkedIn`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink transition hover:bg-bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              <LinkedInIcon />
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              aria-label={`Email ${member.name}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink transition hover:bg-bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              <EmailIcon />
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function safeLinkedIn(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)linkedin\.com$/i.test(url.hostname) ? url.toString() : "";
  } catch {
    return "";
  }
}

function LinkedInIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.2 3.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM3.4 9.5H7v11H3.4v-11Zm5.8 0h3.4V11h.1c.5-.9 1.7-1.9 3.5-1.9 3.7 0 4.4 2.4 4.4 5.5v5.9H17v-5.2c0-1.2 0-2.8-1.8-2.8s-2.1 1.3-2.1 2.7v5.3H9.2v-11Z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
