import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Settings, Store, ShoppingCart, Database, Users, Shield, Plus } from "lucide-react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: rolesLoading } = useUserRoles(user);

  useEffect(() => {
    let isMounted = true;
    console.log('Dashboard: Setting up auth listener');

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Dashboard: Auth state change:', event, session?.user?.email);
        
        if (!isMounted) {
          console.log('Dashboard: Component unmounted, ignoring auth change');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Navigate only on sign out to avoid loops
        if (event === 'SIGNED_OUT') {
          console.log('Dashboard: User signed out, redirecting to auth');
          navigate("/auth");
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Dashboard: Token refreshed successfully');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Dashboard: Initial session check:', session?.user?.email, error);
      
      if (!isMounted) {
        console.log('Dashboard: Component unmounted, ignoring initial session');
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        console.log('Dashboard: No session found, redirecting to auth');
        navigate("/auth");
      }
    });

    return () => {
      console.log('Dashboard: Cleaning up auth listener');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Ошибка выхода",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || rolesLoading) {
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
                <h1 className="text-2xl font-bold">Панель управления</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <div className="flex items-center gap-1 text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                      <Shield className="h-3 w-3" />
                      Администратор
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  Выйти
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold">Добро пожаловать!</h2>
                <p className="text-muted-foreground">
                  Система управления поставщиками и маркетплейсами
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Поставщики
                    </CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Настроенных поставщиков
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => navigate('/suppliers')}
                    >
                      Управление
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Маркетплейсы
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Активных маркетплейсов
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => navigate('/marketplaces')}
                    >
                      Управление
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Подключения
                    </CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Активных подключений
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => navigate('/system-settings')}
                    >
                      Настройки
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Быстрые действия
                    </CardTitle>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate('/suppliers/new')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Поставщик
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate('/marketplaces/new')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Маркетплейс
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Последние действия</CardTitle>
                    <CardDescription>
                      Недавние изменения в системе
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-4">
                      Пока нет активности
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Системная информация</CardTitle>
                    <CardDescription>
                      Состояние системы
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Статус:</span>
                        <span className="text-green-600">Работает</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Версия:</span>
                        <span>1.0.0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Ваша роль:</span>
                        <span>{isAdmin ? 'Администратор' : 'Пользователь'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;