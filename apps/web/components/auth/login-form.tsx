"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { loginAction, type FormState } from "@/lib/auth-actions";

export function LoginForm() {
  // state = what the action returned; pending = true while it runs
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email"
               defaultValue={state.email} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password"
               autoComplete="current-password" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Sign in
      </Button>
    </form>
  );
}