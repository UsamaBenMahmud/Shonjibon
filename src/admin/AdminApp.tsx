import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
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
    setAuthed(sessionStorage.getItem("shonjibon.admin.authed") === "1");
  }, []);

  async function handleLogout() {
    if (hasSupabase && supabase) {
      await supabase.auth.signOut();
    } else {
      sessionStorage.removeItem("shonjibon.admin.authed");
    }
    setDenied(false);
    setAuthed(false);
  }

  if (authed === null) {
    return <div className="flex min-h-screen items-center justify-center text-ink-muted">Loading...</div>;
  }

  if (!authed) {
    if (denied) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-soft p-6 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">অ্যাডমিন অনুমতি নেই / Admin access required</h1>
          <p className="max-w-lg text-sm text-ink-muted">This account is not assigned an editor or super-admin role.</p>
          <Link to="/account" className="text-teal-dark underline">Go to customer account</Link>
          <button type="button" onClick={() => void handleLogout()} className="btn-secondary">Sign out</button>
        </div>
      );
    }
    return <Login onSuccess={() => { if (!hasSupabase) setAuthed(true); }} />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout onLogout={handleLogout} />}>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="health" element={<HealthCheck />} />
        <Route path="page-sections" element={<PageSectionsManager />} />
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
  );
}
