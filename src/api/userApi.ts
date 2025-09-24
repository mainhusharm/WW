import { databaseService, User, UserSubscription, UserQuestionnaire, UserDashboardSettings } from '../services/databaseService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface SignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PaymentRequest {
  user_id: string;
  plan_type: string;
  plan_name: string;
  amount: number;
  currency?: string;
  billing_cycle: string;
  payment_method?: string;
  payment_id?: string;
  starts_at: Date;
  expires_at?: Date;
}

export interface QuestionnaireRequest {
  user_id: string;
  account_equity: number;
  prop_firm_name?: string;
  account_type: string;
  account_number?: string;
  trading_experience?: string;
  risk_tolerance?: string;
  preferred_instruments?: string[];
  trading_goals?: string;
  daily_risk_limit?: number;
  max_drawdown_percent?: number;
  preferred_session?: string;
  additional_notes?: string;
}

class UserApiService {
  
  /**
   * User Signup
   */
  async signup(signupData: SignupRequest): Promise<{
    success: boolean;
    user?: User;
    token?: string;
    message?: string;
  }> {
    try {
      // Check if user already exists
      const existingUser = await databaseService.getUserByEmail(signupData.email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(signupData.password, saltRounds);

      // Create user
      const user = await databaseService.createUser({
        ...signupData,
        password_hash
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        user: {
          ...user,
          password_hash: undefined // Don't return password hash
        } as User,
        token
      };

    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'Internal server error during signup'
      };
    }
  }

  /**
   * User Login
   */
  async login(loginData: LoginRequest): Promise<{
    success: boolean;
    user?: User;
    token?: string;
    message?: string;
  }> {
    try {
      // Get user by email
      const user = await databaseService.getUserByEmail(loginData.email);
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(loginData.password, user.password_hash);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Update last login
      await databaseService.updateUserLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        user: {
          ...user,
          password_hash: undefined // Don't return password hash
        } as User,
        token
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Internal server error during login'
      };
    }
  }

  /**
   * Process Payment/Subscription
   */
  async processPayment(paymentData: PaymentRequest): Promise<{
    success: boolean;
    subscription?: UserSubscription;
    message?: string;
  }> {
    try {
      // Verify user exists
      const user = await databaseService.getUserById(paymentData.user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Create subscription record
      const subscription = await databaseService.createSubscription(paymentData);

      return {
        success: true,
        subscription
      };

    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        message: 'Internal server error during payment processing'
      };
    }
  }

  /**
   * Save Questionnaire Responses
   */
  async saveQuestionnaire(questionnaireData: QuestionnaireRequest): Promise<{
    success: boolean;
    questionnaire?: UserQuestionnaire;
    dashboardSettings?: UserDashboardSettings;
    message?: string;
  }> {
    try {
      // Verify user exists
      const user = await databaseService.getUserById(questionnaireData.user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Save questionnaire (this will automatically trigger dashboard settings update via database trigger)
      const questionnaire = await databaseService.saveQuestionnaire(questionnaireData);

      // Get updated dashboard settings
      const dashboardSettings = await databaseService.getUserDashboardSettings(questionnaireData.user_id);

      return {
        success: true,
        questionnaire,
        dashboardSettings
      };

    } catch (error) {
      console.error('Questionnaire save error:', error);
      return {
        success: false,
        message: 'Internal server error while saving questionnaire'
      };
    }
  }

  /**
   * Get User Profile (complete data)
   */
  async getUserProfile(userId: string): Promise<{
    success: boolean;
    profile?: {
      user: User;
      subscription: UserSubscription | null;
      questionnaire: UserQuestionnaire | null;
      dashboardSettings: UserDashboardSettings | null;
    };
    message?: string;
  }> {
    try {
      const profile = await databaseService.getUserProfile(userId);
      
      if (!profile) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Remove password hash from response
      const sanitizedProfile = {
        ...profile,
        user: {
          ...profile.user,
          password_hash: undefined
        } as User
      };

      return {
        success: true,
        profile: sanitizedProfile
      };

    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        message: 'Internal server error while fetching user profile'
      };
    }
  }

  /**
   * Update Dashboard Settings
   */
  async updateDashboardSettings(userId: string, settings: Partial<UserDashboardSettings>): Promise<{
    success: boolean;
    dashboardSettings?: UserDashboardSettings;
    message?: string;
  }> {
    try {
      // Verify user exists
      const user = await databaseService.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const dashboardSettings = await databaseService.updateDashboardSettings(userId, settings);

      return {
        success: true,
        dashboardSettings
      };

    } catch (error) {
      console.error('Update dashboard settings error:', error);
      return {
        success: false,
        message: 'Internal server error while updating dashboard settings'
      };
    }
  }

  /**
   * Verify JWT Token
   */
  verifyToken(token: string): { valid: boolean; userId?: string; email?: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        valid: true,
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Get Milestone Access Level from Account Type
   */
  getMilestoneAccessLevel(accountType: string): number {
    switch (accountType) {
      case 'Demo':
      case 'Beginner':
        return 1; // M1 only
      case 'Standard':
        return 2; // M1, M2
      case 'Pro':
      case 'Experienced':
        return 3; // M1, M2, M3
      case 'Funded':
      case 'Evaluation':
        return 4; // All milestones
      default:
        return 1; // Default to M1 only
    }
  }

  /**
   * Test Database Connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const isConnected = await databaseService.testConnection();
      return {
        success: isConnected,
        message: isConnected ? 'Database connection successful' : 'Database connection failed'
      };
    } catch (error) {
      return {
        success: false,
        message: `Database connection error: ${error}`
      };
    }
  }
}

// Export singleton instance
export const userApiService = new UserApiService();
export default userApiService;
