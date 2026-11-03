import type { TeamMember } from "@/lib/types";
import type { Lang } from "@/lib/types";
import { t2 } from "@/lib/utils";

export function TeamMemberCard({ member, lang }: { member: TeamMember; lang: Lang }) {
  const linkedin = safeLinkedIn(member.linkedin_url || member.links?.linkedin || "");
  const candidateEmail = member.public_email || member.links?.email || "";
  const email = member.show_public_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)
    ? candidateEmail
    : "";
  const altText = lang === "bn" ? member.photo_alt_bn : member.photo_alt_en;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface text-center">
      <div className="team-photo-card group relative aspect-[4/3] overflow-hidden bg-bg-soft">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={altText || member.name}
            className="h-full w-full object-cover"
            width={480}
            height={360}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl font-semibold text-teal-dark" aria-hidden="true">
            {member.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}
          </div>
        )}
        <div className="team-photo-overlay pointer-events-none absolute inset-0 bg-ink/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />
        {(linkedin || email) && (
          <div className="team-social-actions absolute inset-0 flex items-center justify-center gap-3">
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink shadow-md transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <LinkedInIcon />
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                aria-label={`Email ${member.name}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink shadow-md transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <EmailIcon />
              </a>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 space-y-1 p-4">
        <h3 className="font-semibold text-ink">{member.name}</h3>
        <p className="text-sm text-ink-muted">{t2(member, "title", lang)}</p>
        {member.department && <p className="text-xs text-ink-muted/80">{member.department}</p>}
        {(member.bio_en || member.bio_bn) && (
          <p className="pt-2 text-sm leading-relaxed text-ink-muted">{t2(member, "bio", lang)}</p>
        )}
      </div>
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
