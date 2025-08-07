import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, CheckCircle, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      const currentStep = initialSteps[i];
      
      // Обновляем статус на "processing"
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: "processing" } : step
      ));

      try {
        if (type === "download") {
          // Реальная загрузка данных от поставщика
          await loadSupplierData(currentStep.id, i);
        } else {
          // Реальная выгрузка данных в маркетплейс
          await uploadToMarketplace(currentStep.id, i);
        }
        
        setSteps(prev => prev.map((step, index) => 
          index === i ? { 
            ...step, 
            status: "completed",
            progress: 100
          } : step
        ));
      } catch (error) {
        setSteps(prev => prev.map((step, index) => 
          index === i ? { 
            ...step, 
            status: "error",
            progress: 100,
            error: error instanceof Error ? error.message : "Произошла ошибка"
          } : step
        ));
      }

      // Обновляем общий прогресс
      setOverallProgress(((i + 1) / initialSteps.length) * 100);
    }

    setIsCompleted(true);
    onComplete?.();
  };

  const loadSupplierData = async (supplierId: string, stepIndex: number) => {
    // Симуляция загрузки данных с постепенным обновлением прогресса
    const sampleProducts = [
      { article: "ART001", name: "Товар 1", price: 1000 },
      { article: "ART002", name: "Товар 2", price: 1500 },
      { article: "ART003", name: "Товар 3", price: 2000 },
      { article: "ART004", name: "Товар 4", price: 2500 },
      { article: "ART005", name: "Товар 5", price: 3000 }
    ];

    for (let j = 0; j < sampleProducts.length; j++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const progress = ((j + 1) / sampleProducts.length) * 100;
      setSteps(prev => prev.map((step, index) => 
        index === stepIndex ? { ...step, progress } : step
      ));
      
      const product = sampleProducts[j];
      
      // Добавляем товар в базу данных
      const { error } = await supabase
        .from('products')
        .insert({
          supplier_id: supplierId,
          supplier_article: product.article,
          name_supplier: product.name,
          current_price: product.price,
          pricing_action: 'multiply',
          pricing_value: 1.0
        });
        
      if (error) {
        throw new Error(`Ошибка добавления товара ${product.name}: ${error.message}`);
      }
    }
  };

  const uploadToMarketplace = async (marketplaceId: string, stepIndex: number) => {
    // Симуляция выгрузки данных с постепенным обновлением прогресса
    for (let j = 0; j <= 100; j += 20) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSteps(prev => prev.map((step, index) => 
        index === stepIndex ? { ...step, progress: j } : step
      ));
    }
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