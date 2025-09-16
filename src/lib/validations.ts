import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  tradingExperience: z.string().optional(),
  tradingGoals: z.string().optional(),
  riskTolerance: z.string().optional(),
  preferredMarkets: z.string().optional(),
  tradingStyle: z.string().optional(),
  agreeToMarketing: z.boolean().optional(),
  selectedPlan: z.object({
    name: z.string(),
    price: z.number(),
    period: z.string(),
    description: z.string().optional(),
  }).optional(),
  questionnaire: z.object({
    experience: z.string(),
    goals: z.string(),
    preferences: z.string(),
  }).optional(),
  screenshot: z.string().url().optional().or(z.literal('')),
  riskManagementPlan: z.string().optional(),
});

export const QuestionnaireSchema = z.object({
  cryptoAssets: z.array(z.string()).optional(),
  forexPairs: z.array(z.string()).optional(),
  otherForexPair: z.string().optional(),
  screenshotUrl: z.string().url().optional().or(z.literal('')),
});

export const TradingPreferencesSchema = z.object({
  propFirm: z.string().optional(),
  riskPerTrade: z.number().min(0.1).max(10).optional(),
  riskRewardRatio: z.string().optional(),
  tradesPerDay: z.string().optional(),
  hasAccount: z.string().optional(),
  tradingSession: z.string().optional(),
});

export const RiskManagementPlanSchema = z.object({
  profitTarget: z.number().optional(),
  tradesNeeded: z.number().optional(),
  daysToPass: z.number().optional(),
  winRateNeeded: z.number().optional(),
  maxDrawdown: z.number().optional(),
  positionSize: z.number().optional(),
  successProbability: z.number().optional(),
  firmName: z.string().optional(),
  accountType: z.string().optional(),
  accountSize: z.number().optional(),
  riskPerTradePercentage: z.number().optional(),
  riskRewardRatio: z.string().optional(),
  riskAmount: z.number().optional(),
  profitTargetPerTrade: z.number().optional(),
  tradesPerDayRange: z.string().optional(),
  sessionType: z.string().optional(),
  maxDailyRiskAmount: z.number().optional(),
  dailyTargetAmount: z.number().optional(),
});

export const StatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED']),
});

export const UserUpdateSchema = z.object({
  fullName: z.string().optional(),
  questionnaireData: z.object({
    experience: z.string(),
    goals: z.string(),
    preferences: z.string(),
  }).optional(),
  screenshotUrl: z.string().url().optional().or(z.literal('')),
  riskManagementPlan: z.string().optional(),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type QuestionnaireInput = z.infer<typeof QuestionnaireSchema>;
export type TradingPreferencesInput = z.infer<typeof TradingPreferencesSchema>;
export type RiskManagementPlanInput = z.infer<typeof RiskManagementPlanSchema>;
export type StatusUpdateInput = z.infer<typeof StatusUpdateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
