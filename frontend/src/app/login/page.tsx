"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { ToastMessage } from "@/components/ui/toast";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand"><Brand href="/login" /></div>
        <div className="login-heading"><h1>Welcome back</h1><p>Sign in to continue learning.</p></div>
        <ToastMessage message={error} type="error" />
        <form className="form-stack" onSubmit={handleSubmit}>
          <Field label="Email">
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
          </Field>
          <Button type="submit" fullWidth disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</Button>
        </form>
        <p className="auth-switch">New to LMS? <Link href="/register">Create a new account</Link></p>
      </section>
    </main>
  );
}
