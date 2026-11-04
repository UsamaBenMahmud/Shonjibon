import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ADMIN_LAST_ACTIVITY_KEY } from "@/lib/adminPath";
import type { Session } from "@supabase/supabase-js";
import { hasSupabase, supabase } from "@/lib/supabase";
import Login from "@/admin/Login";
import AdminLayout from "@/admin/AdminLayout";
import Dashboard from "@/admin/Dashboard";
import Settings from "@/admin/Settings";
import HealthCheck from "@/admin/HealthCheck";
import ProductsManager from "@/admin/ProductsManager";
import ArticlesManager from "@/admin/ArticlesManager";
import MediaManager from "@/admin/MediaManager";
import OrdersManager from "@/admin/OrdersManager";
import { MessagesManager, SubscribersManager, AuditLogManager, UsersManager } from "@/admin/MiscManagers";
import {
  CategoriesManager,
  CommunityManager,
  DownloadsManager,
  FaqsManager,
  ImpactStatsManager,
  JourneyManager,
  PartnersManager,
  ProductCategoriesManager,
  PageSectionsManager,
  NavigationManager,
  ResearchManager,
  ShellPartsManager,
  SiteTextManager,
  TeamManager,
  TestResultsManager,
  TestimonialsManager,
} from "@/admin/GenericManagers";

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (hasSupabase && supabase) {
      let active = true;
      async function checkAccess(session: Session | null) {
        if (!session) {
          if (active) {
            setDenied(false);
            setAuthed(false);
          }
          return;
        }
        const lastActivity = Number(sessionStorage.getItem(ADMIN_LAST_ACTIVITY_KEY));
        if (!lastActivity || Date.now() - lastActivity >= 30 * 60 * 1000) {
          if (active) {
            setDenied(false);
            setAuthed(false);
          }
          return;
        }
        const { data, error } = await supabase!.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
        if (error) {
          console.error("Could not verify admin role", error);
          if (active) {
            setDenied(false);
            setAuthed(false);
          }
          return;
        }
        const isAdmin = data?.role === "super_admin" || data?.role === "editor";
        if (data?.role === "super_admin") {
          const { data: assurance, error: assuranceError } = await supabase!.auth.mfa.getAuthenticatorAssuranceLevel();
          if (assuranceError) {
            console.error("Could not verify admin MFA assurance", assuranceError);
            if (active) {
              setDenied(false);
              setAuthed(false);
            }
            return;
          }
          if (assurance.currentLevel !== "aal2") {
            if (active) {
              setDenied(false);
              setAuthed(false);
            }
            return;
          }
        }
        if (active) {
          setDenied(!isAdmin);
          setAuthed(isAdmin);
        }
      }
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error("Could not restore authentication session", error);
          setAuthed(false);
          return;
        }
        void checkAccess(data.session);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          void checkAccess(null);
          return;
        }
        window.setTimeout(() => void checkAccess(session), 0);
      });
      return () => {
        active = false;
        sub.subscription.unsubscribe();
      };
    }
    sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
    sessionStorage.removeItem("shonjibon.admin.authed");
    setAuthed(false);
  }, []);

  async function handleLogout() {
    sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
    if (hasSupabase && supabase) {
      await supabase.auth.signOut();
    }
    setDenied(false);
    setAuthed(false);
  }

  useEffect(() => {
    if (!authed) return;
    let lastWrite = 0;
    const expireIfIdle = () => {
      const lastActivity = Number(sessionStorage.getItem(ADMIN_LAST_ACTIVITY_KEY));
      if (!lastActivity || Date.now() - lastActivity >= 30 * 60 * 1000) {
        void handleLogout();
      }
    };
    const markActive = () => {
      if (Date.now() - lastWrite < 10_000) return;
      lastWrite = Date.now();
      sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(lastWrite));
    };
    const activityEvents = ["pointerdown", "keydown", "touchstart"];
    activityEvents.forEach((event) => window.addEventListener(event, markActive, { passive: true }));
    const timer = window.setInterval(expireIfIdle, 15_000);
    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, markActive));
      window.clearInterval(timer);
    };
  }, [authed]);

  if (authed === null) {
    return <><Helmet><meta name="robots" content="noindex,nofollow" /></Helmet><div className="flex min-h-screen items-center justify-center text-ink-muted">Loading...</div></>;
  }

  if (!authed) {
    if (denied) {
      return (
        <>
          <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
          <main className="flex min-h-screen items-center justify-center bg-bg-soft p-6">
            <section className="w-full max-w-xl space-y-4 rounded-2xl border border-border bg-surface p-8 text-ink shadow-sm">
              <h1 className="font-display text-2xl font-semibold">Admin access is not enabled for this account</h1>
              <p className="text-sm leading-relaxed text-ink-muted">
                In your Supabase Dashboard, open SQL Editor and run this query with the same email you used to create your account:
              </p>
              <pre className="overflow-x-auto rounded-xl bg-bg-soft p-4 text-xs leading-relaxed text-ink">
                {"insert into public.profiles (id, full_name, email, role)\nselect id, coalesce(raw_user_meta_data->>'full_name', 'Admin'), email, 'super_admin'\nfrom auth.users\nwhere lower(email) = lower('your-signup-email@example.com')\non conflict (id) do update\nset role = excluded.role, email = excluded.email;"}
              </pre>
              <p className="text-sm leading-relaxed text-ink-muted">
                After the query succeeds, sign out here and sign in again. If it updates no rows, check that the email matches a user under Supabase Authentication → Users.
              </p>
              <button type="button" onClick={() => void handleLogout()} className="btn-primary">
                Sign out
              </button>
            </section>
          </main>
        </>
      );
    }
    return <><Helmet><meta name="robots" content="noindex,nofollow" /></Helmet><Login onSuccess={() => setAuthed(true)} /></>;
  }

  return (
    <>
    <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
    <Routes>
      <Route element={<AdminLayout onLogout={handleLogout} />}>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="health" element={<HealthCheck />} />
        <Route path="page-sections" element={<PageSectionsManager />} />
        <Route path="site-text" element={<SiteTextManager />} />
        <Route path="navigation" element={<NavigationManager />} />
        <Route path="shell-story" element={<ShellPartsManager />} />
        <Route path="products" element={<ProductsManager />} />
        <Route path="articles" element={<ArticlesManager />} />
        <Route path="categories" element={<CategoriesManager />} />
        <Route path="product-categories" element={<ProductCategoriesManager />} />
        <Route path="team" element={<TeamManager />} />
        <Route path="journey" element={<JourneyManager />} />
        <Route path="research" element={<ResearchManager />} />
        <Route path="testing" element={<TestResultsManager />} />
        <Route path="impact" element={<ImpactStatsManager />} />
        <Route path="community" element={<CommunityManager />} />
        <Route path="testimonials" element={<TestimonialsManager />} />
        <Route path="faqs" element={<FaqsManager />} />
        <Route path="partners" element={<PartnersManager />} />
        <Route path="downloads" element={<DownloadsManager />} />
        <Route path="media" element={<MediaManager />} />
        <Route path="orders" element={<OrdersManager />} />
        <Route path="messages" element={<MessagesManager />} />
        <Route path="subscribers" element={<SubscribersManager />} />
        <Route path="audit" element={<AuditLogManager />} />
        <Route path="users" element={<UsersManager />} />
      </Route>
    </Routes>
    </>
  );
}
