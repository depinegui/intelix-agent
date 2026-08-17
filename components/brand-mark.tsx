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
          "flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-primary/18 text-primary shadow-[0_18px_36px_rgba(8,178,198,0.18)]",
          compact && "size-10 rounded-xl",
          inverted && "border-white/20 bg-white/10 text-white shadow-none",
        )}
      >
        <BotMessageSquare className={cn("size-6", compact && "size-5")} />
      </div>
      <div className="space-y-0.5">
        <p
          className={cn(
            "text-sm font-semibold tracking-[0.28em] text-primary/80 uppercase",
            inverted && "text-white/70",
          )}
        >
          Intelix
        </p>
        <p
          className={cn(
            "text-lg font-semibold text-foreground",
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
