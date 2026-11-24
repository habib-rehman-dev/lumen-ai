import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@workspace/ui/components/card";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to chat with your documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <OAuthButtons />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        No account?&nbsp;
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </CardFooter>
    </Card>
  );
}