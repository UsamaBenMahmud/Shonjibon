import type { Lang, TeamMember } from "@/lib/types";
import { TeamMemberCard } from "@/components/shared/TeamMemberCard";

export function TeamCarousel({ members, lang }: { members: TeamMember[]; lang: Lang }) {
  return (
    <div className="mt-8">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label={lang === "bn" ? "টিম সদস্য" : "Team members"}>
        {members.map((member) => (
          <li key={member.id}>
            <TeamMemberCard member={member} lang={lang} />
          </li>
        ))}
      </ul>
    </div>
  );
}
