import { propFirms } from '../data/propFirms';

export interface QuestionnaireData {
  tradesPerDay: string;
  tradingSession: string;
  cryptoAssets: string[];
  forexAssets: string[];
  hasAccount: 'yes' | 'no';
  accountEquity: number | string;
  propFirm: string;
  accountType: string;
  accountSize: number | string;
  riskPercentage: number;
  riskRewardRatio: string;
  accountScreenshot?: string;
}

export interface PropFirmRules {
  provider: string;
  model: string;
  maxDailyLoss: string;
  maxDrawdown: string;
  profitTarget: string;
  tradingDays: string;
  maxPositions: string;
  leverage: string;
  restrictions: string[];
}

class QuestionnaireDataService {
  private static instance: QuestionnaireDataService;

  private constructor() {}

  public static getInstance(): QuestionnaireDataService {
    if (!QuestionnaireDataService.instance) {
      QuestionnaireDataService.instance = new QuestionnaireDataService();
    }
    return QuestionnaireDataService.instance;
  }

  // Store questionnaire data with exact precision
  public storeQuestionnaireData(data: QuestionnaireData): void {
    try {
      // Ensure exact precision for numeric values
      const normalizedData = {
        ...data,
        accountEquity: this.preserveExactValue(data.accountEquity),
        accountSize: this.preserveExactValue(data.accountSize),
        riskPercentage: this.preserveExactValue(data.riskPercentage)
      };

      // Store in localStorage with exact values
      localStorage.setItem('questionnaireAnswers', JSON.stringify(normalizedData));
      
      // Also store in session for immediate access
      sessionStorage.setItem('currentQuestionnaire', JSON.stringify(normalizedData));
      
      console.log('Questionnaire data stored with exact precision:', normalizedData);
    } catch (error) {
      console.error('Error storing questionnaire data:', error);
    }
  }

  // Retrieve questionnaire data with exact precision
  public getQuestionnaireData(): QuestionnaireData | null {
    try {
      // Try session storage first (most recent)
      const sessionData = sessionStorage.getItem('currentQuestionnaire');
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      // Fallback to localStorage
      const localData = localStorage.getItem('questionnaireAnswers');
      if (localData) {
        return JSON.parse(localData);
      }

      return null;
    } catch (error) {
      console.error('Error retrieving questionnaire data:', error);
      return null;
    }
  }

  // Preserve exact numeric values (no rounding)
  private preserveExactValue(value: number | string): string {
    if (typeof value === 'number') {
      // Convert to string to preserve exact decimal places
      return value.toString();
    }
    // If it's already a string, return as-is to preserve exact input
    return value;
  }

  // Get prop firm rules based on user selection
  public getPropFirmRules(propFirm: string, accountType: string): PropFirmRules | null {
    try {
      const firm = propFirms.find(f => f.name === propFirm);
      if (!firm) {
        console.warn(`Prop firm not found: ${propFirm}`);
        return null;
      }

      // Find the specific account model
      const model = firm.models.find(m => m.name === accountType);
      if (!model) {
        console.warn(`Account model not found: ${accountType} for ${propFirm}`);
        return null;
      }

      return {
        provider: firm.name,
        model: model.name,
        maxDailyLoss: model.maxDailyLoss,
        maxDrawdown: model.maxDrawdown,
        profitTarget: model.profitTarget,
        tradingDays: model.tradingDays,
        maxPositions: model.maxPositions,
        leverage: model.leverage,
        restrictions: model.restrictions || []
      };
    } catch (error) {
      console.error('Error getting prop firm rules:', error);
      return null;
    }
  }

  // Validate questionnaire data integrity
  public validateQuestionnaireData(data: QuestionnaireData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!data.propFirm) {
      errors.push('Prop firm selection is required');
    }
    if (!data.accountType) {
      errors.push('Account type selection is required');
    }
    if (!data.accountSize) {
      errors.push('Account size is required');
    }
    if (!data.riskPercentage) {
      errors.push('Risk percentage is required');
    }

    // Validate numeric values
    if (data.accountSize) {
      const size = parseFloat(data.accountSize.toString());
      if (isNaN(size) || size <= 0) {
        errors.push('Account size must be a positive number');
      }
    }

    if (data.riskPercentage) {
      const risk = parseFloat(data.riskPercentage.toString());
      if (isNaN(risk) || risk <= 0 || risk > 10) {
        errors.push('Risk percentage must be between 0.1% and 10%');
      }
    }

    // Check for potential issues
    if (data.riskPercentage && parseFloat(data.riskPercentage.toString()) > 5) {
      warnings.push('High risk percentage detected. Consider reducing to 1-2% for better risk management.');
    }

    if (data.tradesPerDay === '5+' && parseFloat(data.riskPercentage.toString()) > 2) {
      warnings.push('High risk with many trades per day may lead to rapid account depletion.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Get account summary for display
  public getAccountSummary(data: QuestionnaireData): {
    accountSize: string;
    riskAmount: string;
    maxDailyRisk: string;
    propFirmRules: PropFirmRules | null;
  } {
    const accountSize = this.preserveExactValue(data.accountSize);
    const riskPercentage = parseFloat(data.riskPercentage.toString());
    
    // Calculate risk amounts with exact precision
    const riskAmount = (parseFloat(accountSize) * (riskPercentage / 100)).toFixed(2);
    const maxDailyRisk = (parseFloat(riskAmount) * 3).toFixed(2); // Max 3 trades per day

    // Get prop firm rules
    const propFirmRules = this.getPropFirmRules(data.propFirm, data.accountType);

    return {
      accountSize,
      riskAmount,
      maxDailyRisk,
      propFirmRules
    };
  }

  // Export questionnaire data for debugging
  public exportQuestionnaireData(): string {
    try {
      const data = this.getQuestionnaireData();
      if (!data) {
        return 'No questionnaire data available';
      }

      const summary = this.getAccountSummary(data);
      const validation = this.validateQuestionnaireData(data);

      return JSON.stringify({
        questionnaireData: data,
        accountSummary: summary,
        validation,
        exportTimestamp: new Date().toISOString()
      }, null, 2);
    } catch (error) {
      console.error('Error exporting questionnaire data:', error);
      return 'Error exporting data';
    }
  }

  // Clear all questionnaire data
  public clearQuestionnaireData(): void {
    try {
      localStorage.removeItem('questionnaireAnswers');
      sessionStorage.removeItem('currentQuestionnaire');
      console.log('Questionnaire data cleared');
    } catch (error) {
      console.error('Error clearing questionnaire data:', error);
    }
  }
}

export default QuestionnaireDataService.getInstance();
