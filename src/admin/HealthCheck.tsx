import { useQuery } from "@tanstack/react-query";
import { getHealthCheck } from "@/lib/api";
import { Badge } from "@/components/ui";

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-sm text-ink">{label}</span>
      <Badge tone={ok ? "teal" : "coral"}>{ok ? "Connected / শনাক্ত" : "Unavailable / অনুপলব্ধ"}</Badge>
    </div>
  );
}

export default function HealthCheck() {
  const healthQ = useQuery({ queryKey: ["health-check"], queryFn: getHealthCheck, retry: 1 });
  const health = healthQ.data;

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="font-display text-2xl font-semibold text-ink">সিস্টেম স্বাস্থ্য / Health check</h1>
      {healthQ.isLoading ? (
        <p className="text-ink-muted">পরীক্ষা চলছে / Checking...</p>
      ) : healthQ.error ? (
        <div role="alert" className="rounded-xl border border-coral/30 bg-coral-soft/30 p-4 text-sm text-ink">
          স্বাস্থ্য পরীক্ষা ব্যর্থ / Health check failed: {healthQ.error instanceof Error ? healthQ.error.message : "Unknown error"}
        </div>
      ) : health ? (
        <>
          <section className="card space-y-1 p-5">
            <CheckRow label="Database connected / ডেটাবেস সংযুক্ত" ok={health.database} />
            <CheckRow label="Storage reachable / স্টোরেজ সচল" ok={health.storage} />
            <CheckRow label="Admin role detected / অ্যাডমিন অনুমতি" ok={health.adminRole} />
          </section>
          <section className="card space-y-2 p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Published content / প্রকাশিত কনটেন্ট</h2>
            <p className="text-sm text-ink-muted">Products / পণ্য: {health.publishedProducts}</p>
            <p className="text-sm text-ink-muted">Articles / নিবন্ধ: {health.publishedArticles}</p>
          </section>
          <section className="card space-y-2 p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Missing settings / অনুপস্থিত সেটিংস</h2>
            {health.missingSettings.length
              ? <ul className="list-inside list-disc text-sm text-coral-text">{health.missingSettings.map((setting) => <li key={setting}>{setting}</li>)}</ul>
              : <p className="text-sm text-teal-dark">সব প্রয়োজনীয় সেটিংস আছে / All required settings are present</p>}
          </section>
        </>
      ) : null}
    </div>
  );
}
