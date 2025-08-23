import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { Shield, Lock } from 'lucide-react';

const UserScreenshotTab: React.FC = () => {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchScreenshot = async () => {
      if (!user?.email) {
        setError('User not logged in.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/screenshot/${user.email}`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });
        setScreenshotUrl(response.data.url);
      } catch (err) {
        setError('Could not fetch screenshot.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScreenshot();
  }, [user]);

  return (
    <div className="holo-card p-6">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center">
        <Shield className="w-8 h-8 mr-3" />
        User Screenshot
        <Lock className="w-5 h-5 ml-3 text-yellow-400" />
      </h2>
      <div 
        className="border-2 border-dashed border-cyan-400/50 rounded-lg p-4 text-center bg-gray-900/50"
        style={{ minHeight: '400px' }}
      >
        {isLoading && <p className="text-cyan-300">Loading screenshot...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {screenshotUrl && (
          <img 
            src={screenshotUrl} 
            alt="User Screenshot" 
            className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
          />
        )}
        {!isLoading && !error && !screenshotUrl && (
          <p className="text-gray-400">No screenshot found for this user.</p>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center">
        <Lock className="w-3 h-3 mr-1" /> This screenshot is read-only and cannot be changed from this dashboard.
      </p>
    </div>
  );
};

export default UserScreenshotTab;
