import api from '../lib/api';

export interface UserFlowStatus {
  isComplete: boolean;
  completedSteps: string[];
  missingSteps: string[];
  currentStep: string | null;
  redirectTo: string | undefined;
}

export interface UserAccountStatus {
  email: string;
  hasAccount: boolean;
  hasPayment: boolean;
  hasQuestionnaire: boolean;
  hasRiskManagement: boolean;
  isComplete: boolean;
  createdAt: string;
  lastUpdated: string;
}

class UserFlowService {
  private baseUrl = '/api/user-flow';

  // Check if user has completed all required steps
  async checkUserFlowStatus(email: string): Promise<UserFlowStatus> {
    try {
      // First check localStorage for immediate response
      const localStatus = this.getLocalFlowStatus(email);
      if (localStatus.isComplete) {
        return localStatus;
      }

      // Then check database
      try {
        const response = await api.get(`${this.baseUrl}/status?email=${encodeURIComponent(email)}`);
        const dbStatus = response.data;
        
        // Update localStorage with database data
        this.updateLocalFlowStatus(email, dbStatus);
        return dbStatus;
      } catch (dbError) {
        console.warn('Failed to check database, using localStorage:', dbError);
        return localStatus;
      }
    } catch (error) {
      console.error('Error checking user flow status:', error);
      return this.getLocalFlowStatus(email);
    }
  }

  // Get flow status from localStorage
  private getLocalFlowStatus(email: string): UserFlowStatus {
    const userData = localStorage.getItem(`user_flow_${email}`);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.warn('Invalid user flow data, recalculating');
      }
    }

    // Check individual step completions - STRICT checks
    // Only count as completed if explicitly marked with email suffix
    const hasPayment = !!localStorage.getItem(`payment_completed_${email}`);
    const hasQuestionnaire = !!localStorage.getItem(`questionnaire_completed_${email}`);
    const hasRiskManagement = !!localStorage.getItem(`risk_management_completed_${email}`);

    const completedSteps = [];
    const missingSteps = [];

    if (hasPayment) completedSteps.push('payment');
    else missingSteps.push('payment');

    if (hasQuestionnaire) completedSteps.push('questionnaire');
    else missingSteps.push('questionnaire');

    if (hasRiskManagement) completedSteps.push('risk_management');
    else missingSteps.push('risk_management');

    const isComplete = completedSteps.length === 3;
    const currentStep = missingSteps[0] || null;
    const redirectTo = this.getRedirectRoute(currentStep);

    return {
      isComplete,
      completedSteps,
      missingSteps,
      currentStep,
      redirectTo
    };
  }

  // Update localStorage with flow status
  private updateLocalFlowStatus(email: string, status: UserFlowStatus): void {
    localStorage.setItem(`user_flow_${email}`, JSON.stringify(status));
  }

  // Mark a step as completed
  async markStepCompleted(email: string, step: string): Promise<void> {
    try {
      const currentStatus = this.getLocalFlowStatus(email);
      
      if (!currentStatus.completedSteps.includes(step)) {
        currentStatus.completedSteps.push(step);
        currentStatus.missingSteps = currentStatus.missingSteps.filter(s => s !== step);
        currentStatus.isComplete = currentStatus.completedSteps.length === 3;
        currentStatus.currentStep = currentStatus.missingSteps[0] || null;
        currentStatus.redirectTo = this.getRedirectRoute(currentStatus.currentStep);
        
        this.updateLocalFlowStatus(email, currentStatus);
      }

      // Try to update database
      try {
        await api.post(`${this.baseUrl}/mark-step`, {
          email,
          step,
          completed: true
        });
      } catch (dbError) {
        console.warn('Failed to update database, using localStorage only:', dbError);
      }
    } catch (error) {
      console.error('Error marking step completed:', error);
    }
  }

  // Check if email already has a complete account
  async checkAccountExists(email: string): Promise<boolean> {
    try {
      // Check localStorage first
      const localStatus = this.getLocalFlowStatus(email);
      if (localStatus.isComplete) {
        return true;
      }

      // Check database
      try {
        const response = await api.get(`${this.baseUrl}/account-exists?email=${encodeURIComponent(email)}`);
        return response.data.exists;
      } catch (dbError) {
        console.warn('Failed to check database, using localStorage:', dbError);
        return localStatus.isComplete;
      }
    } catch (error) {
      console.error('Error checking account existence:', error);
      return false;
    }
  }

  // Get redirect route for missing step
  private getRedirectRoute(step: string | null): string | undefined {
    switch (step) {
      case 'payment':
        return '/payment-flow';
      case 'questionnaire':
        return '/questionnaire';
      case 'risk_management':
        return '/risk-management-plan';
      default:
        return undefined;
    }
  }

  // Validate user can sign in
  async validateSignIn(email: string): Promise<{ canSignIn: boolean; redirectTo?: string; error?: string }> {
    try {
      const flowStatus = await this.checkUserFlowStatus(email);
      
      if (!flowStatus.isComplete) {
        return {
          canSignIn: false,
          redirectTo: flowStatus.redirectTo,
          error: `Please complete ${flowStatus.missingSteps.join(', ')} before signing in`
        };
      }

      return { canSignIn: true };
    } catch (error) {
      console.error('Error validating sign in:', error);
      return {
        canSignIn: false,
        error: 'Unable to validate user flow status'
      };
    }
  }

  // Get user account status
  async getUserAccountStatus(email: string): Promise<UserAccountStatus> {
    try {
      const flowStatus = await this.checkUserFlowStatus(email);
      
      return {
        email,
        hasAccount: true,
        hasPayment: flowStatus.completedSteps.includes('payment'),
        hasQuestionnaire: flowStatus.completedSteps.includes('questionnaire'),
        hasRiskManagement: flowStatus.completedSteps.includes('risk_management'),
        isComplete: flowStatus.isComplete,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting user account status:', error);
      return {
        email,
        hasAccount: false,
        hasPayment: false,
        hasQuestionnaire: false,
        hasRiskManagement: false,
        isComplete: false,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

export const userFlowService = new UserFlowService();
export default userFlowService;
