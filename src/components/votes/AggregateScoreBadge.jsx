// src/components/votes/AggregateScoreBadge.jsx
import React from "react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Star } from "lucide-react";

export default function AggregateScoreBadge({ value, count }) {
  const clamped = Math.max(0, Math.min(5, value ?? 0));
  const percent = (clamped / 5) * 100;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger className="cursor-default">
          <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1 rounded-md border border-neutral-700">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-400">
              {clamped.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-400">({count})</span>
          </div>
        </TooltipTrigger>

        <TooltipContent className="bg-neutral-900 border-neutral-700 text-neutral-200 text-xs space-y-2">
          <p>
            Score global basé sur <strong>{count}</strong> vote(s).
          </p>
          <div className="w-40 h-2 bg-neutral-700 rounded">
            <div
              className="h-full bg-yellow-400 rounded"
              style={{ width: `${percent}%` }}
            />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
