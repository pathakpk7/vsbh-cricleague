import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  universityId: string;
  cricHeroesId: string;
  role: 'admin' | 'captain' | 'player';
  teamId?: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  name: string;
  universityId: string;
  cricHeroesId: string;
  email: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const storedUser = localStorage.getItem('vsbh_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      localStorage.removeItem('vsbh_user');
    }
  };

  const validateUserFromGoogleSheets = async (credentials: LoginCredentials): Promise<User | null> => {
    try {
      // Admin validation
      if (credentials.email === 'prasoon7pathak@gmail.com' && 
          credentials.name.toLowerCase().includes('prasoon')) {
        return {
          id: 'admin_001',
          name: credentials.name,
          email: credentials.email,
          universityId: credentials.universityId,
          cricHeroesId: credentials.cricHeroesId,
          role: 'admin',
          isAuthenticated: true
        };
      }

      // Simulate captain validation from Google Sheets
      const mockCaptainData = [
        {
          name: 'John Captain',
          email: 'captain@university.edu',
          universityId: 'U001',
          cricHeroesId: 'CH001',
          teamId: '1',
          role: 'captain' as const
        },
        {
          name: 'Jane Leader',
          email: 'leader@university.edu', 
          universityId: 'U002',
          cricHeroesId: 'CH002',
          teamId: '2',
          role: 'captain' as const
        }
      ];

      const captain = mockCaptainData.find(
        c => c.email === credentials.email && 
             c.name === credentials.name &&
             c.universityId === credentials.universityId &&
             c.cricHeroesId === credentials.cricHeroesId
      );

      if (captain) {
        return {
          id: `captain_${captain.teamId}`,
          name: captain.name,
          email: captain.email,
          universityId: captain.universityId,
          cricHeroesId: captain.cricHeroesId,
          role: captain.role,
          teamId: captain.teamId,
          isAuthenticated: true
        };
      }

      // Allow any user to login as a player (no restrictions)
      return {
        id: `player_${credentials.universityId}`,
        name: credentials.name,
        email: credentials.email,
        universityId: credentials.universityId,
        cricHeroesId: credentials.cricHeroesId,
        role: 'player',
        isAuthenticated: true
      };

    } catch (error) {
      console.error('Error validating user from Google Sheets:', error);
      return null;
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate all required fields
      if (!credentials.name || !credentials.universityId || 
          !credentials.cricHeroesId || !credentials.email) {
        setError('All fields are required');
        return false;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        setError('Invalid email format');
        return false;
      }

      // Validate against Google Sheets data
      const validatedUser = await validateUserFromGoogleSheets(credentials);
      
      if (!validatedUser) {
        setError('Login failed. Please check your credentials and try again.');
        return false;
      }

      // Store user session
      setUser(validatedUser);
      localStorage.setItem('vsbh_user', JSON.stringify(validatedUser));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vsbh_user');
    setError(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
