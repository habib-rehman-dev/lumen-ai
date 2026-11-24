"use server";

import { AuthError } from "next-auth";

import { enabledProviders, signIn } from "@/auth";
import { backendAuth } from "@/lib/backend-auth";

// What a form shows after a submit. Name and email are sent back so the form stays filled.
export type FormState = { error?: string; name?: string; email?: string };

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Invalid email or password.", email };
    throw err; // a successful sign-in redirects by throwing, so it MUST be re-thrown
  }
  return {};
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const keep = { name, email };

  // Quick checks for friendly messages (the backend re-validates everything)
  if (!name) return { ...keep, error: "Enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ...keep, error: "Enter a valid email address." };
  if (password.length < 8) return { ...keep, error: "Password must be at least 8 characters." };
  if (password.length > 128) return { ...keep, error: "Password is too long." };
  if (password !== confirm) return { ...keep, error: "Passwords don't match." };

  let res: Response;
  try {
    res = await backendAuth("/auth/register", { name, email, password });
  } catch {
    return { ...keep, error: "The server is unreachable. Please try again." };
  }
  if (res.status === 409) return { ...keep, error: "An account with this email already exists." };
  if (!res.ok) return { ...keep, error: "Couldn't create your account. Please try again." };

  // Account created: sign the user in straight away (same form data has email + password)
  return loginAction({}, formData);
}

export async function oauthSignIn(formData: FormData) {
  const provider = String(formData.get("provider"));
  if (!enabledProviders.some((p) => p.id === provider)) return; // only providers we enabled
  await signIn(provider, { redirectTo: "/" });
}