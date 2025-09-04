import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { SignupSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

export interface RegisterResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    fullName: string | null;
    createdAt: Date;
  };
  message?: string;
  error?: string;
  details?: any;
}

export async function registerUser(data: any): Promise<RegisterResponse> {
  try {
    // Validate input
    const validationResult = SignupSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      };
    }

    const validatedData = validationResult.data;

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create user with transaction
    const user = await prisma.$transaction(async (tx) => {
      // Check if user exists
      const existing = await tx.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existing) {
        throw new Error('User already exists');
      }

      // Create new user
      return await tx.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
          fullName: validatedData.fullName,
          questionnaireData: validatedData.questionnaire,
          screenshotUrl: validatedData.screenshot,
          riskManagementPlan: validatedData.riskManagementPlan,
          status: 'PENDING',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true,
        },
      });
    });

    return {
      success: true,
      user,
      message: 'Registration successful',
    };

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'Email already registered'
        };
      }
    }

    if (error instanceof Error && error.message === 'User already exists') {
      return {
        success: false,
        error: 'User already exists'
      };
    }

    return {
      success: false,
      error: 'Internal server error'
    };
  }
}
