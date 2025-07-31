import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type AppRole = 'admin' | 'manager' | 'user';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export const useUserRoles = (user: User | null) => {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const fetchUserRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          return;
        }

        const userRoles = data.map(item => item.role as AppRole);
        setRoles(userRoles);
        setIsAdmin(userRoles.includes('admin'));
      } catch (error) {
        console.error('Error fetching user roles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const addRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        throw error;
      }

      // Refresh roles if it's the current user
      if (userId === user?.id) {
        setRoles(prev => [...prev, role]);
        if (role === 'admin') {
          setIsAdmin(true);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding role:', error);
      return { success: false, error };
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
        throw error;
      }

      // Refresh roles if it's the current user
      if (userId === user?.id) {
        setRoles(prev => prev.filter(r => r !== role));
        if (role === 'admin') {
          setIsAdmin(false);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing role:', error);
      return { success: false, error };
    }
  };

  return {
    roles,
    loading,
    isAdmin,
    hasRole,
    addRole,
    removeRole
  };
};