import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import {
  User,
  Mail,
  FileText,
  Shield,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  SkipForward,
  BarChart2,
  Camera,
  ClipboardList,
  ArrowLeft
} from 'lucide-react';

const InfoCard = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/20">
    <h2 className="text-xl font-bold text-cyan-100 mb-4 flex items-center gap-2">
      {icon}
      {title}
    </h2>
    <div className="text-gray-300 space-y-2">{children}</div>
  </div>
);

const CustomerDetail = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };
        const res = await api.get(`/api/customers/${id}`, config);
        setCustomer(res.data.customer);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch customer data');
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">{error}</div>;
  }

  if (!customer) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">No customer data found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
      <div className="mb-8">
        <Link to="/customer-service" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">User Detail</h1>
      <p className="text-lg text-gray-400 mb-8">{customer.uniqueId}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard title="User Information" icon={<User className="w-6 h-6 text-cyan-400" />}>
          <p><strong>Name:</strong> {customer.name}</p>
          <p><strong>Email:</strong> {customer.email}</p>
        </InfoCard>

        <InfoCard title="Uploaded Screenshots" icon={<Camera className="w-6 h-6 text-cyan-400" />}>
          {customer.screenshots?.length > 0 ? (
            customer.screenshots.map((s: any) => <div key={s._id}><a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{s.url}</a></div>)
          ) : (
            <p>No screenshots uploaded.</p>
          )}
        </InfoCard>

        <InfoCard title="Questionnaire Responses" icon={<ClipboardList className="w-6 h-6 text-cyan-400" />}>
          {customer.questionnaireResponses?.length > 0 ? (
            customer.questionnaireResponses.map((r: any) => <div key={r._id}>{r.response}</div>)
          ) : (
            <p>No questionnaire responses.</p>
          )}
        </InfoCard>

        <InfoCard title="Risk Management Plan" icon={<Shield className="w-6 h-6 text-cyan-400" />}>
          {customer.riskManagementPlan ? (
            <div>{customer.riskManagementPlan.details}</div>
          ) : (
            <p>No risk management plan found.</p>
          )}
        </InfoCard>

        <InfoCard title="Chat with AI History" icon={<MessageSquare className="w-6 h-6 text-cyan-400" />}>
          <p>Placeholder for chat history.</p>
        </InfoCard>

        <InfoCard title="Winning Trades" icon={<TrendingUp className="w-6 h-6 text-green-400" />}>
          <p>Placeholder for winning trades.</p>
        </InfoCard>

        <InfoCard title="Losing Trades" icon={<TrendingDown className="w-6 h-6 text-red-400" />}>
          <p>Placeholder for losing trades.</p>
        </InfoCard>

        <InfoCard title="Skipped Trades" icon={<SkipForward className="w-6 h-6 text-yellow-400" />}>
          <p>Placeholder for skipped trades.</p>
        </InfoCard>

        <InfoCard title="Account Performance" icon={<BarChart2 className="w-6 h-6 text-blue-400" />}>
          <p>Placeholder for account performance.</p>
        </InfoCard>

        <InfoCard title="User Activity" icon={<FileText className="w-6 h-6 text-purple-400" />}>
          {customer.activities?.length > 0 ? (
            <ul className="space-y-2">
              {customer.activities.map((a: any) => (
                <li key={a._id} className="p-2 bg-gray-700/50 rounded-md">
                  <p className="font-semibold">{a.activity_type}</p>
                  <p className="text-sm">{a.activity_details}</p>
                  <p className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No activities recorded.</p>
          )}
        </InfoCard>
      </div>
    </div>
  );
};

export default CustomerDetail;
