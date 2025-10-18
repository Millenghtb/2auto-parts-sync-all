import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KaspiApiClient } from "@/lib/kaspi-api";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface KaspiProduct {
  id: string;
  name: string;
  kaspiArticle: string;
  supplierArticle: string;
  price: number;
}

interface KaspiPriceListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  marketplaceId: string | null;
}

export function KaspiPriceListDialog({ isOpen, onClose, marketplaceId }: KaspiPriceListDialogProps) {
  const [products, setProducts] = useState<KaspiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && marketplaceId) {
      loadProducts();
    }
  }, [isOpen, marketplaceId]);

  const loadProducts = async () => {
    if (!marketplaceId) return;

    setLoading(true);
    try {
      // Получаем данные маркетплейса с проверкой API
      const { data: marketplace, error: marketplaceError } = await supabase
        .from('marketplaces')
        .select('api_key, api_endpoint, name')
        .eq('id', marketplaceId)
        .single();

      if (marketplaceError || !marketplace) {
        throw new Error('Маркетплейс не найден в системе');
      }

      if (!marketplace.api_key) {
        throw new Error(`API ключ не настроен для маркетплейса "${marketplace.name}". Добавьте API ключ в настройках маркетплейса.`);
      }

      // Проверяем валидность API ключа через попытку инициализации клиента
      const kaspiClient = new KaspiApiClient(
        marketplace.api_key,
        marketplace.api_endpoint || undefined
      );

      // Загружаем товары из базы данных для выбранного маркетплейса
      // API Kaspi не предоставляет метод получения списка всех товаров продавца,
      // поэтому используем локальную базу с товарами, которые были загружены ранее
      const { data: dbProducts, error: dbError } = await supabase
        .from('products')
        .select('id, name_marketplace, marketplace_article, supplier_article, current_price')
        .eq('marketplace_id', marketplaceId);

      if (dbError) throw dbError;

      if (!dbProducts || dbProducts.length === 0) {
        throw new Error(`Товары для маркетплейса "${marketplace.name}" не найдены. Сначала загрузите товары через функцию "Загрузка цен".`);
      }

      const formattedProducts: KaspiProduct[] = dbProducts.map(p => ({
        id: p.id,
        name: p.name_marketplace || 'Не указано',
        kaspiArticle: p.marketplace_article || 'Не указано',
        supplierArticle: p.supplier_article || 'Не указано',
        price: p.current_price || 0,
      }));

      setProducts(formattedProducts);

      toast({
        title: "Успешно",
        description: `Загружено товаров из "${marketplace.name}": ${formattedProducts.length}`,
      });
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить товары",
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (products.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Нет данных для экспорта",
        variant: "destructive",
      });
      return;
    }

    // Подготавливаем данные для Excel
    const worksheetData = [
      ['Наименование товара', 'Артикул Каспи', 'Артикул поставщика', 'Цена (₸)'],
      ...products.map(p => [
        p.name,
        p.kaspiArticle,
        p.supplierArticle,
        p.price
      ])
    ];

    // Создаем рабочую книгу и лист
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Прайс-лист');

    // Настраиваем ширину колонок
    const columnWidths = [
      { wch: 50 }, // Наименование товара
      { wch: 20 }, // Артикул Каспи
      { wch: 25 }, // Артикул поставщика
      { wch: 15 }, // Цена
    ];
    worksheet['!cols'] = columnWidths;

    // Сохраняем файл
    const fileName = `kaspi_pricelist_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Успешно",
      description: "Прайс-лист сохранен в формате Excel",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Прайс-лист товаров Kaspi</DialogTitle>
            <Button onClick={handleExportToExcel} disabled={loading || products.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Сохранить прайс-лист (Excel)
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3">Загрузка товаров...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Товары не найдены. Убедитесь, что товары загружены в базу данных.
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Наименование товара</TableHead>
                  <TableHead className="w-[20%]">Артикул Каспи</TableHead>
                  <TableHead className="w-[20%]">Артикул поставщика</TableHead>
                  <TableHead className="w-[20%] text-right">Цена</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.kaspiArticle}</TableCell>
                    <TableCell>{product.supplierArticle}</TableCell>
                    <TableCell className="text-right">{product.price.toLocaleString('ru-RU')} ₸</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
