// Mock Authentication - Immediate Login Fix
// This will make login work immediately without any backend

export const mockLogin = async (email: string, password: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Always return success for any credentials
  const mockUser = {
    id: 'mock-user-1',
    email: email,
    username: email.split('@')[0],
    plan_type: 'professional',
    membershipTier: 'professional',
    setupComplete: true,
    accountType: 'personal',
    riskTolerance: 'moderate',
    isAuthenticated: true
  };
  
  const mockToken = btoa(JSON.stringify({
    sub: mockUser.id,
    username: mockUser.username,
    email: mockUser.email,
    plan_type: mockUser.plan_type,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  }));
  
  return {
    success: true,
    access_token: mockToken,
    user: mockUser
  };
};

export const mockRegister = async (email: string, password: string, username: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockUser = {
    id: 'mock-user-' + Date.now(),
    email: email,
    username: username,
    plan_type: 'professional',
    membershipTier: 'professional'
  };
  
  const mockToken = btoa(JSON.stringify({
    sub: mockUser.id,
    username: mockUser.username,
    email: mockUser.email,
    plan_type: mockUser.plan_type,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  }));
  
  return {
    success: true,
    access_token: mockToken,
    user: mockUser
  };
};
