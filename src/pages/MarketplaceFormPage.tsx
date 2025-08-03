import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarketplaceForm {
  name: string;
  website: string;
  api_key: string;
  api_endpoint: string;
  login: string;
  password: string;
  pricing_action: string;
  pricing_value: number;
  is_active: boolean;
}

const MarketplaceFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<MarketplaceForm>({
    name: "",
    website: "",
    api_key: "",
    api_endpoint: "",
    login: "",
    password: "",
    pricing_action: "multiply",
    pricing_value: 1.0,
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      fetchMarketplace();
    }
  }, [id]);

  const fetchMarketplace = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplaces')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setForm({
          name: data.name || "",
          website: data.website || "",
          api_key: data.api_key || "",
          api_endpoint: data.api_endpoint || "",
          login: data.login || "",
          password: data.password || "",
          pricing_action: data.pricing_action || "multiply",
          pricing_value: data.pricing_value || 1.0,
          is_active: data.is_active,
        });
      }
    } catch (error) {
      console.error('Error fetching marketplace:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные маркетплейса",
        variant: "destructive",
      });
      navigate("/marketplaces");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (id) {
        const { error } = await supabase
          .from('marketplaces')
          .update(form)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Маркетплейс обновлен",
        });
      } else {
        const { error } = await supabase
          .from('marketplaces')
          .insert([form]);

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Маркетплейс создан",
        });
      }

      navigate("/marketplaces");
    } catch (error) {
      console.error('Error saving marketplace:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить маркетплейс",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field: keyof MarketplaceForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/marketplaces")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{id ? "Редактировать маркетплейс" : "Новый маркетплейс"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название маркетплейса *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Сайт маркетплейса</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => updateForm("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API настройки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api_endpoint">API Endpoint</Label>
                  <Input
                    id="api_endpoint"
                    value={form.api_endpoint}
                    onChange={(e) => updateForm("api_endpoint", e.target.value)}
                    placeholder="https://api.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_key">Ключ API</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={form.api_key}
                    onChange={(e) => updateForm("api_key", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="login">Логин (при необходимости)</Label>
                    <Input
                      id="login"
                      value={form.login}
                      onChange={(e) => updateForm("login", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль (при необходимости)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ценообразование</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Действие с ценой</Label>
                    <Select
                      value={form.pricing_action}
                      onValueChange={(value) => updateForm("pricing_action", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiply">Умножить на</SelectItem>
                        <SelectItem value="add">Прибавить</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricing_value">Значение</Label>
                    <Input
                      id="pricing_value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.pricing_value}
                      onChange={(e) => updateForm("pricing_value", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => updateForm("is_active", checked)}
              />
              <Label htmlFor="is_active">Активен</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/marketplaces")}>
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketplaceFormPage;