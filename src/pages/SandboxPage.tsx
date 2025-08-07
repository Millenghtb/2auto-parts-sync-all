import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TestTube, Play, AlertTriangle, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingProgress } from "@/components/LoadingProgress";

const SandboxPage = () => {
  const [testing, setTesting] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [testType, setTestType] = useState<"download" | "upload">("download");
  const [testRequests, setTestRequests] = useState({ used: 0, max: 100 });
  const navigate = useNavigate();
  const { toast } = useToast();

  const runTest = async (type: "download" | "upload") => {
    if (testRequests.used >= testRequests.max) {
      toast({
        title: "Лимит исчерпан",
        description: "Достигнут лимит тестовых запросов",
        variant: "destructive",
      });
      return;
    }

    setTestType(type);
    setShowProgress(true);
    setTesting(true);

    // Увеличиваем счетчик использованных запросов
    setTestRequests(prev => ({ ...prev, used: prev.used + 1 }));
  };

  const resetTestCounter = () => {
    setTestRequests(prev => ({ ...prev, used: 0 }));
    toast({
      title: "Успешно",
      description: "Счетчик тестовых запросов сброшен",
    });
  };


  if (showProgress) {
    return (
      <div className="container mx-auto p-6">
        <LoadingProgress
          type={testType}
          suppliers={testType === "download" ? [{ id: "test-supplier", name: "Test Supplier" }] : []}
          marketplaces={testType === "upload" ? [{ id: "test-marketplace", name: "Test Marketplace" }] : []}
          onCancel={() => {
            setShowProgress(false);
            setTesting(false);
          }}
          onComplete={() => {
            setShowProgress(false);
            setTesting(false);
            toast({
              title: "Тест завершен",
              description: "Тестирование API прошло успешно",
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/control-panel")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <div className="flex items-center gap-2">
          <TestTube className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Песочница разработчика</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Информация о песочнице */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Тестовый режим
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Песочница позволяет тестировать API без изменения реальных данных
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Использовано запросов</span>
                <Badge variant="outline">
                  {testRequests.used} / {testRequests.max}
                </Badge>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={resetTestCounter} className="w-full">
              Сбросить счетчик
            </Button>
          </CardContent>
        </Card>

        {/* Тестирование API */}
        <Card>
          <CardHeader>
            <CardTitle>Тестирование API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                В тестовом режиме реальные данные не изменяются
              </span>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => runTest("download")}
                disabled={testing || testRequests.used >= testRequests.max}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Тест загрузки цен
              </Button>

              <Button 
                onClick={() => runTest("upload")}
                disabled={testing || testRequests.used >= testRequests.max}
                className="w-full"
                variant="outline"
              >
                <Play className="w-4 h-4 mr-2" />
                Тест выгрузки цен
              </Button>
            </div>

            {testRequests.used >= testRequests.max && (
              <div className="text-sm text-red-600 text-center">
                Лимит тестовых запросов исчерпан
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default SandboxPage;