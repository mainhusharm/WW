import { useState, useEffect } from 'react';
import axios from 'axios';

const EnhancedCustomerServiceDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [queries, setQueries] = useState([]);
  const [activeTab, setActiveTab] = useState('tickets');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get('/api/tickets');
        setTickets(response.data);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    const fetchQueries = async () => {
      try {
        const response = await axios.get('/api/queries');
        setQueries(response.data);
      } catch (error) {
        console.error('Error fetching queries:', error);
      }
    };

    if (activeTab === 'tickets') {
      fetchTickets();
    } else {
      fetchQueries();
    }
  }, [activeTab]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Service Dashboard</h1>
      <div className="flex border-b">
        <button
          className={`py-2 px-4 ${activeTab === 'tickets' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          Tickets
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'queries' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('queries')}
        >
          Queries
        </button>
      </div>
      <div className="mt-4">
        {activeTab === 'tickets' ? (
          <div>
            <h2 className="text-xl font-semibold mb-2">Tickets</h2>
            <ul>
              {tickets.map((ticket) => (
                <li key={ticket._id} className="border p-2 mb-2 rounded">
                  <p><strong>Subject:</strong> {ticket.subject}</p>
                  <p><strong>Description:</strong> {ticket.description}</p>
                  <p><strong>Status:</strong> {ticket.status}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-2">Queries</h2>
            <ul>
              {queries.map((query) => (
                <li key={query._id} className="border p-2 mb-2 rounded">
                  <p><strong>Name:</strong> {query.name}</p>
                  <p><strong>Email:</strong> {query.email}</p>
                  <p><strong>Message:</strong> {query.message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCustomerServiceDashboard;
