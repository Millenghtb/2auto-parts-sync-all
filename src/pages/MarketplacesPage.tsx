import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Marketplace {
  id: string;
  name: string;
  website: string;
  pricing_action: string;
  pricing_value: number;
  is_active: boolean;
  created_at: string;
}

const MarketplacesPage = () => {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchMarketplaces();
  }, []);

  const fetchMarketplaces = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setMarketplaces(data || []);
    } catch (error) {
      console.error('Error fetching marketplaces:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить маркетплейсы",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMarketplaceStatus = async (marketplaceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('marketplaces')
        .update({ is_active: !currentStatus })
        .eq('id', marketplaceId);

      if (error) {
        throw error;
      }

      toast({
        title: "Успешно",
        description: `Маркетплейс ${!currentStatus ? 'активирован' : 'деактивирован'}`,
      });

      fetchMarketplaces();
    } catch (error) {
      console.error('Error updating marketplace status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус маркетплейса",
        variant: "destructive",
      });
    }
  };

  const deleteMarketplace = async (marketplaceId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот маркетплейс?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('marketplaces')
        .delete()
        .eq('id', marketplaceId);

      if (error) {
        throw error;
      }

      toast({
        title: "Успешно",
        description: "Маркетплейс удален",
      });

      fetchMarketplaces();
    } catch (error) {
      console.error('Error deleting marketplace:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить маркетплейс",
        variant: "destructive",
      });
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold">Маркетплейсы</h1>
        </div>
        <Button onClick={() => navigate("/marketplaces/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить маркетплейс
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список маркетплейсов</CardTitle>
        </CardHeader>
        <CardContent>
          {marketplaces.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Маркетплейсы не найдены</p>
              <Button onClick={() => navigate("/marketplaces/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить первый маркетплейс
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Сайт</TableHead>
                  <TableHead>Ценообразование</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketplaces.map((marketplace) => (
                  <TableRow key={marketplace.id}>
                    <TableCell className="font-medium">{marketplace.name}</TableCell>
                    <TableCell>{marketplace.website || "—"}</TableCell>
                    <TableCell>
                      {marketplace.pricing_action === 'multiply' ? 'Умножить' : 'Прибавить'} на {marketplace.pricing_value}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={marketplace.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleMarketplaceStatus(marketplace.id, marketplace.is_active)}
                      >
                        {marketplace.is_active ? "Активен" : "Неактивен"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/marketplaces/${marketplace.id}/edit`)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMarketplace(marketplace.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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

export default MarketplacesPage;