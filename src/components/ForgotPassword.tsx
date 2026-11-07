"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function messageOf(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong";
}

export default function ForgotPasswordForm() {
  const [stage, setStage] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const value = String(new FormData(e.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();

    setLoading(true);
    try {
      const data = await api("/api/auth/forgot", "POST", { email: value });
      setEmail(value);
      setCooldown(data.retryAfter ?? 60);
      setStage("reset");
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    try {
      const data = await api("/api/auth/forgot", "POST", { email });
      setCooldown(data.retryAfter ?? 60);
      setInfo("If that email has an account, a new code was sent.");
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");

    const form = new FormData(e.currentTarget);
    const code = String(form.get("code") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api("/api/auth/reset", "POST", { email, code, password, confirmPassword });
      setStage("done");
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-20 max-w-sm px-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {stage === "done" ? "Password updated" : "Reset your password"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stage === "email" && (
            <form onSubmit={handleEmail} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send you a 6-digit code.
              </p>
              <Input name="email" type="email" placeholder="Email" required autoFocus />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : "Send code"}
              </Button>
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="underline">
                  Back to log in
                </Link>
              </p>
            </form>
          )}

          {stage === "reset" && (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                If an account exists for {email}, we sent a 6-digit code. It
                expires in 10 minutes.
              </p>
              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="\d{6}"
                  placeholder="123456"
                  required
                  autoFocus
                />
                <Input
                  name="password"
                  type="password"
                  placeholder="New password (min 8 characters)"
                  autoComplete="new-password"
                  required
                />
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                {info && <p className="text-sm text-muted-foreground">{info}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Updating..." : "Update password"}
                </Button>
              </form>
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="underline disabled:no-underline disabled:opacity-50"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStage("email");
                    setError("");
                    setInfo("");
                  }}
                  className="text-muted-foreground underline"
                >
                  Use a different email
                </button>
              </div>
            </>
          )}

          {stage === "done" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your password has been changed. You can now log in with it.
              </p>
              <Link href="/login" className={`${buttonVariants()} w-full`}>
                Go to log in
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}