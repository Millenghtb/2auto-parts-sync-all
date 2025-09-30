import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Settings, RefreshCw, Download, Upload, TestTube, ArrowLeft, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingProgress } from "@/components/LoadingProgress";
import { PriceUpdateModal } from "@/components/PriceUpdateModal";
import { KaspiPriceListDialog } from "@/components/KaspiPriceListDialog";

interface Supplier {
  id: string;
  name: string;
  is_active: boolean;
}

interface Marketplace {
  id: string;
  name: string;
  is_active: boolean;
}

interface AutomationSettings {
  auto_mode_enabled: boolean;
  sync_interval_minutes: number;
}

const ControlPanel = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    auto_mode_enabled: false,
    sync_interval_minutes: 60
  });
  const [loading, setLoading] = useState(true);
  const [showProgress, setShowProgress] = useState(false);
  const [progressType, setProgressType] = useState<"download" | "upload">("download");
  const [showPriceUpdateModal, setShowPriceUpdateModal] = useState(false);
  const [showKaspiPriceList, setShowKaspiPriceList] = useState(false);
  const [selectedKaspiMarketplace, setSelectedKaspiMarketplace] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [suppliersResult, marketplacesResult, settingsResult] = await Promise.all([
        supabase.from('suppliers').select('id, name, is_active').eq('is_active', true),
        supabase.from('marketplaces').select('id, name, is_active').eq('is_active', true),
        supabase.from('automation_settings').select('*').single()
      ]);

      if (suppliersResult.error) throw suppliersResult.error;
      if (marketplacesResult.error) throw marketplacesResult.error;

      setSuppliers(suppliersResult.data || []);
      setMarketplaces(marketplacesResult.data || []);
      
      if (settingsResult.data) {
        setAutomationSettings({
          auto_mode_enabled: settingsResult.data.auto_mode_enabled,
          sync_interval_minutes: settingsResult.data.sync_interval_minutes
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierSelect = (supplierId: string, checked: boolean) => {
    setSelectedSuppliers(prev => 
      checked 
        ? [...prev, supplierId]
        : prev.filter(id => id !== supplierId)
    );
  };

  const handleMarketplaceSelect = (marketplaceId: string, checked: boolean) => {
    setSelectedMarketplaces(prev => 
      checked 
        ? [...prev, marketplaceId]
        : prev.filter(id => id !== marketplaceId)
    );
  };

  const handleLoadPrices = () => {
    if (selectedSuppliers.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Выберите хотя бы одного поставщика",
        variant: "destructive",
      });
      return;
    }

    setProgressType("download");
    setShowProgress(true);
  };

  const handleUploadPrices = () => {
    if (selectedSuppliers.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Выберите поставщиков для выгрузки цен",
        variant: "destructive",
      });
      return;
    }
    setProgressType("upload");
    setShowPriceUpdateModal(true);
  };

  const handleStartUpload = (selectedMarketplaceIds: string[]) => {
    setSelectedMarketplaces(selectedMarketplaceIds);
    setProgressType("upload");
    setShowProgress(true);
  };

  const handleLoadKaspiPriceList = async () => {
    if (selectedMarketplaces.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Выберите маркетплейс для загрузки прайс-листа",
        variant: "destructive",
      });
      return;
    }
    
    // Проверяем, что у выбранного маркетплейса настроен API ключ
    const marketplaceId = selectedMarketplaces[0];
    const { data: marketplace, error } = await supabase
      .from('marketplaces')
      .select('api_key, name')
      .eq('id', marketplaceId)
      .single();

    if (error || !marketplace) {
      toast({
        title: "Ошибка",
        description: "Не удалось проверить настройки маркетплейса",
        variant: "destructive",
      });
      return;
    }

    if (!marketplace.api_key) {
      toast({
        title: "API не настроен",
        description: `Для маркетплейса "${marketplace.name}" не настроен API ключ. Добавьте его в настройках.`,
        variant: "destructive",
      });
      return;
    }

    // Используем выбранный маркетплейс с настроенным API
    setSelectedKaspiMarketplace(marketplaceId);
    setShowKaspiPriceList(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  if (showProgress) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к дашборду
          </Button>
        </div>
        <LoadingProgress
          type={progressType}
          suppliers={progressType === "download" ? suppliers.filter(s => selectedSuppliers.includes(s.id)) : []}
          marketplaces={progressType === "upload" ? marketplaces.filter(m => selectedMarketplaces.includes(m.id)) : []}
          onCancel={() => setShowProgress(false)}
          onComplete={() => {
            setShowProgress(false);
            toast({
              title: "Операция завершена",
              description: `${progressType === "download" ? "Загрузка" : "Выгрузка"} цен прошла успешно`,
            });
            
            // Если это загрузка цен и не включен автоматический режим, открываем модальное окно
            if (progressType === "download" && !automationSettings.auto_mode_enabled) {
              setShowPriceUpdateModal(true);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold">Панель управления</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/sandbox")}>
            <TestTube className="w-4 h-4 mr-2" />
            Песочница
          </Button>
          <Button variant="outline" onClick={() => navigate("/settings")}>
            <Settings className="w-4 h-4 mr-2" />
            Параметры
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Поставщики */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Поставщики
              <Badge variant={automationSettings.auto_mode_enabled ? "default" : "secondary"}>
                {automationSettings.auto_mode_enabled ? "Авто" : "Ручной"} режим
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suppliers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">Нет активных поставщиков</p>
                <Button variant="outline" onClick={() => navigate("/suppliers/new")}>
                  Добавить поставщика
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={supplier.id}
                        checked={selectedSuppliers.includes(supplier.id)}
                        onCheckedChange={(checked) => 
                          handleSupplierSelect(supplier.id, checked as boolean)
                        }
                      />
                      <label htmlFor={supplier.id} className="flex-1 cursor-pointer">
                        {supplier.name}
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/suppliers/${supplier.id}/customize`)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button onClick={handleLoadPrices} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Загрузить цены от выбранных поставщиков
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Маркетплейсы */}
        <Card>
          <CardHeader>
            <CardTitle>Маркетплейсы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketplaces.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">Нет активных маркетплейсов</p>
                <Button variant="outline" onClick={() => navigate("/marketplaces/new")}>
                  Добавить маркетплейс
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {marketplaces.map((marketplace) => (
                    <div key={marketplace.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={marketplace.id}
                        checked={selectedMarketplaces.includes(marketplace.id)}
                        onCheckedChange={(checked) => 
                          handleMarketplaceSelect(marketplace.id, checked as boolean)
                        }
                      />
                      <label htmlFor={marketplace.id} className="flex-1 cursor-pointer">
                        {marketplace.name}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Button onClick={handleUploadPrices} className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Выгрузить цены в выбранные маркетплейсы
                  </Button>
                  <Button onClick={handleLoadKaspiPriceList} variant="outline" className="w-full">
                    <FileDown className="w-4 h-4 mr-2" />
                    Загрузить прайс-лист из Kaspi
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Быстрые действия */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={() => navigate("/suppliers/new")}>
              Добавить поставщика
            </Button>
            <Button variant="outline" onClick={() => navigate("/marketplaces/new")}>
              Добавить маркетплейс
            </Button>
            <Button variant="outline" onClick={() => navigate("/price-updates")}>
              <RefreshCw className="w-4 h-4 mr-2" />
              История обновлений
            </Button>
          </div>
        </CardContent>
      </Card>

      <PriceUpdateModal
        isOpen={showPriceUpdateModal}
        onClose={() => setShowPriceUpdateModal(false)}
        supplierIds={selectedSuppliers}
        marketplaces={marketplaces}
        mode={progressType === "upload" ? "upload" : "download"}
        onUpload={handleStartUpload}
      />

      <KaspiPriceListDialog
        isOpen={showKaspiPriceList}
        onClose={() => setShowKaspiPriceList(false)}
        marketplaceId={selectedKaspiMarketplace}
      />
    </div>
  );
};

export default ControlPanel;