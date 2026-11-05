"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function messageOf(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong";
}

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Countdown for the "resend code" button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");

    const fields = Object.fromEntries(new FormData(e.currentTarget));
    if (isSignup && fields.password !== fields.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await api(`/api/auth/${mode}`, "POST", fields);
      if (isSignup) {
        setPendingEmail(data.email);
        setCooldown(data.retryAfter ?? 60);
        if (data.sent === false) {
          setInfo("A code was sent a moment ago. Check your inbox.");
        }
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");

    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    setLoading(true);
    try {
      await api("/api/auth/verify", "POST", { code });
      router.push("/");
      router.refresh();
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
      const data = await api("/api/auth/resend", "POST");
      setCooldown(data.retryAfter ?? 60);
      setInfo("A new code was sent. Older codes no longer work.");
    } catch (err) {
      setError(messageOf(err));
    }
  }

  if (isSignup && pendingEmail) {
    return (
      <main className="mx-auto mt-20 max-w-sm px-4">
        <Card>
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              We sent a 6-digit code to {pendingEmail}. It expires in 10 minutes.
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
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
              {error && <p className="text-sm text-destructive">{error}</p>}
              {info && <p className="text-sm text-muted-foreground">{info}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify and create account"}
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
                  setPendingEmail(null);
                  setError("");
                  setInfo("");
                }}
                className="text-muted-foreground underline"
              >
                Use a different email
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-20 max-w-sm px-4">
      <Card>
        <CardHeader>
          <CardTitle>{isSignup ? "Create an account" : "Log in"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && <Input name="name" placeholder="Name (optional)" />}
            <Input name="email" type="email" placeholder="Email" required />
            <Input
              name="password"
              type="password"
              placeholder={isSignup ? "Password (min 8 characters)" : "Password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
            />
            {isSignup && (
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                required
              />
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Send verification code" : "Log in"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            {isSignup ? "Have an account? " : "No account? "}
            <Link href={isSignup ? "/login" : "/signup"} className="underline">
              {isSignup ? "Log in" : "Sign up"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}