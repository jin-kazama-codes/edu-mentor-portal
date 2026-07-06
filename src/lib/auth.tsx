import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { User, UserRole, PermissionMatrix } from '../types';
import { hashPassword } from '../utils/crypto';

interface AuthContextType {
  currentUser: User | null;
  permissions: PermissionMatrix[] | null;
  loading: boolean;
  login: (email: string, role: UserRole, organization: string, passwordInput?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (module: string, action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'assign') => boolean;
  logSecurityAudit: (action: string, severity: 'Info' | 'Medium' | 'High' | 'Critical', details: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state synchronously from localStorage to avoid login flash on refresh
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('edu_portal_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [permissions, setPermissions] = useState<PermissionMatrix[] | null>(() => {
    try {
      const saved = localStorage.getItem('edu_portal_permissions');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('edu_portal_user'));

  // Persist session to localStorage whenever currentUser or permissions change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('edu_portal_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    if (permissions) {
      localStorage.setItem('edu_portal_permissions', JSON.stringify(permissions));
    }
  }, [permissions]);

  // Initialize session — restore from Supabase Auth or localStorage fallback
  useEffect(() => {
    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          await fetchUserData(session.user.id, session.user.email || '');
        } else {
          // Restore from localStorage if no Supabase session (fallback/mock users)
          const savedUserStr = localStorage.getItem('edu_portal_user');
          const savedPerms = localStorage.getItem('edu_portal_permissions');
          if (savedUserStr) {
            const savedUser = JSON.parse(savedUserStr);
            // Try to auto-login to Supabase Auth in the background since email might be confirmed now
            try {
              const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
                email: savedUser.email,
                password: 'Password123!'
              });
              if (!loginErr && loginData.session) {
                console.log('Background upgrade to authenticated Supabase session successful!');
                await fetchUserData(loginData.session.user.id, loginData.session.user.email || '');
                return;
              }
            } catch (autoLoginErr) {
              console.warn('Auto-login upgrade attempt failed:', autoLoginErr);
            }
            setCurrentUser(savedUser);
          }
          if (savedPerms) {
            setPermissions(JSON.parse(savedPerms));
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Session init error:', err);
        setLoading(false);
      }
    }
    initSession();
  }, []);

  async function fetchUserData(userId: string, email: string) {
    try {
      // 1. Fetch user profile from public.users table
      const { data: userProfile, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (profileErr || !userProfile) {
        console.error('Error fetching public user profile:', profileErr);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      let resolvedProfile = { ...userProfile } as User;
      if (resolvedProfile.role === 'Assistant') {
        if (resolvedProfile.mentor_id) {
          // Use the SECURITY DEFINER RPC to bypass RLS and look up mentor name
          // (Assistants cannot read other users' rows due to users_select policy)
          const { data: rpcMentor, error: rpcErr } = await supabase
            .rpc('get_assistant_mentor_name', { assistant_mentor_id: resolvedProfile.mentor_id });
          
          if (!rpcErr && rpcMentor) {
            resolvedProfile.mentorName = rpcMentor;
            console.log('Assistant mentorName resolved via RPC:', rpcMentor);
          } else {
            // Fallback: try querying mentors table by org (assistants can read mentors in their org)
            console.warn('RPC get_assistant_mentor_name failed, trying mentors table fallback:', rpcErr?.message);
            const { data: mentorsInOrg } = await supabase
              .from('mentors')
              .select('id, name')
              .eq('organization', resolvedProfile.organization);
            
            if (mentorsInOrg && mentorsInOrg.length > 0) {
              // Find mentor whose users.id matches mentor_id stored on the assistant
              // We can identify by checking if the mentor_id ends with any known pattern
              // Since mentor IDs in users table are "usr-{timestamp}" and mentors table has its own id,
              // we need to match via a secondary approach: check users table for mentor's email
              // Try the RPC approach with the assistant's own email to get mentor info
              const { data: mentorByLink } = await supabase
                .rpc('get_mentor_name_for_assistant_email', { assistant_email: resolvedProfile.email });
              if (mentorByLink) {
                resolvedProfile.mentorName = mentorByLink;
                console.log('Assistant mentorName resolved via email RPC:', mentorByLink);
              }
            }
          }
        }
        // If no mentor_id or no mentor found, mentorName stays undefined
        // Views will fall back to showing all org students
      }

      setCurrentUser(resolvedProfile);

      // 2. Fetch permissions matrix for RBAC evaluation
      // Fetch both Global policies and organization-specific overrides
      const { data: permData, error: permErr } = await supabase
        .from('permissions')
        .select('*')
        .or('organization.eq.Global,organization.eq.' + userProfile.organization);

      if (!permErr && permData) {
        // Resolve permissions, letting organization-specific overrides win
        const resolvedPermsMap: Record<string, PermissionMatrix> = {};
        
        // Load Global first
        permData.filter((p: any) => p.organization === 'Global').forEach((p: any) => {
          resolvedPermsMap[p.module] = p as PermissionMatrix;
        });
        
        // Overlay Org specific overrides
        permData.filter((p: any) => p.organization === userProfile.organization).forEach((p: any) => {
          resolvedPermsMap[p.module] = p as PermissionMatrix;
        });

        setPermissions(Object.values(resolvedPermsMap));
      }
    } catch (err) {
      console.error('fetchUserData error:', err);
    } finally {
      setLoading(false);
    }
  }

  const login = async (email: string, role: UserRole, organization: string, passwordInput?: string): Promise<boolean> => {
    setLoading(true);
    try {
      // All Supabase Auth operations use 'Password123!' behind the scenes for simplicity and backward compatibility
      const resolvedPassword = 'Password123!';
      let dbUserFromRpc: any = null;

      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('resolve_user_login', { email_input: email });
        if (!rpcErr && rpcData && rpcData.length > 0) {
          dbUserFromRpc = rpcData[0];
        }
      } catch (rpcErr) {
        console.warn('RPC check failed during login start:', rpcErr);
      }

      // If user typed a password in the UI, check that the SHA-256 hash matches the database
      if (passwordInput && dbUserFromRpc) {
        const hashedInput = await hashPassword(passwordInput);
        const expectedHash = dbUserFromRpc.password || 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea';
        
        if (hashedInput !== expectedHash) {
          console.error('Password mismatch: typed password hash does not match database.');
          setLoading(false);
          return false;
        }
      }

      // We perform sign in to Supabase Auth using the correct resolved password
      let { error } = await supabase.auth.signInWithPassword({
        email,
        password: resolvedPassword
      });

      // If sign in fails, try to automatically sign up the user in Supabase auth
      // if they already exist in public.users table but have no auth record.
      if (error) {
        console.warn('Auth login failed, attempting dynamic auto-registration:', error.message);
        try {
          if (dbUserFromRpc) {
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password: resolvedPassword,
              options: {
                data: {
                  role: dbUserFromRpc.role,
                  organization: dbUserFromRpc.organization
                }
              }
            });

            if (!signUpError) {
              console.log('Auto-registration successful, logging in...');
              const { error: secondLoginErr } = await supabase.auth.signInWithPassword({
                email,
                password: resolvedPassword
              });
              if (!secondLoginErr) {
                error = null; // Mark as successful login!
              } else {
                console.warn('Second login attempt failed:', secondLoginErr.message);
              }
            } else {
              console.warn('Auto-registration signUp failed:', signUpError.message);
            }
          }
        } catch (authRegErr) {
          console.warn('Auto-registration check failed:', authRegErr);
        }
      }

      if (error) {
        console.error('Auth login error after fallback attempts:', error.message);
        // Try to fetch profile from DB first to align mock details
        let dbUser: any = null;
        try {
          const { data, error: fetchErr } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();
          if (!fetchErr && data) {
            dbUser = data;
          }
        } catch (dbErr) {
          console.warn('Could not fetch DB profile for fallback session:', dbErr);
        }

        // Fallback for presentation purposes: Mock user record locally, using DB details if available
        const mockUser: User = {
          id: dbUser?.id || 'usr-mock-' + Date.now(),
          name: dbUser?.name || email.split('@')[0],
          email,
          role: dbUser?.role || role,
          organization: dbUser?.organization || organization,
          mentor_id: dbUser?.mentor_id || (email.includes('shabir') ? 'u-10' : email.includes('nuzhat') ? 'm-4' : undefined),
          mentorName: dbUser?.mentorName || (email.includes('shabir') ? 'Sarah Johnson' : email.includes('nuzhat') ? 'Suhail Ahmad' : undefined),
          status: dbUser?.status || 'Active',
          avatar: dbUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          createdDate: dbUser?.createdDate || new Date().toISOString().split('T')[0],
          lastLogin: new Date().toLocaleString(),
          number: dbUser?.number,
          gender: dbUser?.gender
        };
        setCurrentUser(mockUser);
        setLoading(false);
        return true;
      }

      // Re-fetch data to resolve from DB
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        await fetchUserData(session.user.id, session.user.email || '');
      }
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('edu_portal_user');
    localStorage.removeItem('edu_portal_permissions');
    setCurrentUser(null);
    setPermissions(null);
  };

  const hasPermission = (
    module: string, 
    action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'assign'
  ): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Student' && module.toLowerCase() === 'messaging') {
      return false;
    }
    if (currentUser.role === 'Super Admin' || currentUser.role === 'Organization Admin') return true;

    // Special Assistant check: inherit from Mentor, but explicitly deny Payments, Evaluations, etc.
    if (currentUser.role === 'Assistant') {
      const forbiddenModules = ['Financial Transactions', 'Student Evaluations', 'Payments & Subscriptions', 'Payments'];
      if (forbiddenModules.some(m => module.toLowerCase().includes(m.toLowerCase()))) {
        return false;
      }
    }

    const getLocalDefaultPermission = (role: UserRole, mod: string, act: string): boolean => {
      if (role === 'Organization Admin') return true;
      if (role === 'Mentor') {
        return ['Session Scheduling', 'Student Evaluations', 'Content Library', 'Messaging', 'User and Role Management'].includes(mod) 
          ? ['read', 'create', 'update'].includes(act) 
          : false;
      }
      if (role === 'Assistant') {
        return ['Session Scheduling', 'Content Library', 'Messaging'].includes(mod)
          ? ['read', 'create', 'update'].includes(act)
          : false;
      }
      if (role === 'Student') {
        return act === 'read' && ['Session Scheduling', 'Content Library', 'Student Evaluations', 'Financial Transactions', 'Payments & Subscriptions', 'Payments'].includes(mod);
      }
      return false;
    };

    if (!permissions) {
      return getLocalDefaultPermission(currentUser.role, module, action);
    }

    const modPerm = permissions.find(p => p.module.toLowerCase() === module.toLowerCase());
    if (!modPerm) {
      return getLocalDefaultPermission(currentUser.role, module, action);
    }

    const rolePerms = modPerm.roles[currentUser.role];
    if (!rolePerms) return false;

    return Boolean((rolePerms as any)[action]);
  };

  const logSecurityAudit = async (
    action: string, 
    severity: 'Info' | 'Medium' | 'High' | 'Critical', 
    details: string
  ): Promise<void> => {
    if (!currentUser) return;
    try {
      const log = {
        id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toLocaleString(),
        user: currentUser.name,
        role: currentUser.role,
        organization: currentUser.organization,
        action,
        ipAddress: '192.168.1.104', // Simulated client IP
        status: 'Success',
        severity,
        details
      };
      await supabase.from('audit_logs').insert([log]);
    } catch (err) {
      console.error('Audit logging failure:', err);
    }
  };

  const refreshUser = async () => {
    if (currentUser) {
      await fetchUserData(currentUser.id, currentUser.email);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, permissions, loading, login, logout, hasPermission, logSecurityAudit, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};