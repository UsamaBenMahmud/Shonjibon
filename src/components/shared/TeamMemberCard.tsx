import type { TeamMember } from "@/lib/types";
import type { Lang } from "@/lib/types";
import { t2 } from "@/lib/utils";

export function TeamMemberCard({ member, lang }: { member: TeamMember; lang: Lang }) {
  const linkedin = safeLinkedIn(member.linkedin_url || member.links?.linkedin || "");
  const facebook = safeFacebook(member.facebook_url || member.links?.facebook || "");
  const candidateEmail = member.public_email || member.links?.email || "";
  const email = member.show_public_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)
    ? candidateEmail
    : "";
  const photoAlt = lang === "bn" ? member.photo_alt_bn : member.photo_alt_en;

  return (
    <article className="card flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-soft">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={photoAlt || member.name}
            width={480}
            height={360}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal/15 via-bg-soft to-coral/15" aria-hidden="true">
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-border/70 bg-surface/80 font-display text-2xl font-semibold text-teal-dark shadow-sm">
              {member.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center p-5 text-center sm:p-6">
        <h3 className="font-semibold leading-snug text-ink">{member.name}</h3>
        <p className="mt-2 text-sm font-medium leading-snug text-teal-dark">{t2(member, "title", lang)}</p>
        {member.department && <p className="mt-1 text-xs text-ink-muted">{member.department}</p>}
        {(member.bio_en || member.bio_bn) && (
          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{t2(member, "bio", lang)}</p>
        )}
        {(linkedin || facebook || email) && (
          <div className="mt-4 flex justify-center gap-3 border-t border-border pt-4">
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink transition-colors hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                <LinkedInIcon />
              </a>
            )}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on Facebook`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink transition-colors hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                <FacebookIcon />
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

function safeFacebook(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)facebook\.com$/i.test(url.hostname) ? url.toString() : "";
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

function FacebookIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" />
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
