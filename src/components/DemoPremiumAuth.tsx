import { AuthForm } from './ui/premium-auth';

const DemoPremiumAuth = () => {
  const handleAuthSuccess = (userData: { email: string; name?: string }) => {
    console.log('Authentication successful:', userData);
    alert(`Welcome ${userData.name || userData.email}!`);
  };

  const handleAuthClose = () => {
    console.log('Auth form closed');
    alert('Authentication cancelled');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Premium Auth Demo</h1>
          <p className="text-gray-400">Experience our enhanced authentication system</p>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
          <AuthForm
            onSuccess={handleAuthSuccess}
            onClose={handleAuthClose}
            className="bg-transparent border-0"
          />
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>This demo showcases the premium authentication UI with:</p>
          <ul className="mt-2 space-y-1">
            <li>• Real-time form validation</li>
            <li>• Password strength indicators</li>
            <li>• Multi-step signup flow</li>
            <li>• Responsive design</li>
            <li>• Accessibility features</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export { DemoPremiumAuth };
