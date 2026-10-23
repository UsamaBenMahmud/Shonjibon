import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, FieldWrap, Input, Textarea } from "@/components/ui";
import { SEO, Section, SectionHeading } from "@/components/shared";
import { hasSupabase, supabase } from "@/lib/supabase";
import {
  accountAddressSchema,
  accountLoginSchema,
  accountSignupSchema,
} from "@/lib/schemas";
import {
  createMockAccount,
  getMockAccount,
  listMockAccountOrders,
  signInMockAccount,
  signOutMockAccount,
  updateMockAccount,
  type MockAddress,
} from "@/lib/mockAccount";
import type { Order } from "@/lib/types";
import { getDb } from "@/lib/mockDb";
import { formatCurrency, formatDate } from "@/lib/utils";

type AccountAddress = MockAddress & { user_id?: string; created_at?: string };
type AccountWishlistItem = {
  product_id: string;
  products: { slug: string; name_en: string; name_bn: string; cover_image: string; price: number } | null;
};
type AccountUser = { id: string; email: string; full_name: string };
type AuthMode = "sign_in" | "sign_up";

export default function Account() {
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [wishlist, setWishlist] = useState<AccountWishlistItem[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [addressForm, setAddressForm] = useState({ label: "Home", recipient_name: "", phone: "", address: "", district: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshAccount(signedIn: AccountUser | null) {
    setUser(signedIn);
    if (!signedIn) {
      setOrders([]);
      setAddresses([]);
      setWishlist([]);
      return;
    }
    if (hasSupabase && supabase) {
      const [ordersResult, addressesResult, wishlistResult] = await Promise.all([
        supabase.from("orders")
          .select("*, items:order_items(*)")
          .eq("user_id", signedIn.id)
          .order("created_at", { ascending: false }),
        supabase.from("customer_addresses").select("*").eq("user_id", signedIn.id).order("created_at"),
        supabase.from("customer_wishlist").select("product_id, products(slug,name_en,name_bn,cover_image,price)").eq("user_id", signedIn.id),
      ]);
      if (ordersResult.error) throw ordersResult.error;
      if (addressesResult.error) throw addressesResult.error;
      if (wishlistResult.error) throw wishlistResult.error;
      setOrders((ordersResult.data ?? []) as unknown as Order[]);
      setAddresses((addressesResult.data ?? []) as AccountAddress[]);
      setWishlist((wishlistResult.data ?? []) as unknown as AccountWishlistItem[]);
      return;
    }
    setOrders(listMockAccountOrders());
    const account = getMockAccount();
    setAddresses(account?.addresses ?? []);
    const products = getDb().products;
    setWishlist((account?.wishlist ?? []).map((productId) => ({
      product_id: productId,
      products: products.find((product) => product.id === productId) ?? null,
    })));
  }

  useEffect(() => {
    if (!hasSupabase || !supabase) {
      setUser(getMockAccount());
      void refreshAccount(getMockAccount()).catch((cause: unknown) => setError(errorText(cause)));
      return;
    }
    let active = true;
    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (sessionError) throw sessionError;
      const sessionUser = data.session?.user;
      if (!sessionUser || !active) return;
      const { data: profile, error: profileError } = await supabase!
        .from("profiles").select("full_name,email").eq("id", sessionUser.id).single();
      if (profileError) throw profileError;
      if (active) {
        await refreshAccount({
          id: sessionUser.id,
          email: profile.email || sessionUser.email || "",
          full_name: profile.full_name || "",
        });
      }
    }).catch((cause: unknown) => {
      if (active) setError(errorText(cause));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (active) void refreshAccount(null).catch((cause: unknown) => setError(errorText(cause)));
      } else if (active) {
        window.setTimeout(() => {
          void (async () => {
            const { data: profile, error: profileError } = await supabase!
              .from("profiles").select("full_name,email").eq("id", session.user.id).single();
            if (profileError) {
              setError(errorText(profileError));
              return;
            }
            await refreshAccount({
              id: session.user.id,
              email: profile.email || session.user.email || "",
              full_name: profile.full_name || "",
            });
          })().catch((cause: unknown) => setError(errorText(cause)));
        }, 0);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const parsed = mode === "sign_up"
      ? accountSignupSchema.safeParse({ full_name: name, email, password })
      : accountLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "তথ্য যাচাই করুন / Please check the form");
      return;
    }
    setBusy(true);
    try {
      if (hasSupabase && supabase) {
        if (mode === "sign_up") {
          const values = parsed.data as typeof parsed.data & { full_name: string };
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: { data: { full_name: values.full_name } },
          });
          if (signUpError) throw signUpError;
          if (!data.session) {
            setNotice("ইমেইল যাচাই করুন / Check your email to confirm your account.");
          } else {
            setNotice("অ্যাকাউন্ট তৈরি হয়েছে / Account created");
          }
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: parsed.data.email,
            password: parsed.data.password,
          });
          if (signInError) throw signInError;
        }
      } else if (mode === "sign_up") {
        const values = parsed.data as typeof parsed.data & { full_name: string };
        const created = await createMockAccount(values.email, values.full_name, values.password);
        await refreshAccount(created);
        setNotice("অ্যাকাউন্ট তৈরি হয়েছে / Account created");
      } else {
        const signedIn = await signInMockAccount(parsed.data.email, parsed.data.password);
        await refreshAccount(signedIn);
      }
      setPassword("");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }

  async function sendPasswordReset() {
    setError("");
    setNotice("");
    const parsed = accountLoginSchema.shape.email.safeParse(email);
    if (!parsed.success) {
      setError("সঠিক ইমেইল দিন / Enter a valid email first");
      return;
    }
    if (!hasSupabase || !supabase) {
      setError("ডেমো মোডে পাসওয়ার্ড রিসেট নেই / Password reset is unavailable in local demo mode");
      return;
    }
    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/account`,
      });
      if (resetError) throw resetError;
      setNotice("পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে / Password reset email sent");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setError("");
    try {
      if (hasSupabase && supabase) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      } else {
        signOutMockAccount();
        await refreshAccount(null);
      }
    } catch (cause) {
      setError(errorText(cause));
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const parsed = accountSignupSchema.shape.full_name.safeParse(name || user.full_name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "নাম যাচাই করুন / Check the name");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (hasSupabase && supabase) {
        const { error: updateError } = await supabase.from("profiles")
          .update({ full_name: parsed.data }).eq("id", user.id);
        if (updateError) throw updateError;
      } else {
        updateMockAccount({ full_name: parsed.data });
      }
      const updated = { ...user, full_name: parsed.data };
      setUser(updated);
      setName("");
      setNotice("প্রোফাইল সংরক্ষিত / Profile saved");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }

  async function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setError("");
    const parsed = accountAddressSchema.safeParse(addressForm);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "ঠিকানা যাচাই করুন / Check the address");
      return;
    }
    setBusy(true);
    try {
      let next: AccountAddress[];
      if (hasSupabase && supabase) {
        const { data, error: insertError } = await supabase.from("customer_addresses")
          .insert({ ...parsed.data, user_id: user.id, is_default: addresses.length === 0 }).select().single();
        if (insertError) throw insertError;
        next = [...addresses, data as AccountAddress];
      } else {
        const account = getMockAccount();
        const newAddress = { ...parsed.data, id: crypto.randomUUID(), is_default: !account?.addresses.length };
        const updated = updateMockAccount({ addresses: [...(account?.addresses ?? []), newAddress] });
        next = updated.addresses;
      }
      setAddresses(next);
      setAddressForm({ label: "Home", recipient_name: "", phone: "", address: "", district: "" });
      setNotice("ঠিকানা সংরক্ষিত / Address saved");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }

  async function deleteAddress(id: string) {
    if (!user) return;
    setError("");
    try {
      if (hasSupabase && supabase) {
        const { error: deleteError } = await supabase.from("customer_addresses")
          .delete().eq("id", id).eq("user_id", user.id);
        if (deleteError) throw deleteError;
      } else {
        const account = getMockAccount();
        updateMockAccount({ addresses: (account?.addresses ?? []).filter((entry) => entry.id !== id) });
      }
      setAddresses((current) => current.filter((entry) => entry.id !== id));
    } catch (cause) {
      setError(errorText(cause));
    }
  }

  async function removeWishlistItem(productId: string) {
    if (!user) return;
    setError("");
    try {
      if (hasSupabase && supabase) {
        const { error: deleteError } = await supabase.from("customer_wishlist")
          .delete().eq("product_id", productId).eq("user_id", user.id);
        if (deleteError) throw deleteError;
      } else {
        const account = getMockAccount();
        updateMockAccount({ wishlist: (account?.wishlist ?? []).filter((id) => id !== productId) });
      }
      setWishlist((current) => current.filter((entry) => entry.product_id !== productId));
    } catch (cause) {
      setError(errorText(cause));
    }
  }

  return (
    <>
      <SEO title="My account" />
      <Section>
        <SectionHeading title="অ্যাকাউন্ট / My account" body="Manage your profile, delivery addresses, saved products, and order history." />
        {error && <p role="alert" className="mt-5 rounded-xl border border-coral/30 bg-coral/10 p-3 text-sm text-coral-text">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-xl border border-teal/30 bg-teal/10 p-3 text-sm text-teal-dark">{notice}</p>}
        {!user ? (
          <form onSubmit={submitAuth} className="card mt-8 max-w-xl space-y-4 p-5" noValidate>
            <div className="flex gap-2 border-b border-border pb-3">
              <button type="button" onClick={() => setMode("sign_in")} className={mode === "sign_in" ? "font-semibold text-teal-dark" : "text-ink-muted"}>Sign in</button>
              <button type="button" onClick={() => setMode("sign_up")} className={mode === "sign_up" ? "font-semibold text-teal-dark" : "text-ink-muted"}>Create account</button>
            </div>
            {mode === "sign_up" && <FieldWrap label="Full name" required><Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></FieldWrap>}
            <FieldWrap label="Email" required><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></FieldWrap>
            <FieldWrap label="Password (minimum 8 characters)" required><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "sign_up" ? "new-password" : "current-password"} /></FieldWrap>
            <Button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "sign_up" ? "Create account" : "Sign in"}</Button>
            {mode === "sign_in" && <button type="button" onClick={() => void sendPasswordReset()} disabled={busy} className="ml-3 text-sm text-teal-dark underline">Forgot password?</button>}
            <p className="text-xs leading-relaxed text-ink-muted">Your account is used for order history, saved products, and delivery addresses. Mock-mode accounts are stored only in this browser.</p>
          </form>
        ) : (
          <div className="mt-8 space-y-8">
            <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">{user.full_name || user.email}</h2>
                <p className="text-sm text-ink-muted">{user.email}</p>
              </div>
              <Button variant="secondary" onClick={() => void signOut()}>Sign out</Button>
            </section>

            <section className="grid gap-8 lg:grid-cols-2">
              <div className="card space-y-4 p-5">
                <h2 className="font-display text-lg font-semibold text-ink">Profile</h2>
                <form onSubmit={saveProfile} className="space-y-3">
                  <FieldWrap label="Full name">
                    <Input value={name || user.full_name} onChange={(event) => setName(event.target.value)} />
                  </FieldWrap>
                  <Button type="submit" variant="secondary" disabled={busy}>Save profile</Button>
                </form>
              </div>
              <form onSubmit={saveAddress} className="card space-y-3 p-5">
                <h2 className="font-display text-lg font-semibold text-ink">Add delivery address</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldWrap label="Label"><Input value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} /></FieldWrap>
                  <FieldWrap label="Recipient name"><Input value={addressForm.recipient_name} onChange={(event) => setAddressForm({ ...addressForm, recipient_name: event.target.value })} /></FieldWrap>
                  <FieldWrap label="Bangladesh mobile"><Input value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} /></FieldWrap>
                  <FieldWrap label="District"><Input value={addressForm.district} onChange={(event) => setAddressForm({ ...addressForm, district: event.target.value })} /></FieldWrap>
                </div>
                <FieldWrap label="Street address"><Textarea rows={2} value={addressForm.address} onChange={(event) => setAddressForm({ ...addressForm, address: event.target.value })} /></FieldWrap>
                <Button type="submit" variant="secondary" disabled={busy}>Save address</Button>
              </form>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-semibold text-ink">Delivery addresses</h2>
              {addresses.length === 0 ? <p className="text-sm text-ink-muted">No saved addresses yet.</p> : addresses.map((entry) => (
                <div key={entry.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-ink">{entry.label} {entry.is_default && <span className="text-xs text-teal-dark">· Default</span>}</p>
                    <p className="text-sm text-ink-muted">{entry.recipient_name} · {entry.phone} · {entry.address}, {entry.district}</p>
                  </div>
                  <button type="button" onClick={() => void deleteAddress(entry.id)} className="text-sm text-coral-text hover:underline">Remove</button>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-semibold text-ink">Saved products</h2>
              {wishlist.length === 0 ? <p className="text-sm text-ink-muted">No saved products yet. Browse the <Link to="/products" className="text-teal-dark underline">shop</Link>.</p> : wishlist.map((item) => (
                <div key={item.product_id} className="card flex items-center justify-between gap-3 p-4">
                  {item.products
                    ? <Link to={`/products/${item.products.slug}`} className="font-medium text-ink hover:text-teal-dark">{item.products.name_en}</Link>
                    : <span className="text-sm text-ink-muted">Saved product ({item.product_id})</span>}
                  <button type="button" onClick={() => void removeWishlistItem(item.product_id)} className="text-sm text-coral-text hover:underline">Remove</button>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-semibold text-ink">Order history</h2>
              {orders.length === 0 ? <p className="text-sm text-ink-muted">No linked orders yet.</p> : orders.map((order) => (
                <article key={order.id} className="card space-y-2 p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <Link to={`/order-success/${encodeURIComponent(order.order_no)}`} className="font-semibold text-teal-dark underline">{order.order_no}</Link>
                    <span className="text-sm text-ink-muted">{formatDate(order.created_at, "en")}</span>
                  </div>
                  <p className="text-sm text-ink-muted">Status: {order.status} · Payment: {order.payment_status ?? "unpaid"}</p>
                  <p className="text-sm font-medium text-ink">{formatCurrency(order.total, "BDT", "en")}</p>
                </article>
              ))}
            </section>
          </div>
        )}
      </Section>
    </>
  );
}

function errorText(cause: unknown) {
  return cause instanceof Error
    ? `সমস্যা হয়েছে / Something went wrong: ${cause.message}`
    : "সমস্যা হয়েছে / Something went wrong";
}
