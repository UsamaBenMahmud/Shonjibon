import { useQuery } from "@tanstack/react-query";
import {
  getSettings,
  listArticles,
  listProducts,
  listSimple,
} from "@/lib/api";
import type { CommunityVisit, ImpactStat, JourneyMilestone, TeamMember, Testimonial, TestResult } from "@/lib/types";
import { Hero } from "@/components/home/Hero";
import {
  ImpactSection,
  ShellDiagramSection,
  ProductsSection,
  CircularEconomySection,
  WasteRingSection,
  JourneyTimelineSection,
  CommunityPreviewSection,
  ArticlesPreviewSection,
  TeamPreviewSection,
  TestimonialsSection,
  NewsletterSection,
} from "@/components/home/Sections";
import { SEO } from "@/components/shared";

export default function Home() {
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: getSettings, staleTime: 5 * 60 * 1000 });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: listProducts, staleTime: 5 * 60 * 1000 });
  const impactQ = useQuery({ queryKey: ["impact_stats"], queryFn: () => listSimple<ImpactStat>("impact_stats"), staleTime: 5 * 60 * 1000 });
  const testResultsQ = useQuery({ queryKey: ["test_results"], queryFn: () => listSimple<TestResult>("test_results"), staleTime: 5 * 60 * 1000 });
  const journeyQ = useQuery({ queryKey: ["journey_milestones"], queryFn: () => listSimple<JourneyMilestone>("journey_milestones"), staleTime: 5 * 60 * 1000 });
  const communityQ = useQuery({ queryKey: ["community_visits"], queryFn: () => listSimple<CommunityVisit>("community_visits"), staleTime: 5 * 60 * 1000 });
  const articlesQ = useQuery({ queryKey: ["articles"], queryFn: () => listArticles(), staleTime: 5 * 60 * 1000 });
  const teamQ = useQuery({ queryKey: ["team_members"], queryFn: () => listSimple<TeamMember>("team_members"), staleTime: 5 * 60 * 1000 });
  const testimonialsQ = useQuery({ queryKey: ["testimonials"], queryFn: () => listSimple<Testimonial>("testimonials"), staleTime: 5 * 60 * 1000 });

  const sections = settingsQ.data?.sections;
  if (!settingsQ.data) return null;

  return (
    <>
      <SEO
        title="সঞ্জীবন Shonjibon"
        description="Shrimp-shell waste to chitosan: a low-cost, electricity-free water filter helping reduce arsenic, heavy metals and turbidity for coastal Bangladesh."
      />
      {sections?.hero && <Hero settings={settingsQ.data} />}
      {sections?.impact && <ImpactSection stats={impactQ.data ?? []} testResults={testResultsQ.data ?? []} />}
      {sections?.shellDiagram && <ShellDiagramSection products={productsQ.data ?? []} />}
      {sections?.products && <ProductsSection products={productsQ.data ?? []} />}
      {sections?.circularEconomy && <CircularEconomySection />}
      {sections?.wasteRing && <WasteRingSection percent={(impactQ.data ?? []).find((s) => s.suffix === "%")?.value ?? 70} />}
      {sections?.journey && <JourneyTimelineSection milestones={journeyQ.data ?? []} />}
      {sections?.community && <CommunityPreviewSection visits={communityQ.data ?? []} />}
      {sections?.articles && <ArticlesPreviewSection articles={articlesQ.data ?? []} />}
      {sections?.team && <TeamPreviewSection members={teamQ.data ?? []} />}
      {sections?.testimonials && <TestimonialsSection items={testimonialsQ.data ?? []} />}
      {sections?.newsletter && <NewsletterSection />}
    </>
  );
}
