import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuizStatus = 'active' | 'locked' | 'completed';

interface QuizCardProps {
  title: string;
  description: string;
  status: QuizStatus;
  onClick: () => void;
  className?: string;
}

export const QuizCard = ({ title, description, status, onClick, className }: QuizCardProps) => {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  const statusConfig = {
    locked: {
      icon: <Lock className="h-5 w-5 text-slate-400" />,
      buttonText: "Terkunci",
      badge: null,
      cardClass: "bg-slate-50 border-slate-200/80 shadow-none",
      titleClass: "text-slate-500",
      descriptionClass: "text-slate-400",
    },
    completed: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      buttonText: "Lihat Hasil", // Future functionality
      badge: <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">Selesai</Badge>,
      cardClass: "bg-white",
      titleClass: "text-slate-800",
      descriptionClass: "text-slate-500",
    },
    active: {
      icon: <PlayCircle className="h-5 w-5 text-pink-500" />,
      buttonText: "Mulai Kerjakan",
      badge: null,
      cardClass: "bg-white border-pink-300/80 hover:border-pink-400/90 transition-all",
      titleClass: "text-slate-800",
      descriptionClass: "text-slate-500",
    },
  };

  const currentConfig = statusConfig[status];

  return (
    <Card className={cn("flex flex-col justify-between", currentConfig.cardClass, className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className={cn("text-lg font-semibold", currentConfig.titleClass)}>{title}</CardTitle>
          {currentConfig.icon}
        </div>
        {currentConfig.badge && <div className="pt-2">{currentConfig.badge}</div>}
      </CardHeader>
      <CardContent>
        <CardDescription className={cn(currentConfig.descriptionClass)}>{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onClick}
          disabled={isLocked}
          className="w-full rounded-xl"
          variant={isActive ? "default" : "secondary"}
        >
          {currentConfig.buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};
