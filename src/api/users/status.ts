import prisma from '@/lib/prisma';
import { StatusUpdateSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

export interface StatusUpdateResponse {
  success: boolean;
  user?: {
    id: string;
    status: string;
    updatedAt: Date;
  };
  error?: string;
}

export async function updateUserStatus(
  id: string, 
  statusData: any
): Promise<StatusUpdateResponse> {
  try {
    const validationResult = StatusUpdateSchema.safeParse(statusData);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Invalid status value'
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        status: validationResult.data.status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      user: updatedUser,
    };

  } catch (error) {
    console.error('Error updating user status:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          success: false,
          error: 'User not found'
        };
      }
    }

    return {
      success: false,
      error: 'Failed to update status'
    };
  }
}
