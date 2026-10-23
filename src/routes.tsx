import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header, Footer } from "@/components/layout";
import { Toaster } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui";

const Home = lazy(() => import("@/pages/Home"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Research = lazy(() => import("@/pages/Research"));
const Testing = lazy(() => import("@/pages/Testing"));
const Community = lazy(() => import("@/pages/Community"));
const News = lazy(() => import("@/pages/News"));
const Article = lazy(() => import("@/pages/Article"));
const Info = lazy(() => import("@/pages/Info"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderSuccess = lazy(() => import("@/pages/OrderSuccess"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminApp = lazy(() => import("@/admin/AdminApp"));
const ContextPage = lazy(() => import("@/pages/ContextPages"));
const ShellPage = lazy(() => import("@/pages/Shell"));
const LegalPage = lazy(() => import("@/pages/Legal"));
const Account = lazy(() => import("@/pages/Account"));

function PageFallback() {
  return (
    <div className="container-px py-16">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route
            path="/*"
            element={
              <PublicLayout>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:slug" element={<ProductDetail />} />
                    <Route path="/research" element={<Research />} />
                    <Route path="/lab-results" element={<Testing />} />
                    <Route path="/testing" element={<Navigate to="/lab-results" replace />} />
                    <Route path="/gallery" element={<Community />} />
                    <Route path="/community" element={<Navigate to="/gallery" replace />} />
                    <Route path="/coastal-problem" element={<ContextPage page="coastal" />} />
                    <Route path="/concerns" element={<ContextPage page="concerns" />} />
                    <Route path="/health" element={<ContextPage page="health" />} />
                    <Route path="/shell" element={<ShellPage />} />
                    <Route path="/terms" element={<LegalPage pageKey="terms" />} />
                    <Route path="/privacy" element={<LegalPage pageKey="privacy" />} />
                    <Route path="/refund-policy" element={<LegalPage pageKey="refund" />} />
                    <Route path="/shipping-policy" element={<LegalPage pageKey="shipping" />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/news/:slug" element={<Article />} />
                    <Route path="/team" element={<Info page="team" />} />
                    <Route path="/about" element={<Info page="about" />} />
                    <Route path="/faq" element={<Info page="faq" />} />
                    <Route path="/contact" element={<Info page="contact" />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/order-success/:orderNo" element={<OrderSuccess />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </PublicLayout>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}
