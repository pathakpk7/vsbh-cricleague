// Google Sheets API Service for User Validation
// This service would connect to your backend that has access to Google Sheets API

export interface GoogleSheetsUser {
  name: string;
  email: string;
  universityId: string;
  cricHeroesId: string;
  role: 'admin' | 'captain' | 'player';
  teamId?: string;
  isActive: boolean;
}

class GoogleSheetsService {
  private baseUrl: string;
  
  constructor() {
    // This would be your backend API endpoint
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  /**
   * Validate user credentials against Google Sheets data
   * In production, this would call your backend API that:
   * 1. Connects to Google Sheets API using service account
   * 2. Reads the authorized users spreadsheet
   * 3. Validates the provided credentials
   * 4. Returns user data if valid
   */
  async validateUser(credentials: {
    name: string;
    email: string;
    universityId: string;
    cricHeroesId: string;
  }): Promise<GoogleSheetsUser | null> {
    try {
      // For development, we'll simulate the API call
      // In production, replace this with actual API call:
      // const response = await fetch(`${this.baseUrl}/auth/validate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(credentials)
      // });
      // const data = await response.json();
      // return data.user || null;

      // Simulated validation logic
      return this.simulateUserValidation(credentials);
    } catch (error) {
      console.error('Google Sheets validation error:', error);
      throw new Error('Failed to validate user credentials');
    }
  }

  /**
   * Simulated user validation for development
   * In production, this would be replaced with actual Google Sheets API calls
   */
  private simulateUserValidation(credentials: {
    name: string;
    email: string;
    universityId: string;
    cricHeroesId: string;
  }): GoogleSheetsUser | null {
    // Admin user validation
    if (credentials.email === 'prasoon7pathak@gmail.com') {
      return {
        name: credentials.name,
        email: credentials.email,
        universityId: credentials.universityId,
        cricHeroesId: credentials.cricHeroesId,
        role: 'admin',
        isActive: true
      };
    }

    // Mock captain data (in production, this comes from Google Sheets)
    const mockCaptains: GoogleSheetsUser[] = [
      {
        name: 'John Captain',
        email: 'captain@university.edu',
        universityId: 'U001',
        cricHeroesId: 'CH001',
        role: 'captain',
        teamId: '1',
        isActive: true
      },
      {
        name: 'Jane Leader',
        email: 'leader@university.edu',
        universityId: 'U002', 
        cricHeroesId: 'CH002',
        role: 'captain',
        teamId: '2',
        isActive: true
      },
      {
        name: 'Mike Skipper',
        email: 'skipper@university.edu',
        universityId: 'U003',
        cricHeroesId: 'CH003',
        role: 'captain',
        teamId: '3',
        isActive: true
      }
    ];

    // Find matching captain
    const captain = mockCaptains.find(captain => 
      captain.name === credentials.name &&
      captain.email === credentials.email &&
      captain.universityId === credentials.universityId &&
      captain.cricHeroesId === credentials.cricHeroesId &&
      captain.isActive
    );

    return captain || null;
  }

  /**
   * Get all authorized users from Google Sheets
   * This would be used by admin to manage users
   */
  async getAllUsers(): Promise<GoogleSheetsUser[]> {
    try {
      // In production, this would call your backend API
      // const response = await fetch(`${this.baseUrl}/users`);
      // return await response.json();

      // Mock data for development
      return [
        {
          name: 'Admin User',
          email: 'prasoon7pathak@gmail.com',
          universityId: 'ADMIN001',
          cricHeroesId: 'ADMIN_CH',
          role: 'admin',
          isActive: true
        },
        {
          name: 'John Captain',
          email: 'captain@university.edu',
          universityId: 'U001',
          cricHeroesId: 'CH001',
          role: 'captain',
          teamId: '1',
          isActive: true
        },
        {
          name: 'Jane Leader',
          email: 'leader@university.edu',
          universityId: 'U002',
          cricHeroesId: 'CH002',
          role: 'captain',
          teamId: '2',
          isActive: true
        }
      ];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Add new user to Google Sheets (admin only)
   */
  async addUser(user: Omit<GoogleSheetsUser, 'isActive'>): Promise<void> {
    try {
      // In production, this would call your backend API
      // await fetch(`${this.baseUrl}/users`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...user, isActive: true })
      // });

      console.log('User added to Google Sheets:', user);
    } catch (error) {
      console.error('Error adding user:', error);
      throw new Error('Failed to add user');
    }
  }

  /**
   * Update user status in Google Sheets (admin only)
   */
  async updateUserStatus(email: string, isActive: boolean): Promise<void> {
    try {
      // In production, this would call your backend API
      // await fetch(`${this.baseUrl}/users/${email}/status`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ isActive })
      // });

      console.log(`User ${email} status updated to:`, isActive);
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
