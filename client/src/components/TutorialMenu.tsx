import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTutorial } from "@/contexts/TutorialContext";
import { TUTORIALS, TutorialId } from "@/lib/tutorial-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap,
  Rocket,
  GitBranch,
  Flame,
  Gamepad2,
  Box,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, typeof Rocket> = {
  Rocket,
  GitBranch,
  Flame,
  Gamepad2,
  Box,
};

interface TutorialMenuProps {
  trigger?: React.ReactNode;
}

export function TutorialMenu({ trigger }: TutorialMenuProps) {
  const { startTutorial, getTutorialProgress, resetProgress } = useTutorial();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpenMenu = () => setOpen(true);
    window.addEventListener("open-tutorial-menu", handleOpenMenu);
    return () => window.removeEventListener("open-tutorial-menu", handleOpenMenu);
  }, []);

  const handleStartTutorial = (id: TutorialId) => {
    setOpen(false);
    setTimeout(() => startTutorial(id), 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            className="h-11 gap-2 touch-manipulation"
            data-testid="button-open-tutorials"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Tutorials</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Interactive Tutorials
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-4">
            {TUTORIALS.map((tutorial) => {
              const progress = getTutorialProgress(tutorial.id);
              const Icon = ICON_MAP[tutorial.icon] || Rocket;
              const isCompleted = progress?.completed;
              const isInProgress = progress && !progress.completed;

              return (
                <motion.div
                  key={tutorial.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: TUTORIALS.indexOf(tutorial) * 0.05 }}
                >
                  <Card 
                    className={cn(
                      "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer group",
                      isCompleted && "border-green-500/30 bg-green-500/5"
                    )}
                    onClick={() => handleStartTutorial(tutorial.id)}
                    data-testid={`card-tutorial-${tutorial.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isCompleted ? "bg-green-500/20" : "bg-primary/20"
                          )}>
                            <Icon className={cn(
                              "w-5 h-5",
                              isCompleted ? "text-green-400" : "text-primary"
                            )} />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {tutorial.title}
                              {isCompleted && (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {tutorial.description}
                            </CardDescription>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{tutorial.estimatedMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{tutorial.steps.length} steps</span>
                        </div>
                        {isInProgress && (
                          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                            In Progress ({progress.currentStepIndex + 1}/{tutorial.steps.length})
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetProgress}
            className="text-zinc-400 h-9 touch-manipulation"
            data-testid="button-reset-progress"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset Progress
          </Button>
          <Button
            size="sm"
            onClick={() => handleStartTutorial("getting_started")}
            className="h-9 touch-manipulation"
            data-testid="button-start-first-tutorial"
          >
            <Play className="w-4 h-4 mr-1" />
            Start First Tutorial
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
