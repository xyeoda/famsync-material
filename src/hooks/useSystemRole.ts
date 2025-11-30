import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/app-client';

export function useSystemRole() {
  const [isSiteAdmin, setIsSiteAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemRole();
  }, []);

  const checkSystemRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsSiteAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('system_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'site_admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking system role:', error);
        setIsSiteAdmin(false);
      } else {
        setIsSiteAdmin(!!data);
      }
    } catch (error) {
      console.error('Error in checkSystemRole:', error);
      setIsSiteAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isSiteAdmin, loading };
}
