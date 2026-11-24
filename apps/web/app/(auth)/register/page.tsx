import Link from "next/link";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { RegisterForm } from "@/components/auth/register-form";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@workspace/ui/components/card";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Your documents and chats stay private to you.</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
        <OAuthButtons />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}