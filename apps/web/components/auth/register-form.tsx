"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { registerAction, type FormState } from "@/lib/auth-actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" defaultValue={state.name}
               maxLength={80} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email"
               defaultValue={state.email} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password"
               minLength={8} maxLength={128} required />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Create account
      </Button>
    </form>
  );
}