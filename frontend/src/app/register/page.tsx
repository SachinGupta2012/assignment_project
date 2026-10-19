"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { ToastMessage } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<string>("/api/auth/register", {
        method: "POST",
        authenticated: false,
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        }),
      });
      setSuccess(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card register-card">
        <div className="login-brand"><Brand href="/login" /></div>
        <div className="login-heading"><h1>Create your account</h1><p>Start learning with LMS.</p></div>
        <ToastMessage message={error} type="error" />
        {success ? (
          <>
            <ToastMessage message="Account created successfully. You can now sign in." type="success" />
            <Link href="/login" className="button button-primary button-full">Go to sign in</Link>
          </>
        ) : (
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="form-grid auth-name-grid">
              <Field label="First name"><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required /></Field>
              <Field label="Last name"><Input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required /></Field>
            </div>
            <Field label="Email"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" autoComplete="email" required /></Field>
            <Field label="Password"><PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" autoComplete="new-password" minLength={8} required /></Field>
            <Field label="Confirm password"><PasswordInput value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter the password again" autoComplete="new-password" minLength={8} required /></Field>
            <Button type="submit" fullWidth disabled={submitting}>{submitting ? "Creating account..." : "Create account"}</Button>
          </form>
        )}
        <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
