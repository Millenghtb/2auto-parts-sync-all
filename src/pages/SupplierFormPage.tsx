import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save } from "lucide-react";

interface SupplierForm {
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  api_endpoint: string;
  api_key: string;
  is_active: boolean;
}

const SupplierFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<SupplierForm>({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    api_endpoint: '',
    api_key: '',
    is_active: true,
  });

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      fetchSupplier();
    }
  }, [id, isEditing]);

  const fetchSupplier = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers' as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: "Ошибка",
          description: "Поставщик не найден",
          variant: "destructive",
        });
        navigate('/suppliers');
        return;
      }

      const supplier = data as any;
      setForm({
        name: supplier.name || '',
        contact_email: supplier.contact_email || '',
        contact_phone: supplier.contact_phone || '',
        address: supplier.address || '',
        api_endpoint: supplier.api_endpoint || '',
        api_key: supplier.api_key || '',
        is_active: supplier.is_active ?? true,
      });
    } catch (error) {
      console.error('Error fetching supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('suppliers' as any)
          .update(form)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Поставщик обновлен",
        });
      } else {
        const { error } = await supabase
          .from('suppliers' as any)
          .insert([form]);

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Поставщик создан",
        });
      }

      navigate('/suppliers');
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: "Ошибка",
        description: `Не удалось ${isEditing ? 'обновить' : 'создать'} поставщика`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field: keyof SupplierForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/suppliers')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Редактировать поставщика' : 'Новый поставщик'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Обновите информацию о поставщике' : 'Добавьте нового поставщика в систему'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Базовые данные поставщика
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="contact_email">Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => updateForm('contact_email', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Телефон</Label>
                <Input
                  id="contact_phone"
                  value={form.contact_phone}
                  onChange={(e) => updateForm('contact_phone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="address">Адрес</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => updateForm('address', e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => updateForm('is_active', checked)}
                />
                <Label htmlFor="is_active">Активен</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API настройки</CardTitle>
              <CardDescription>
                Настройки для интеграции с системой поставщика
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="api_endpoint">API Endpoint</Label>
                <Input
                  id="api_endpoint"
                  type="url"
                  value={form.api_endpoint}
                  onChange={(e) => updateForm('api_endpoint', e.target.value)}
                  placeholder="https://api.supplier.com/v1"
                />
              </div>

              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={form.api_key}
                  onChange={(e) => updateForm('api_key', e.target.value)}
                  placeholder="Введите API ключ"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/suppliers')}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={submitting}>
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SupplierFormPage;