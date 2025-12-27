interface SendWelcomeEmailParams {
  email: string;
  userName: string;
}

interface SendAuthEmailParams {
  email: string;
  ipAddress?: string;
  location?: string;
}

export async function sendWelcomeEmail({ email, userName }: SendWelcomeEmailParams) {
  const response = await fetch('/api/email/welcome', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, userName }),
  });

  if (!response.ok) {
    throw new Error('Failed to send welcome email');
  }

  return response.json();
}

export async function sendAuthEmail({ email, ipAddress, location }: SendAuthEmailParams) {
  const response = await fetch('/api/email/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, ipAddress, location }),
  });

  if (!response.ok) {
    throw new Error('Failed to send authentication email');
  }

  return response.json();
}
