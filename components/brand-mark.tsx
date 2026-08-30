import { BotMessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  inverted?: boolean;
  compact?: boolean;
}

export function BrandMark({ inverted, compact }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-none",
          compact && "size-9 rounded-lg",
          inverted && "border-white/20 bg-white/10 text-white shadow-none",
        )}
      >
        <BotMessageSquare className={cn("size-6", compact && "size-5")} />
      </div>
      <div className="space-y-0.5">
        <p
          className={cn(
            "text-[11px] font-semibold tracking-[0.22em] text-primary/80 uppercase",
            inverted && "text-white/70",
          )}
        >
          Intelix
        </p>
        <p
          className={cn(
            "text-base font-semibold text-foreground",
            compact && "text-base",
            inverted && "text-white",
          )}
        >
          Agent
        </p>
      </div>
    </div>
  );
}
