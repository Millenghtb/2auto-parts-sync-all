import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Check, 
  X, 
  Package, 
  Truck, 
  FileText, 
  Smartphone,
  AlertTriangle,
  Weight,
  Hash
} from "lucide-react";
import { Order, OrderEntry, OrderStatus, getOrderStatusLabel, getOrderStatusVariant, KaspiApiClient } from "@/lib/kaspi-api";
import { useToast } from "@/hooks/use-toast";

interface KaspiOrderDetailsProps {
  order: Order;
  entries: OrderEntry[];
  onBack: () => void;
  onOrderUpdated: () => void;
  kaspiClient: KaspiApiClient | null;
}

export const KaspiOrderDetails = ({
  order,
  entries,
  onBack,
  onOrderUpdated,
  kaspiClient
}: KaspiOrderDetailsProps) => {
  const [loading, setLoading] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showImeiDialog, setShowImeiDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<OrderEntry | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status as OrderStatus);
  const [imeiValue, setImeiValue] = useState("");
  const [modifyData, setModifyData] = useState({ weight: 0, quantity: 0 });
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
    }).format(price);
  };

  const handleAcceptOrder = async () => {
    if (!kaspiClient) return;
    
    setLoading(true);
    try {
      await kaspiClient.acceptOrder(order.id, order.code);
      toast({
        title: "Заказ принят",
        description: "Заказ успешно принят в работу",
      });
      onOrderUpdated();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось принять заказ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!kaspiClient) return;
    
    setLoading(true);
    try {
      await kaspiClient.updateOrderStatus(order.id, newStatus);
      toast({
        title: "Статус обновлен",
        description: `Статус заказа изменен на "${getOrderStatusLabel(newStatus)}"`,
      });
      setShowStatusDialog(false);
      onOrderUpdated();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить статус",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!kaspiClient) return;
    
    setLoading(true);
    try {
      await kaspiClient.cancelOrder(order.id);
      toast({
        title: "Заказ отменен",
        description: "Заказ успешно отменен",
      });
      onOrderUpdated();
    } catch (error) {
      toast({
        title: "Ошибка", 
        description: error instanceof Error ? error.message : "Не удалось отменить заказ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWaybill = async () => {
    if (!kaspiClient) return;
    
    setLoading(true);
    try {
      await kaspiClient.createWaybill(order.id);
      toast({
        title: "Накладная создана",
        description: "Накладная для доставки успешно сформирована",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать накладную",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetImei = async () => {
    if (!kaspiClient || !imeiValue.trim()) return;
    
    setLoading(true);
    try {
      await kaspiClient.setImei(order.id, imeiValue);
      toast({
        title: "IMEI установлен",
        description: "IMEI успешно привязан к заказу",
      });
      setShowImeiDialog(false);
      setImeiValue("");
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось установить IMEI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModifyEntry = async () => {
    if (!kaspiClient || !selectedEntry) return;
    
    setLoading(true);
    try {
      await kaspiClient.modifyOrderEntry(order.id, selectedEntry.id, modifyData);
      toast({
        title: "Позиция изменена",
        description: "Параметры позиции заказа успешно обновлены",
      });
      setShowModifyDialog(false);
      setSelectedEntry(null);
      onOrderUpdated();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось изменить позицию",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openModifyDialog = (entry: OrderEntry) => {
    setSelectedEntry(entry);
    setModifyData({
      weight: entry.weight || 0,
      quantity: entry.quantity
    });
    setShowModifyDialog(true);
  };

  const hasImeiRequired = entries.some(entry => entry.isImeiRequired);

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой назад */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к списку
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Заказ #{order.code}</h1>
          <p className="text-muted-foreground">ID: {order.id}</p>
        </div>
      </div>

      {/* Информация о заказе */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Информация о заказе</span>
            <Badge variant={getOrderStatusVariant(order.status)} className="text-sm">
              {getOrderStatusLabel(order.status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Номер заказа</Label>
              <p className="font-mono">{order.id}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Код заказа</Label>
              <p className="font-medium">{order.code}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Общая сумма</Label>
              <p className="font-medium">{formatPrice(order.totalPrice || 0)}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Позиций</Label>
              <p className="font-medium">{entries.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Кнопки управления */}
      <Card>
        <CardHeader>
          <CardTitle>Действия с заказом</CardTitle>
          <CardDescription>
            Управление статусом и параметрами заказа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {order.status === OrderStatus.NEW && (
              <Button onClick={handleAcceptOrder} disabled={loading}>
                <Check className="h-4 w-4 mr-2" />
                Принять заказ
              </Button>
            )}
            
            <Button variant="outline" onClick={() => setShowStatusDialog(true)} disabled={loading}>
              <Package className="h-4 w-4 mr-2" />
              Изменить статус
            </Button>
            
            <Button variant="outline" onClick={handleCreateWaybill} disabled={loading}>
              <FileText className="h-4 w-4 mr-2" />
              Создать накладную
            </Button>
            
            {hasImeiRequired && (
              <Button variant="outline" onClick={() => setShowImeiDialog(true)} disabled={loading}>
                <Smartphone className="h-4 w-4 mr-2" />
                Указать IMEI
              </Button>
            )}
            
            <Button variant="destructive" onClick={handleCancelOrder} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Отменить заказ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Состав заказа */}
      <Card>
        <CardHeader>
          <CardTitle>Состав заказа</CardTitle>
          <CardDescription>
            Позиции и детали заказа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Количество</TableHead>
                  <TableHead>Цена за единицу</TableHead>
                  <TableHead>Общая сумма</TableHead>
                  <TableHead>Вес</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.entryNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.title}</p>
                        <p className="text-sm text-muted-foreground">ID: {entry.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {entry.quantity} {entry.unitType}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(entry.basePrice)}</TableCell>
                    <TableCell>{formatPrice(entry.totalPrice)}</TableCell>
                    <TableCell>
                      {entry.weight ? `${entry.weight} кг` : '-'}
                    </TableCell>
                    <TableCell>
                      {entry.isImeiRequired ? (
                        <Badge variant="secondary">
                          <Smartphone className="h-3 w-3 mr-1" />
                          Требуется
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openModifyDialog(entry)}
                      >
                        <Weight className="h-4 w-4 mr-1" />
                        Изменить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Диалог изменения статуса */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить статус заказа</DialogTitle>
            <DialogDescription>
              Выберите новый статус для заказа #{order.code}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="status">Новый статус</Label>
            <Select value={newStatus} onValueChange={(value: OrderStatus) => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OrderStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getOrderStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateStatus} disabled={loading}>
              Изменить статус
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог установки IMEI */}
      <Dialog open={showImeiDialog} onOpenChange={setShowImeiDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Указать IMEI</DialogTitle>
            <DialogDescription>
              Введите IMEI для товаров в заказе #{order.code}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="imei">IMEI</Label>
            <Input
              id="imei"
              value={imeiValue}
              onChange={(e) => setImeiValue(e.target.value)}
              placeholder="Введите IMEI..."
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImeiDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSetImei} disabled={loading || !imeiValue.trim()}>
              Установить IMEI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог изменения позиции */}
      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить позицию</DialogTitle>
            <DialogDescription>
              Изменение параметров позиции: {selectedEntry?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="quantity">Количество</Label>
              <Input
                id="quantity"
                type="number"
                value={modifyData.quantity}
                onChange={(e) => setModifyData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="weight">Вес (кг)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={modifyData.weight}
                onChange={(e) => setModifyData(prev => ({ ...prev, weight: Number(e.target.value) }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModifyDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleModifyEntry} disabled={loading}>
              Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};