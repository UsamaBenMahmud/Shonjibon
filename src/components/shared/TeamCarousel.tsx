import { useRef } from "react";
import type { Lang, TeamMember } from "@/lib/types";
import { TeamMemberCard } from "@/components/shared/TeamMemberCard";

export function TeamCarousel({ members, lang }: { members: TeamMember[]; lang: Lang }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior });
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label={lang === "bn" ? "আগের টিম সদস্য" : "Previous team members"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink transition hover:bg-bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          <ArrowIcon direction="left" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label={lang === "bn" ? "পরের টিম সদস্য" : "Next team members"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink transition hover:bg-bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          <ArrowIcon direction="right" />
        </button>
      </div>
      <div
        ref={trackRef}
        className="team-carousel-track flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3"
        role="region"
        aria-label={lang === "bn" ? "টিম সদস্যদের ক্যারোসেল" : "Team members carousel"}
        tabIndex={0}
      >
        {members.map((member) => (
          <div key={member.id} className="w-[min(82vw,18rem)] shrink-0 snap-start sm:w-[18rem] lg:w-[calc((100%-2rem)/3)]">
            <TeamMemberCard member={member} lang={lang} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}
