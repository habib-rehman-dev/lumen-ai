import { enabledProviders } from "@/auth";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { oauthSignIn } from "@/lib/auth-actions";

export function OAuthButtons() {
  if (enabledProviders.length === 0) return null;

  return (
    <>
      <div className="relative my-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
          or
        </span>
      </div>
      <div className="space-y-2">
        {enabledProviders.map((p) => (
          <form key={p.id} action={oauthSignIn}>
            <input type="hidden" name="provider" value={p.id} />
            <Button type="submit" variant="outline" className="w-full">
              Continue with {p.name}
            </Button>
          </form>
        ))}
      </div>
    </>
  );
}