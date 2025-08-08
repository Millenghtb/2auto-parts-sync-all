import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name_supplier: string;
  name_marketplace: string | null;
  supplier_article: string;
  marketplace_article: string | null;
  current_price: number | null;
  new_price: number | null;
  price_status: string | null;
  pricing_action: string | null;
  pricing_value: number | null;
  display_name?: string;
}

interface Marketplace {
  id: string;
  name: string;
}

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierIds: string[];
  marketplaces?: Marketplace[];
  mode?: 'download' | 'upload';
  onUpload?: (selectedMarketplaces: string[]) => void;
}

export const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({
  isOpen,
  onClose,
  supplierIds,
  marketplaces = [],
  mode = 'download',
  onUpload,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [globalPricingAction, setGlobalPricingAction] = useState<string>('multiply');
  const [globalPricingValue, setGlobalPricingValue] = useState<number>(1.0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && supplierIds.length > 0) {
      fetchProducts();
    }
  }, [isOpen, supplierIds]);

  const handleMarketplaceSelect = (marketplaceId: string, checked: boolean) => {
    const newSelected = new Set(selectedMarketplaces);
    if (checked) {
      newSelected.add(marketplaceId);
    } else {
      newSelected.delete(marketplaceId);
    }
    setSelectedMarketplaces(newSelected);
  };

  const handleMarketplaceSelectAll = () => {
    setSelectedMarketplaces(new Set(marketplaces.map(m => m.id)));
  };

  const handleMarketplaceDeselectAll = () => {
    setSelectedMarketplaces(new Set());
  };

  const handleUpload = () => {
    if (selectedMarketplaces.size === 0) {
      toast({
        title: 'Предупреждение',
        description: 'Выберите маркетплейсы для выгрузки',
        variant: 'destructive',
      });
      return;
    }

    if (selectedProducts.size === 0) {
      toast({
        title: 'Предупреждение',
        description: 'Выберите товары для выгрузки',
        variant: 'destructive',
      });
      return;
    }

    onUpload?.(Array.from(selectedMarketplaces));
    onClose();
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Сначала загружаем товары поставщиков
      const { data: supplierProducts, error: supplierError } = await supabase
        .from('products')
        .select('*')
        .in('supplier_id', supplierIds)
        .order('price_status', { ascending: false });

      if (supplierError) throw supplierError;

      if (!supplierProducts || supplierProducts.length === 0) {
        setProducts([]);
        return;
      }

      // Получаем уникальные артикулы поставщиков для поиска соответствий
      const supplierArticles = [...new Set(supplierProducts.map(p => p.supplier_article))];

      // Загружаем все товары с маркетплейсов, которые имеют соответствующие артикулы
      const { data: marketplaceProducts, error: marketplaceError } = await supabase
        .from('products')
        .select('*')
        .in('marketplace_article', supplierArticles)
        .not('marketplace_id', 'is', null);

      if (marketplaceError) {
        console.warn('Error fetching marketplace products:', marketplaceError);
      }

      // Создаем карту соответствий артикул поставщика -> данные с маркетплейса
      const articleMapping = new Map();
      if (marketplaceProducts) {
        marketplaceProducts.forEach(mp => {
          if (mp.marketplace_article) {
            articleMapping.set(mp.marketplace_article, mp);
          }
        });
      }

      // Обогащаем данные поставщиков названиями с маркетплейсов
      const enrichedProducts = supplierProducts.map(supplierProduct => {
        const matchedMarketplaceProduct = articleMapping.get(supplierProduct.supplier_article);
        
        return {
          ...supplierProduct,
          name_marketplace: matchedMarketplaceProduct?.name_marketplace || null,
          marketplace_article: matchedMarketplaceProduct?.marketplace_article || null,
          // Если есть соответствие, используем название с маркетплейса, иначе название поставщика
          display_name: matchedMarketplaceProduct?.name_marketplace || supplierProduct.name_supplier
        };
      });

      // Сортировка: сначала товары с изменениями цен
      const sortedProducts = enrichedProducts.sort((a, b) => {
        const statusOrder = { 'increased': 0, 'decreased': 1, 'unchanged': 2, 'missing': 3 };
        const aOrder = statusOrder[a.price_status as keyof typeof statusOrder] ?? 4;
        const bOrder = statusOrder[b.price_status as keyof typeof statusOrder] ?? 4;
        return aOrder - bOrder;
      });

      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список товаров',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedProducts(new Set(products.map(p => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedProducts(new Set());
  };

  const handleProductSelect = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const calculateNewPrice = (currentPrice: number | null, action: string, value: number): number | null => {
    if (!currentPrice) return null;
    
    switch (action) {
      case 'multiply':
        return currentPrice * value;
      case 'add':
        return currentPrice + value;
      default:
        return currentPrice;
    }
  };

  const applyGlobalPricing = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: 'Предупреждение',
        description: 'Выберите товары для применения цен',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const updates = Array.from(selectedProducts).map(productId => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;

        const newPrice = calculateNewPrice(product.current_price, globalPricingAction, globalPricingValue);
        
        return {
          id: productId,
          new_price: newPrice,
          pricing_action: globalPricingAction,
          pricing_value: globalPricingValue,
          price_status: newPrice && product.current_price 
            ? (newPrice > product.current_price ? 'increased' : 
               newPrice < product.current_price ? 'decreased' : 'unchanged')
            : 'unchanged'
        };
      }).filter(Boolean);

      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: 'Успешно',
        description: `Цены применены для ${selectedProducts.size} товаров`,
      });

      // Обновляем данные
      await fetchProducts();
      setSelectedProducts(new Set());
      
    } catch (error) {
      console.error('Error updating prices:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось применить цены',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriceStatusBadge = (status: string | null) => {
    switch (status) {
      case 'increased':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Увеличение</Badge>;
      case 'decreased':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Снижение</Badge>;
      case 'missing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Отсутствует</Badge>;
      default:
        return <Badge variant="secondary">Без изменений</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === 'download' ? 'Обновление цен' : 'Выгрузка товаров'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'upload' && marketplaces.length > 0 && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Выберите маркетплейсы для выгрузки:</h3>
              <div className="flex gap-2">
                <Button onClick={handleMarketplaceSelectAll} variant="outline" size="sm">
                  Выбрать все
                </Button>
                <Button onClick={handleMarketplaceDeselectAll} variant="outline" size="sm">
                  Снять все
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {marketplaces.map((marketplace) => (
                <div key={marketplace.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={marketplace.id}
                    checked={selectedMarketplaces.has(marketplace.id)}
                    onCheckedChange={(checked) => 
                      handleMarketplaceSelect(marketplace.id, checked as boolean)
                    }
                  />
                  <label htmlFor={marketplace.id} className="text-sm cursor-pointer">
                    {marketplace.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 items-center p-4 bg-muted rounded-lg">
          <div className="flex gap-2">
            <Button onClick={handleSelectAll} variant="outline" size="sm">
              Выделить все
            </Button>
            <Button onClick={handleDeselectAll} variant="outline" size="sm">
              Снять выделение
            </Button>
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">Действие:</span>
            <Select value={globalPricingAction} onValueChange={setGlobalPricingAction}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiply">Умножить</SelectItem>
                <SelectItem value="add">Прибавить</SelectItem>
              </SelectContent>
            </Select>
            
            <span className="text-sm">на</span>
            <Input
              type="number"
              step="0.01"
              value={globalPricingValue}
              onChange={(e) => setGlobalPricingValue(parseFloat(e.target.value) || 0)}
              className="w-24"
            />
            
            <Button onClick={applyGlobalPricing} disabled={loading}>
              Применить к выбранным
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">№</TableHead>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.size === products.length && products.length > 0}
                    onCheckedChange={(checked) => checked ? handleSelectAll() : handleDeselectAll()}
                  />
                </TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Артикул маркетплейса</TableHead>
                <TableHead>Артикул поставщика</TableHead>
                <TableHead>Старая цена</TableHead>
                <TableHead>Новая цена</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Товары не найдены
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={(checked) => 
                          handleProductSelect(product.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={product.display_name || product.name_supplier}>
                      {product.display_name || product.name_supplier}
                    </TableCell>
                    <TableCell>{product.marketplace_article || '-'}</TableCell>
                    <TableCell>{product.supplier_article}</TableCell>
                    <TableCell>
                      {product.current_price ? `${product.current_price.toFixed(2)} ₽` : '-'}
                    </TableCell>
                    <TableCell>
                      {product.new_price ? `${product.new_price.toFixed(2)} ₽` : '-'}
                    </TableCell>
                    <TableCell>
                      {getPriceStatusBadge(product.price_status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Выбрано товаров: {selectedProducts.size} из {products.length}
            {mode === 'upload' && ` | Выбрано маркетплейсов: ${selectedMarketplaces.size} из ${marketplaces.length}`}
          </div>
          <div className="flex gap-2">
            {mode === 'upload' && (
              <Button onClick={handleUpload} disabled={loading}>
                Выгрузить в маркетплейсы
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};