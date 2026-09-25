"use client";
import Link from "next/link";
import { Brand } from "@/app/components/shared/Brand";
import { Sanctuary } from "@/app/components/sanctuary/Sanctuary";
import { IconBack } from "@/app/components/icons";
import { EMAIL_SIGNIN_ENABLED } from "@/app/lib/config";

export function SignIn({
  email,
  setEmail,
  otp,
  setOtp,
  otpSent,
  sending,
  resendSeconds,
  toast,
  onRequestCode,
  onVerifyCode,
  onReset,
  onBack,
}: {
  email: string;
  setEmail: (v: string) => void;
  otp: string;
  setOtp: (v: string) => void;
  otpSent: boolean;
  sending: boolean;
  resendSeconds: number;
  toast: string;
  onRequestCode: () => Promise<void>;
  onVerifyCode: () => Promise<void>;
  onReset: () => void;
  onBack: () => void;
}) {
  const showOtpEntry = EMAIL_SIGNIN_ENABLED && otpSent;

  return (
    <main className="auth-shell">
      <div className="auth-art">
        <Sanctuary showControls={false} />
        <div className="auth-art-content">
          <button type="button" className="back light" onClick={onBack} aria-label="Back">
            <IconBack size={16} />
          </button>
          <Brand />
          <div className="auth-quote">
            “Sometimes all you need is someone who gets it.”
            <small>A private space to talk, without the pressure.</small>
          </div>
        </div>
      </div>
      <section className="auth-form">
        <button type="button" className="back auth-form-back" onClick={onBack} aria-label="Back">
          <IconBack size={16} />
        </button>
        <div>
          <h1>{showOtpEntry ? "Enter your code" : "A real conversation starts here."}</h1>
          <p>
            {showOtpEntry
              ? `We sent a 6-digit code to ${email}. Enter it below to continue.`
              : "Sign in with Google to check in with yourself and connect anonymously."}
          </p>
          {showOtpEntry ? (
            <>
              <label>
                Verification code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  onKeyDown={(e) => e.key === "Enter" && void onVerifyCode()}
                />
              </label>
              <button className="secondary wide" disabled={otp.length !== 6 || sending} onClick={() => void onVerifyCode()}>
                {sending ? "Verifying…" : "Verify & continue"}
              </button>
              <button className="text-button skip" disabled={sending || resendSeconds > 0} onClick={() => void onRequestCode()}>
                {sending ? "Sending…" : resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
              </button>
              <button className="text-button skip" onClick={onReset}>
                Use a different email
              </button>
            </>
          ) : (
            <>
              <button type="button" className="google" onClick={() => window.location.assign("/api/auth/google/start")}>
                <b>G</b> Continue with Google
              </button>
              <p className="auth-reassurance">Nothing you say here is tied to your name or your Google profile.</p>
              {EMAIL_SIGNIN_ENABLED && (
                <>
                  <div className="or">
                    <span />
                    or
                    <span />
                  </div>
                  <label>
                    Email address
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      onKeyDown={(e) => e.key === "Enter" && void onRequestCode()}
                    />
                  </label>
                  <button className="secondary wide" disabled={!email.includes("@") || sending} onClick={() => void onRequestCode()}>
                    {sending ? "Sending code…" : "Email me a sign-in code"}
                  </button>
                </>
              )}
            </>
          )}
          <small className="terms-copy">
            By continuing, you agree to myMoodly&apos;s <Link href="/terms">Terms</Link>, acknowledge our{" "}
            <Link href="/privacy">Privacy Policy</Link>, and understand that myMoodly is not a crisis service.
          </small>
        </div>
      </section>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
