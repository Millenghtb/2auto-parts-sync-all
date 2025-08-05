import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, CheckCircle, AlertCircle, X } from "lucide-react";

interface LoadingProgressProps {
  type: "download" | "upload";
  suppliers?: string[];
  marketplaces?: string[];
  onCancel?: () => void;
  onComplete?: () => void;
}

interface ProcessStep {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
}

export const LoadingProgress = ({ 
  type, 
  suppliers = [], 
  marketplaces = [], 
  onCancel, 
  onComplete 
}: LoadingProgressProps) => {
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const initialSteps: ProcessStep[] = [];
    
    if (type === "download") {
      suppliers.forEach(supplier => {
        initialSteps.push({
          id: supplier,
          name: `Загрузка цен от поставщика ${supplier}`,
          status: "pending",
          progress: 0
        });
      });
    } else {
      marketplaces.forEach(marketplace => {
        initialSteps.push({
          id: marketplace,
          name: `Выгрузка цен в маркетплейс ${marketplace}`,
          status: "pending",
          progress: 0
        });
      });
    }

    setSteps(initialSteps);
    startProcess(initialSteps);
  }, [type, suppliers, marketplaces]);

  const startProcess = async (initialSteps: ProcessStep[]) => {
    for (let i = 0; i < initialSteps.length; i++) {
      // Обновляем статус на "processing"
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: "processing" } : step
      ));

      // Симуляция прогресса
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, progress } : step
        ));
      }

      // Случайная симуляция ошибки (10% вероятность)
      const hasError = Math.random() < 0.1;
      
      setSteps(prev => prev.map((step, index) => 
        index === i ? { 
          ...step, 
          status: hasError ? "error" : "completed",
          progress: 100,
          error: hasError ? "Ошибка соединения с API" : undefined
        } : step
      ));

      // Обновляем общий прогресс
      setOverallProgress(((i + 1) / initialSteps.length) * 100);
    }

    setIsCompleted(true);
    onComplete?.();
  };

  const getStatusIcon = (status: ProcessStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "processing":
        return <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusBadge = (status: ProcessStep["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Завершено</Badge>;
      case "error":
        return <Badge variant="destructive">Ошибка</Badge>;
      case "processing":
        return <Badge variant="secondary">Обработка...</Badge>;
      default:
        return <Badge variant="outline">Ожидание</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {type === "download" ? (
              <>
                <Download className="w-5 h-5" />
                Загрузка цен от поставщиков
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Выгрузка цен в маркетплейсы
              </>
            )}
          </CardTitle>
          {!isCompleted && onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Общий прогресс */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Общий прогресс</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Детальный прогресс по шагам */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(step.status)}
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
                {getStatusBadge(step.status)}
              </div>
              
              {step.status === "processing" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Прогресс</span>
                    <span>{step.progress}%</span>
                  </div>
                  <Progress value={step.progress} className="h-1" />
                </div>
              )}
              
              {step.error && (
                <div className="text-xs text-red-500 pl-6">
                  {step.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Кнопка завершения */}
        {isCompleted && (
          <div className="flex justify-center pt-4">
            <Button onClick={onComplete}>
              Готово
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};