import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailLoginSchema, loginSchema, type LoginInput } from "@/lib/schemas";
import { Button, FieldWrap, Input } from "@/components/ui";
import { Logo } from "@/components/shared";
import { hasSupabase, supabase } from "@/lib/supabase";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setError("");
    if (hasSupabase && supabase) {
      const parsed = emailLoginSchema.safeParse({ email, password: values.password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "ইমেইল ও পাসওয়ার্ড যাচাই করুন / Check email and password");
        return;
      }
      const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
      if (authError) {
        setError(authError.message);
        return;
      }
      onSuccess();
      return;
    }
    const { getSettings } = await import("@/lib/api");
    const settings = await getSettings();
    if (values.password === settings.admin_password) {
      sessionStorage.setItem("shonjibon.admin.authed", "1");
      onSuccess();
    } else {
      setError("ভুল পাসওয়ার্ড / Incorrect password");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-soft p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-1 text-center font-display text-xl font-semibold text-ink">অ্যাডমিন লগইন / Admin login</h1>
        <p className="mb-6 text-center text-sm text-ink-muted">
          {hasSupabase ? "Sign in with your Supabase admin account." : "Demo password: shonjibon2026 (changeable in Settings)."}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {hasSupabase && (
            <FieldWrap label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </FieldWrap>
          )}
          <FieldWrap label="পাসওয়ার্ড / Password" error={errors.password?.message}>
            <Input type="password" {...register("password")} error={!!errors.password} />
          </FieldWrap>
          {error && <p className="text-sm font-medium text-coral-text">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            লগইন / Log in
          </Button>
        </form>
      </div>
    </div>
  );
}
