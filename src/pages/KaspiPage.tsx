import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import { KaspiOrdersTable } from "@/components/KaspiOrdersTable";
import { KaspiOrderDetails } from "@/components/KaspiOrderDetails";
import { KaspiProductForm } from "@/components/KaspiProductForm";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { AlertTriangle, Settings, ShoppingBag, Package, Save } from "lucide-react";
import { KaspiApiClient, Order, OrderEntry } from "@/lib/kaspi-api";

const KaspiPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [kaspiClient, setKaspiClient] = useState<KaspiApiClient | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderEntries, setOrderEntries] = useState<OrderEntry[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Проверка авторизации
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Сохранение токена API
  const handleSaveToken = () => {
    if (!authToken.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите токен API",
        variant: "destructive",
      });
      return;
    }

    try {
      const client = new KaspiApiClient(authToken);
      setKaspiClient(client);
      
      // Сохраняем токен в localStorage для последующих сессий
      localStorage.setItem('kaspi_auth_token', authToken);
      
      toast({
        title: "Токен сохранен",
        description: "API подключение настроено успешно",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать API клиент",
        variant: "destructive",
      });
    }
  };

  // Загрузка токена из localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('kaspi_auth_token');
    if (savedToken) {
      setAuthToken(savedToken);
      setKaspiClient(new KaspiApiClient(savedToken));
    }
  }, []);

  // Загрузка заказов
  const loadOrders = async () => {
    if (!kaspiClient) return;

    setOrdersLoading(true);
    try {
      const ordersData = await kaspiClient.getOrders({
        pageSize: 50,
        sort: '-createdAt'
      });
      
      let filteredOrders = ordersData;
      
      // Фильтрация по статусу
      if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
      }
      
      // Поиск по номеру заказа
      if (searchQuery) {
        filteredOrders = filteredOrders.filter(order => 
          order.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setOrders(filteredOrders);
    } catch (error) {
      toast({
        title: "Ошибка загрузки заказов",
        description: error instanceof Error ? error.message : "Не удалось загрузить заказы",
        variant: "destructive",
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  // Просмотр деталей заказа
  const handleViewOrder = async (order: Order) => {
    if (!kaspiClient) return;

    try {
      const entries = await kaspiClient.getOrderEntries(order.id);
      setOrderEntries(entries);
      setSelectedOrder(order);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось загрузить детали заказа",
        variant: "destructive",
      });
    }
  };

  // Обработка обновления заказа
  const handleOrderUpdated = () => {
    loadOrders();
    if (selectedOrder) {
      // Обновляем информацию о текущем заказе
      handleViewOrder(selectedOrder);
    }
  };

  // Загрузка заказов при изменении фильтров
  useEffect(() => {
    if (kaspiClient) {
      loadOrders();
    }
  }, [kaspiClient, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar user={user} />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6" />
                  Интеграция Kaspi.kz
                </h1>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            {!kaspiClient ? (
              // Настройка API
              <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Настройка API подключения
                    </CardTitle>
                    <CardDescription>
                      Для работы с Kaspi.kz необходимо настроить API токен
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Получите токен API в личном кабинете Kaspi.kz: Настройки → Токен API → «Сформировать»
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label htmlFor="token">X-Auth-Token</Label>
                      <Input
                        id="token"
                        type="password"
                        placeholder="Введите ваш API токен"
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                      />
                    </div>
                    
                    <Button onClick={handleSaveToken} disabled={!authToken.trim()}>
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить и подключиться
                    </Button>
                    
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Возможности интеграции:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Просмотр и управление заказами</li>
                        <li>• Принятие и отмена заказов</li>
                        <li>• Изменение статусов заказов</li>
                        <li>• Создание накладных</li>
                        <li>• Управление IMEI для техники</li>
                        <li>• Добавление новых товаров</li>
                        <li>• Работа с категориями и характеристиками</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : selectedOrder ? (
              // Детали заказа
              <KaspiOrderDetails
                order={selectedOrder}
                entries={orderEntries}
                onBack={() => setSelectedOrder(null)}
                onOrderUpdated={handleOrderUpdated}
                kaspiClient={kaspiClient}
              />
            ) : (
              // Основной интерфейс
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">Управление Kaspi.kz</h2>
                    <p className="text-muted-foreground">
                      Работа с заказами и товарами маркетплейса
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAuthToken("");
                      setKaspiClient(null);
                      localStorage.removeItem('kaspi_auth_token');
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Настройки API
                  </Button>
                </div>

                <Tabs defaultValue="orders" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="orders" className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Заказы
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Добавить товар
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders">
                    <KaspiOrdersTable
                      orders={orders}
                      loading={ordersLoading}
                      onRefresh={loadOrders}
                      onViewOrder={handleViewOrder}
                      onStatusFilter={setStatusFilter}
                      onSearch={setSearchQuery}
                    />
                  </TabsContent>

                  <TabsContent value="products">
                    <KaspiProductForm
                      kaspiClient={kaspiClient}
                      onProductAdded={() => {
                        toast({
                          title: "Успешно",
                          description: "Товар добавлен, можете переключиться на вкладку заказов",
                        });
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default KaspiPage;