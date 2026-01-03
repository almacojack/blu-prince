import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./tooltip";
import { useTranslation } from "react-i18next";

interface HintProps {
  children: React.ReactNode;
  text?: string;
  i18nKey?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

export function Hint({ 
  children, 
  text, 
  i18nKey, 
  side = "top", 
  align = "center",
  delayDuration = 200 
}: HintProps) {
  const { t } = useTranslation();
  
  const tooltipText = i18nKey ? t(i18nKey) : text;
  
  if (!tooltipText) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="bg-gray-900 text-white border-purple-500/30 text-xs px-2 py-1"
        >
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
