import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  api_endpoint?: string;
  api_key?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить поставщиков",
          variant: "destructive",
        });
        return;
      }

      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSupplierStatus = async (supplierId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: !currentStatus })
        .eq('id', supplierId);

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить статус поставщика",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успешно",
        description: `Поставщик ${!currentStatus ? 'активирован' : 'деактивирован'}`,
      });

      fetchSuppliers();
    } catch (error) {
      console.error('Error updating supplier status:', error);
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого поставщика?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить поставщика",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Поставщик удален",
      });

      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Загрузка поставщиков...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Поставщики</h1>
          <p className="text-muted-foreground">
            Управление поставщиками и их настройками
          </p>
        </div>
        <Button onClick={() => navigate('/suppliers/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить поставщика
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список поставщиков</CardTitle>
          <CardDescription>
            Всего поставщиков: {suppliers.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Поставщики не найдены. Добавьте первого поставщика.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/suppliers/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить поставщика
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead>API</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.address && (
                          <div className="text-sm text-muted-foreground">
                            {supplier.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{supplier.contact_email}</div>
                        {supplier.contact_phone && (
                          <div className="text-sm text-muted-foreground">
                            {supplier.contact_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.api_endpoint ? (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span className="text-sm">Настроено</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Не настроено
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? "default" : "secondary"}>
                        {supplier.is_active ? "Активен" : "Неактивен"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSupplierStatus(supplier.id, supplier.is_active)}
                        >
                          {supplier.is_active ? "Деактивировать" : "Активировать"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSupplier(supplier.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuppliersPage;