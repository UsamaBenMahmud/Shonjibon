import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailLoginSchema, loginSchema, type LoginInput } from "@/lib/schemas";
import { Button, FieldWrap, Input } from "@/components/ui";
import { Logo } from "@/components/shared";
import { hasSupabase, supabase } from "@/lib/supabase";
import { ADMIN_LAST_ACTIVITY_KEY } from "@/lib/adminPath";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"password" | "totp" | "enroll">("password");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setError("");
    if (hasSupabase && supabase) {
      if (phase !== "password") {
        await verifyTotp();
        return;
      }
      const parsed = emailLoginSchema.safeParse({ email, password: values.password });
      if (!parsed.success) {
        setError("Sign in failed. Check your credentials and try again.");
        return;
      }
      try {
        const { data: signedIn, error: authError } = await supabase.auth.signInWithPassword(parsed.data);
        if (authError || !signedIn.user) throw authError ?? new Error("Authentication failed");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", signedIn.user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (profile?.role !== "super_admin" && profile?.role !== "editor") {
          await supabase.auth.signOut();
          throw new Error("Authentication failed");
        }
        if (profile.role === "super_admin") {
          const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (assuranceError) throw assuranceError;
          if (assurance.currentLevel !== "aal2") {
            const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
            if (factorsError) throw factorsError;
            const verifiedFactor = factors.totp.find((factor) => factor.status === "verified");
            if (verifiedFactor) {
              setFactorId(verifiedFactor.id);
              setPhase("totp");
            } else {
              const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({
                factorType: "totp",
                friendlyName: "Shonjibon administrator",
              });
              if (enrollmentError) throw enrollmentError;
              setFactorId(enrollment.id);
              setQrCode(enrollment.totp.qr_code);
              setPhase("enroll");
            }
            return;
          }
        }
        markAuthenticated();
      } catch (authFailure) {
        if (import.meta.env.DEV) console.error("Admin sign-in failed", authFailure);
        sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
        setError("Sign in failed. Check your credentials and try again.");
      }
      return;
    }
    const { getSettings } = await import("@/lib/api");
    const settings = await getSettings();
    if (values.password === settings.admin_password) {
      sessionStorage.setItem("shonjibon.admin.authed", "1");
      sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
      onSuccess();
    } else {
      setError("ভুল পাসওয়ার্ড / Incorrect password");
    }
  }

  async function verifyTotp() {
    if (!supabase || !factorId || !/^\d{6,8}$/.test(totpCode.trim())) {
      setError("Enter a valid authentication code.");
      return;
    }
    setError("");
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: totpCode.trim(),
      });
      if (verifyError) throw verifyError;
      markAuthenticated();
    } catch (verificationFailure) {
      if (import.meta.env.DEV) console.error("Admin MFA verification failed", verificationFailure);
      setError("Authentication code was not accepted. Try again.");
    }
  }

  function markAuthenticated() {
    sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
    onSuccess();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-soft p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-1 text-center font-display text-xl font-semibold text-ink">অ্যাডমিন লগইন / Admin login</h1>
        <p className="mb-6 text-center text-sm text-ink-muted">
          {phase === "password"
            ? hasSupabase ? "Sign in with your admin account." : "Demo password: shonjibon2026 (changeable in Settings)."
            : phase === "enroll"
              ? "Set up an authenticator app to continue. Scan the code, then enter its current code."
              : "Enter the current code from your authenticator app."}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {hasSupabase && phase === "password" && (
            <FieldWrap label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </FieldWrap>
          )}
          {phase === "password" ? (
            <FieldWrap label="পাসওয়ার্ড / Password" error={errors.password?.message}>
              <Input type="password" {...register("password")} error={!!errors.password} />
            </FieldWrap>
          ) : (
            <>
              {phase === "enroll" && qrCode && (
                <img src={qrCode} alt="Authenticator enrollment QR code" className="mx-auto max-w-48 rounded-lg border border-border bg-white p-2" />
              )}
              <FieldWrap label="Authentication code">
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={totpCode}
                  onChange={(event) => setTotpCode(event.target.value)}
                  required
                />
              </FieldWrap>
            </>
          )}
          {error && <p className="text-sm font-medium text-coral-text">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {phase === "password" ? "লগইন / Log in" : "Verify code"}
          </Button>
        </form>
      </div>
    </div>
  );
}
