import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'captain' | 'player' | 'viewer';
  leagueId?: string;
  leagueName?: string;
  leagueCode?: string;
  teamId?: string;
  teamName?: string;
  captainKey?: string;
  token?: string;
  isAuthenticated: boolean;
}

export interface AdminCredentials {
  email: string;
  password?: string;
  admin_key?: string;
}

export interface CaptainCredentials {
  leagueCodeOrId: string;
  teamId: string;
  captainKey: string;
}

export interface PlayerCredentials {
  email: string;
  password?: string;
}

export interface LegacyLoginCredentials {
  name?: string;
  email: string;
  universityId?: string;
  cricHeroesId?: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  loginAdmin: (credentials: AdminCredentials) => Promise<boolean>;
  loginCaptain: (credentials: CaptainCredentials) => Promise<boolean>;
  loginPlayer: (credentials: PlayerCredentials) => Promise<boolean>;
  login: (credentials: LegacyLoginCredentials | AdminCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  activeLeagueId: string | null;
  setActiveLeagueId: (id: string | null) => void;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const storedUser = localStorage.getItem('vsbh_user');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.leagueId) {
          setActiveLeagueId(parsedUser.leagueId);
        }
      }
      const savedLeague = localStorage.getItem('vsbh_active_league');
      if (savedLeague && !activeLeagueId) {
        setActiveLeagueId(savedLeague);
      }
    } catch (err) {
      console.error('Error checking existing session:', err);
      localStorage.removeItem('vsbh_user');
    }
  };

  const setAndStoreUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('vsbh_user', JSON.stringify(newUser));
    if (newUser.leagueId) {
      setActiveLeagueId(newUser.leagueId);
      localStorage.setItem('vsbh_active_league', newUser.leagueId);
    }
    if (newUser.role === 'captain' && newUser.teamId && newUser.captainKey) {
      localStorage.setItem('captainCode', newUser.captainKey);
      localStorage.setItem('teamId', newUser.teamId);
      if (newUser.teamName) localStorage.setItem('teamName', newUser.teamName);
    }
  };

  // League Admin Login
  const loginAdmin = async (credentials: AdminCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Admin authentication failed');
        return false;
      }

      const adminUser: User = {
        id: data.data.league_id ? `admin_${data.data.league_id}` : 'admin_super',
        name: data.data.admin_name || 'League Admin',
        email: data.data.admin_email || credentials.email,
        role: 'admin',
        leagueId: data.data.league_id,
        leagueName: data.data.league_name,
        leagueCode: data.data.league_code,
        token: data.data.token,
        isAuthenticated: true
      };

      setAndStoreUser(adminUser);
      return true;
    } catch (err: any) {
      setError(err.message || 'Server connection error during admin login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Team Captain Login with Unique Captain Auction Key
  const loginCaptain = async (credentials: CaptainCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/captain-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Invalid Captain Auction Key');
        return false;
      }

      const captainUser: User = {
        id: `captain_${data.data.teamId}`,
        name: `${data.data.teamName} Captain`,
        email: `captain@${data.data.teamId}.cl`,
        role: 'captain',
        teamId: data.data.teamId,
        teamName: data.data.teamName,
        captainKey: credentials.captainKey,
        leagueId: data.data.league_id,
        leagueName: data.data.league_name,
        leagueCode: data.data.league_code,
        token: data.data.token,
        isAuthenticated: true
      };

      setAndStoreUser(captainUser);
      return true;
    } catch (err: any) {
      setError(err.message || 'Server connection error during captain login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Player Login
  const loginPlayer = async (credentials: PlayerCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/player-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Invalid player credentials');
        return false;
      }

      const playerUser: User = {
        id: data.data.id,
        name: data.data.name,
        email: data.data.email,
        role: 'player',
        leagueId: data.data.league_id,
        leagueName: data.data.league_name,
        leagueCode: data.data.league_code,
        token: data.data.token,
        isAuthenticated: true
      };

      setAndStoreUser(playerUser);
      return true;
    } catch (err: any) {
      setError(err.message || 'Server connection error during player login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Backward-compatible generic login method
  const login = async (credentials: any): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (credentials.captainKey && credentials.teamId) {
        return await loginCaptain({
          leagueCodeOrId: credentials.leagueCodeOrId || activeLeagueId || '',
          teamId: credentials.teamId,
          captainKey: credentials.captainKey
        });
      }

      if (credentials.password) {
        // Try admin first, fallback to player
        const isAdminOk = await loginAdmin({
          email: credentials.email,
          password: credentials.password
        });
        if (isAdminOk) return true;

        const isPlayerOk = await loginPlayer({
          email: credentials.email,
          password: credentials.password
        });
        if (isPlayerOk) return true;
      }

      // Guest / Player fallback
      const guestUser: User = {
        id: `user_${Date.now()}`,
        name: credentials.name || 'Cricket Fan',
        email: credentials.email,
        role: 'viewer',
        leagueId: activeLeagueId || undefined,
        isAuthenticated: true
      };
      setAndStoreUser(guestUser);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vsbh_user');
    localStorage.removeItem('captainCode');
    localStorage.removeItem('teamId');
    localStorage.removeItem('teamName');
    setError(null);
  };

  const handleSetActiveLeague = (id: string | null) => {
    setActiveLeagueId(id);
    if (id) {
      localStorage.setItem('vsbh_active_league', id);
    } else {
      localStorage.removeItem('vsbh_active_league');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginAdmin,
        loginCaptain,
        loginPlayer,
        login,
        logout,
        isLoading,
        error,
        activeLeagueId,
        setActiveLeagueId: handleSetActiveLeague
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
