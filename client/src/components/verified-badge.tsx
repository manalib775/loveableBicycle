import { CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className = "" }: VerifiedBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCircle
            className={`inline-block w-4 h-4 text-primary ml-1 ${className}`}
            aria-label="Verified user"
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified User</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
