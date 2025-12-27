'use client';

import { useState } from 'react';
import { sendWelcomeEmail, sendAuthEmail } from '../lib/email-service';

export default function EmailExample() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSendWelcomeEmail = async () => {
    setLoading(true);
    try {
      const response = await sendWelcomeEmail({
        email: 'user@example.com',
        userName: 'John Doe'
      });
      setResult(`Welcome email sent! Message ID: ${response.messageId}`);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAuthEmail = async () => {
    setLoading(true);
    try {
      const response = await sendAuthEmail({
        email: 'user@example.com',
        ipAddress: '192.168.1.1',
        location: 'New York, USA'
      });
      setResult(`Auth email sent! Message ID: ${response.messageId}`);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Email Service Test</h2>

      <div className="space-y-4">
        <button
          onClick={handleSendWelcomeEmail}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Welcome Email'}
        </button>

        <button
          onClick={handleSendAuthEmail}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Auth Email'}
        </button>

        {result && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-700">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
