import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Settings, Database, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface AutomationSettings {
  id: string;
  auto_mode_enabled: boolean;
  sync_interval_minutes: number;
  sync_period: string;
  max_requests_per_day: number;
}

interface StorageSettings {
  id: string;
  storage_type: string;
  storage_login: string;
  storage_password: string;
  file_format: string;
  storage_path: string;
  is_active: boolean;
}

const SettingsPage = () => {
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings | null>(null);
  const [storageSettings, setStorageSettings] = useState<StorageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [automationResult, storageResult] = await Promise.all([
        supabase.from('automation_settings').select('*').single(),
        supabase.from('storage_settings').select('*').single()
      ]);

      if (automationResult.data) {
        setAutomationSettings(automationResult.data);
      }

      if (storageResult.data) {
        setStorageSettings(storageResult.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить настройки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAutomationSettings = async () => {
    if (!automationSettings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('automation_settings')
        .update({
          auto_mode_enabled: automationSettings.auto_mode_enabled,
          sync_interval_minutes: automationSettings.sync_interval_minutes,
          sync_period: automationSettings.sync_period,
          max_requests_per_day: automationSettings.max_requests_per_day
        })
        .eq('id', automationSettings.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Настройки автоматизации сохранены",
      });
    } catch (error) {
      console.error('Error saving automation settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки автоматизации",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveStorageSettings = async () => {
    if (!storageSettings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('storage_settings')
        .update({
          storage_type: storageSettings.storage_type,
          storage_login: storageSettings.storage_login,
          storage_password: storageSettings.storage_password,
          file_format: storageSettings.file_format,
          storage_path: storageSettings.storage_path,
          is_active: storageSettings.is_active
        })
        .eq('id', storageSettings.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Настройки файлохранилища сохранены",
      });
    } catch (error) {
      console.error('Error saving storage settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки файлохранилища",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка...</div>
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
        <h1 className="text-3xl font-bold">Параметры системы</h1>
      </div>

      <Tabs defaultValue="automation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="automation">
            <Settings className="w-4 h-4 mr-2" />
            Автоматизация
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Database className="w-4 h-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="storage">
            <FileText className="w-4 h-4 mr-2" />
            Файлохранилище
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Пользователи
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Настройки автоматизации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {automationSettings && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_mode"
                      checked={automationSettings.auto_mode_enabled}
                      onCheckedChange={(checked) => 
                        setAutomationSettings(prev => prev ? {...prev, auto_mode_enabled: checked} : null)
                      }
                    />
                    <Label htmlFor="auto_mode">Включить автоматический режим</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interval">Интервал синхронизации (минуты)</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        value={automationSettings.sync_interval_minutes}
                        onChange={(e) => 
                          setAutomationSettings(prev => 
                            prev ? {...prev, sync_interval_minutes: parseInt(e.target.value) || 60} : null
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="period">Период работы</Label>
                      <Select
                        value={automationSettings.sync_period}
                        onValueChange={(value) => 
                          setAutomationSettings(prev => prev ? {...prev, sync_period: value} : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="always">Круглосуточно</SelectItem>
                          <SelectItem value="business_hours">Рабочие часы</SelectItem>
                          <SelectItem value="custom">Настраиваемый</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_requests">Максимум запросов в день</Label>
                    <Input
                      id="max_requests"
                      type="number"
                      min="1"
                      value={automationSettings.max_requests_per_day}
                      onChange={(e) => 
                        setAutomationSettings(prev => 
                          prev ? {...prev, max_requests_per_day: parseInt(e.target.value) || 1000} : null
                        )
                      }
                    />
                  </div>

                  <Button onClick={saveAutomationSettings} disabled={saving}>
                    {saving ? "Сохранение..." : "Сохранить настройки автоматизации"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Поставщики</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/suppliers")}>
                  Управление поставщиками
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Маркетплейсы</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/marketplaces")}>
                  Управление маркетплейсами
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Настройки файлохранилища</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {storageSettings && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storage_type">Тип хранилища</Label>
                      <Select
                        value={storageSettings.storage_type}
                        onValueChange={(value) => 
                          setStorageSettings(prev => prev ? {...prev, storage_type: value} : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Локальное</SelectItem>
                          <SelectItem value="google_drive">Google Drive</SelectItem>
                          <SelectItem value="yandex_disk">Яндекс.Диск</SelectItem>
                          <SelectItem value="dropbox">Dropbox</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file_format">Формат файла</Label>
                      <Select
                        value={storageSettings.file_format}
                        onValueChange={(value) => 
                          setStorageSettings(prev => prev ? {...prev, file_format: value} : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {storageSettings.storage_type !== 'local' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="storage_login">Логин</Label>
                        <Input
                          id="storage_login"
                          value={storageSettings.storage_login || ""}
                          onChange={(e) => 
                            setStorageSettings(prev => prev ? {...prev, storage_login: e.target.value} : null)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storage_password">Пароль</Label>
                        <Input
                          id="storage_password"
                          type="password"
                          value={storageSettings.storage_password || ""}
                          onChange={(e) => 
                            setStorageSettings(prev => prev ? {...prev, storage_password: e.target.value} : null)
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="storage_path">Путь сохранения</Label>
                    <Input
                      id="storage_path"
                      value={storageSettings.storage_path || ""}
                      onChange={(e) => 
                        setStorageSettings(prev => prev ? {...prev, storage_path: e.target.value} : null)
                      }
                      placeholder="/path/to/price-lists"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="storage_active"
                      checked={storageSettings.is_active}
                      onCheckedChange={(checked) => 
                        setStorageSettings(prev => prev ? {...prev, is_active: checked} : null)
                      }
                    />
                    <Label htmlFor="storage_active">Активно</Label>
                  </div>

                  <Button onClick={saveStorageSettings} disabled={saving}>
                    {saving ? "Сохранение..." : "Сохранить настройки файлохранилища"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Управление пользователями и ролями</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Управление пользователями доступно в отдельном разделе</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;