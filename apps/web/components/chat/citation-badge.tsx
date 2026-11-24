"use client";

import { SourceDetails } from "@/components/chat/source-details";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import type { Citation } from "@/lib/api";

export function CitationBadge({ citation }: { citation: Citation }) {
    return (
        // Popover (click) instead of hover-card, so it also works on phones
        <Popover>
            <PopoverTrigger render={() => (<button
                type="button"
                aria-label={`Source ${citation.index}: ${citation.filename}`}
                className="mx-0.5 inline-flex h-4 min-w-4 -translate-y-0.5 items-center justify-center rounded-full bg-primary/10 px-1 align-middle text-[10px] font-semibold text-primary hover:bg-primary/20"
            >
                {citation.index}
            </button>)}

            />
            <PopoverContent className="w-80">
                <SourceDetails citation={citation} />
            </PopoverContent>
        </Popover>
    );
}