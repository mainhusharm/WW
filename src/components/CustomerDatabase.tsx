import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Database, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../api';

interface Activity {
  _id: string;
  activity_type: string;
  activity_details: string;
  timestamp: string;
}

interface Customer {
  uniqueId: string;
  email: string;
  activities: Activity[];
}

const CustomerDatabase = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [openCustomerId, setOpenCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };
        const res = await api.get('/api/customers', config);
        setCustomers(res.data.customers);
      } catch (err) {
        setError('Failed to fetch customer data');
      }
    };

    fetchCustomerData();
  }, []);

  const toggleCustomerDetails = (id: string) => {
    if (openCustomerId === id) {
      setOpenCustomerId(null);
    } else {
      setOpenCustomerId(id);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/20">
        <h3 className="text-xl font-bold text-cyan-100 mb-6 flex items-center gap-2">
          <Database className="w-6 h-6 text-cyan-400" />
          Customer Database
        </h3>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 bg-gray-700/50 border border-cyan-400/30 rounded-xl w-full text-white placeholder-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
              <tr>
                <th scope="col" className="px-4 py-3"></th>
                <th scope="col" className="px-4 py-3">Unique ID</th>
                <th scope="col" className="px-4 py-3">Email Address</th>
                <th scope="col" className="px-4 py-3">Activity Count</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(user => (
                <>
                  <tr key={user.uniqueId} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer" onClick={() => toggleCustomerDetails(user.uniqueId)}>
                    <td className="px-4 py-3">
                      {openCustomerId === user.uniqueId ? <ChevronDown /> : <ChevronRight />}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      <Link to={`/customer-service/customer/${user.uniqueId}`} className="hover:underline">
                        {user.uniqueId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.activities.length}</td>
                  </tr>
                  {openCustomerId === user.uniqueId && (
                    <tr>
                      <td colSpan={4} className="p-4 bg-gray-900/50">
                        <h4 className="text-lg font-bold text-cyan-200 mb-4">Activity Log</h4>
                        <ul className="space-y-2">
                          {user.activities.map(activity => (
                            <li key={activity._id} className="p-3 bg-gray-800/60 rounded-lg">
                              <p className="font-semibold text-white">{activity.activity_type}</p>
                              <p className="text-sm text-gray-300">{activity.activity_details}</p>
                              <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDatabase;
