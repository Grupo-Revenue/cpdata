
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  
  // Refs to prevent race conditions and duplicate calls
  const adminCheckInProgress = useRef(false);
  const adminCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryAttempts = useRef(0);
  const maxRetries = 3;

  const checkAdminStatus = useCallback(async () => {
    const currentUser = user;
    
    if (!currentUser) {
      console.log('[Auth] No user found, setting isAdmin to false');
      setIsAdmin(false);
      retryAttempts.current = 0;
      return;
    }

    // Prevent concurrent admin checks
    if (adminCheckInProgress.current) {
      console.log('[Auth] Admin check already in progress, skipping');
      return;
    }

    adminCheckInProgress.current = true;
    console.log(`[Auth] Checking admin status for user: ${currentUser.id} (attempt ${retryAttempts.current + 1})`);

    try {
      // Clear any pending timeout
      if (adminCheckTimeout.current) {
        clearTimeout(adminCheckTimeout.current);
        adminCheckTimeout.current = null;
      }

      // Use the new check_is_admin function directly
      const { data, error } = await supabase.rpc('check_is_admin', {
        _user_id: currentUser.id
      });

      if (error) {
        console.error('[Auth] Error checking admin status:', error);
        
        // Retry logic for transient errors
        if (retryAttempts.current < maxRetries) {
          retryAttempts.current++;
          console.log(`[Auth] Retrying admin check in 1 second (attempt ${retryAttempts.current}/${maxRetries})`);
          
          adminCheckTimeout.current = setTimeout(() => {
            adminCheckInProgress.current = false;
            checkAdminStatus();
          }, 1000);
          return;
        } else {
          console.error('[Auth] Max retry attempts reached, setting isAdmin to false');
          setIsAdmin(false);
          retryAttempts.current = 0;
        }
      } else {
        const adminResult = !!data;
        console.log(`[Auth] Admin check successful: ${adminResult}`);
        setIsAdmin(adminResult);
        retryAttempts.current = 0;
      }
    } catch (error) {
      console.error('[Auth] Exception in checkAdminStatus:', error);
      
      // Retry logic for exceptions
      if (retryAttempts.current < maxRetries) {
        retryAttempts.current++;
        console.log(`[Auth] Retrying admin check due to exception in 1 second (attempt ${retryAttempts.current}/${maxRetries})`);
        
        adminCheckTimeout.current = setTimeout(() => {
          adminCheckInProgress.current = false;
          checkAdminStatus();
        }, 1000);
        return;
      } else {
        console.error('[Auth] Max retry attempts reached after exception, setting isAdmin to false');
        setIsAdmin(false);
        retryAttempts.current = 0;
      }
    } finally {
      adminCheckInProgress.current = false;
    }
  }, [user]);

  useEffect(() => {
    console.log('[Auth] Setting up auth state listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[Auth] Auth state changed: ${event}`, session?.user?.email || 'no user');
        
        // Update session and user state synchronously
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Reset admin state and retry attempts when user changes
        if (!session?.user) {
          setIsAdmin(false);
          retryAttempts.current = 0;
          // Clear any pending admin check
          if (adminCheckTimeout.current) {
            clearTimeout(adminCheckTimeout.current);
            adminCheckTimeout.current = null;
          }
          adminCheckInProgress.current = false;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session check:', session?.user?.email || 'no user');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('[Auth] Cleaning up auth subscription');
      subscription.unsubscribe();
      
      // Clean up any pending timeouts
      if (adminCheckTimeout.current) {
        clearTimeout(adminCheckTimeout.current);
        adminCheckTimeout.current = null;
      }
    };
  }, []);

  // Check admin status when user changes, with debouncing
  useEffect(() => {
    if (user && !loading) {
      console.log('[Auth] User state updated, scheduling admin check');
      
      // Clear any existing timeout
      if (adminCheckTimeout.current) {
        clearTimeout(adminCheckTimeout.current);
      }
      
      // Debounce the admin check to prevent rapid successive calls
      adminCheckTimeout.current = setTimeout(() => {
        checkAdminStatus();
      }, 200);
    }
    
    return () => {
      if (adminCheckTimeout.current) {
        clearTimeout(adminCheckTimeout.current);
        adminCheckTimeout.current = null;
      }
    };
  }, [user, loading, checkAdminStatus]);

  const signUp = async (email: string, password: string, userData?: any) => {
    // Handle different environments properly
    const baseUrl = window.location.origin;
    const redirectUrl = baseUrl.includes('localhost') ? 
      `${baseUrl}/` : 
      `${baseUrl}/`;
    
    console.log('[Auth] Signing up with redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });

    if (error) {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Registro exitoso",
        description: "Por favor, revisa tu email para confirmar tu cuenta."
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de vuelta!"
      });
    }

    return { error };
  };

  const signOut = async () => {
    console.log('[Auth] Signing out...');
    
    // Reset admin state immediately
    setIsAdmin(false);
    retryAttempts.current = 0;
    
    // Clear any pending admin checks
    if (adminCheckTimeout.current) {
      clearTimeout(adminCheckTimeout.current);
      adminCheckTimeout.current = null;
    }
    adminCheckInProgress.current = false;
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente"
      });
      // Redirect to auth page after successful logout
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    checkAdminStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
