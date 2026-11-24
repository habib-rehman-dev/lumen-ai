"use client";

import { BookOpen, ChevronDown } from "lucide-react";

import { SourceDetails } from "@/components/chat/source-details";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import type { Citation } from "@/lib/api";

export function Sources({ citations }: { citations: Citation[] }) {
    return (
        <Collapsible className="mt-3">
            <CollapsibleTrigger render={() => (<Button variant="ghost" size="sm" className="-ml-2 h-7 gap-1 text-xs text-muted-foreground">
                <BookOpen className="size-3.5" />
                {citations.length} source{citations.length > 1 ? "s" : ""}
                <ChevronDown className="size-3.5" />
            </Button>)} />


            <CollapsibleContent className="mt-2 grid gap-2 sm:grid-cols-2">
                {citations.map((c) => (
                    <Card key={`${c.document_id}-${c.index}`} className="gap-2 py-3">
                        <CardContent className="space-y-2 px-3">
                            {/* The same number that appears in the answer text */}
                            <Badge variant="secondary">[{c.index}]</Badge>
                            <SourceDetails citation={c} />
                        </CardContent>
                    </Card>
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
}