import React, { useState, useEffect } from 'react';
import { MessageSquare, User, Clock, AlertCircle } from 'lucide-react';

interface LiveChat {
  chatId: string;
  userId: string;
  userName: string;
  query: string;
  messages: any[];
  timestamp: string;
  status: 'active' | 'waiting' | 'resolved';
  priority: 'high' | 'medium' | 'low';
}

const TransferredQueries = () => {
  const [transferredChats, setTransferredChats] = useState<LiveChat[]>([]);

  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem('admin_transferred_chats') || '[]');
    setTransferredChats(savedChats);
  }, []);

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 animate-fade-in-up">
      <h3 className="text-xl font-bold text-white mb-4">Transferred Queries</h3>
      <div className="space-y-4">
        {transferredChats.length > 0 ? (
          transferredChats.map(chat => (
            <div key={chat.chatId} className="bg-gray-900/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-semibold">{chat.userName}</span>
                  {chat.priority === 'high' && (
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-300 border border-red-400/30">
                      High Priority
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(chat.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-gray-300 mt-2">{chat.query}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
            <p>No transferred queries.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferredQueries;
