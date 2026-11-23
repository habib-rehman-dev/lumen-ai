import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import type { DocumentItem } from "@/lib/api";

export function StatusBadge({ status }: { status: DocumentItem["status"] }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="size-3 animate-spin" /> Processing
        </Badge>
      );
    case "ready":
      return (
        <Badge variant="outline" className="gap-1">
          <CheckCircle2 className="size-3" /> Ready
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" /> Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">Deleting</Badge>;
  }
}