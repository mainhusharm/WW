import prisma from '@/lib/prisma';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  questionnaireData: any;
  screenshotUrl: string | null;
  riskManagementPlan: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersResponse {
  success: boolean;
  users?: User[];
  count?: number;
  error?: string;
}

export async function fetchUsers(params?: {
  status?: string;
  limit?: number;
}): Promise<UsersResponse> {
  try {
    const { status, limit = 50 } = params || {};
    
    const where = status ? 
      { status: status as any } : 
      { status: { in: ['PENDING', 'PROCESSING'] } };

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        questionnaireData: true,
        screenshotUrl: true,
        riskManagementPlan: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      users,
      count: users.length,
    };

  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: 'Failed to fetch users'
    };
  }
}

export async function fetchUserById(id: string): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        questionnaireData: true,
        screenshotUrl: true,
        riskManagementPlan: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      error: 'Failed to fetch user'
    };
  }
}
