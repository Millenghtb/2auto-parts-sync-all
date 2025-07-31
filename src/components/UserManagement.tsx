import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/hooks/useUserRoles";
import { User } from "@supabase/supabase-js";

interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    company_name?: string;
  };
  user_roles: {
    role: AppRole;
  }[];
}

interface UserManagementProps {
  currentUser: User;
  isAdmin: boolean;
}

const UserManagement = ({ currentUser, isAdmin }: UserManagementProps) => {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdmin) return;
    
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Get user roles first to see which users we have
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return;
      }

      // Create simple user data from current user for now
      const usersData: UserWithProfile[] = [{
        id: currentUser.id,
        email: currentUser.email || '',
        created_at: currentUser.created_at || '',
        profiles: {
          first_name: 'Администратор',
          last_name: 'Системы',
          company_name: 'Компания'
        },
        user_roles: rolesData?.filter(role => role.user_id === currentUser.id).map(role => ({ role: role.role as AppRole })) || []
      }];

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось добавить роль",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Роль добавлена",
      });

      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при добавлении роли",
        variant: "destructive",
      });
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить роль",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Роль удалена",
      });

      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении роли",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Управление пользователями</CardTitle>
          <CardDescription>Доступ ограничен</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            У вас нет прав для управления пользователями. Требуется роль администратора.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Управление пользователями</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Загрузка пользователей...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление пользователями</CardTitle>
        <CardDescription>
          Управление ролями и правами пользователей системы
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Компания</TableHead>
              <TableHead>Роли</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {user.profiles?.first_name} {user.profiles?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.id === currentUser.id && "(Вы)"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.profiles?.company_name}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {user.user_roles.map((roleData, index) => (
                      <Badge 
                        key={index} 
                        variant={roleData.role === 'admin' ? 'default' : 'secondary'}
                      >
                        {roleData.role === 'admin' ? 'Администратор' : 
                         roleData.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                      </Badge>
                    ))}
                    {user.user_roles.length === 0 && (
                      <span className="text-sm text-muted-foreground">Нет ролей</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <Select
                      onValueChange={(value) => addRole(user.id, value as AppRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Добавить роль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Администратор</SelectItem>
                        <SelectItem value="manager">Менеджер</SelectItem>
                        <SelectItem value="user">Пользователь</SelectItem>
                      </SelectContent>
                    </Select>
                    {user.user_roles.length > 0 && (
                      <Select
                        onValueChange={(value) => removeRole(user.id, value as AppRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Удалить роль" />
                        </SelectTrigger>
                        <SelectContent>
                          {user.user_roles.map((roleData, index) => (
                            <SelectItem key={index} value={roleData.role}>
                              {roleData.role === 'admin' ? 'Администратор' : 
                               roleData.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagement;