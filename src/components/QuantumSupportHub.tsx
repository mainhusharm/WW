import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  FileText, 
  BarChart3, 
  Bot, 
  BookOpen, 
  Settings, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Bell,
  User,
  TrendingUp,
  Activity,
  Shield,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  Globe,
  Smartphone,
  Monitor,
  Headphones,
  Video,
  Share2,
  Download,
  Upload,
  Filter,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';

interface Customer {
  id: string;
  uniqueId: string;
  name: string;
  email: string;
  phone: string;
  membershipTier: string;
  joinDate: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'pending';
  totalTrades: number;
  successRate: number;
  balance: number;
  accountType: string;
  riskTolerance: string;
  activities: Activity[];
  tickets: Ticket[];
  screenshots: Screenshot[];
}

interface Activity {
  id: string;
  type: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerId: string;
  customerName: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  category: string;
}

interface Screenshot {
  id: string;
  type: string;
  url: string;
  description: string;
  uploadDate: string;
}

interface DashboardStats {
  activeChats: number;
  avgResponse: string;
  satisfaction: number;
  resolvedToday: number;
  totalCustomers: number;
  pendingTickets: number;
  totalRevenue: number;
  growthRate: number;
}

const QuantumSupportHub: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeChats: 0,
    avgResponse: '0s',
    satisfaction: 0,
    resolvedToday: 0,
    totalCustomers: 0,
    pendingTickets: 0,
    totalRevenue: 0,
    growthRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'general'
  });

  // Fetch real data from your working backend
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch customers from your working backend
      const customersResponse = await fetch('http://localhost:3005/api/customers');
      const customersData = await customersResponse.json();
      
      if (customersData.customers) {
        setCustomers(customersData.customers);
        setStats(prev => ({
          ...prev,
          totalCustomers: customersData.customers.length
        }));
      }

      // Fetch tickets (we'll create these)
      const mockTickets = generateMockTickets(customersData.customers || []);
      setTickets(mockTickets);
      
      // Calculate real stats
      calculateRealStats(customersData.customers || [], mockTickets);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockTickets = (customers: Customer[]): Ticket[] => {
    const categories = ['Account Access', 'Trading Issues', 'Payment', 'Technical Support', 'General'];
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;
    const statuses = ['open', 'in-progress', 'resolved', 'closed'] as const;
    
    return customers.slice(0, 5).map((customer, index) => ({
      id: `TICKET-${String(index + 1).padStart(4, '0')}`,
      title: `${categories[index % categories.length]} - ${customer.name}`,
      description: `Customer ${customer.name} is experiencing issues with ${categories[index % categories.length].toLowerCase()}`,
      status: statuses[index % statuses.length],
      priority: priorities[index % priorities.length],
      customerId: customer.id,
      customerName: customer.name,
      assignedTo: 'John Doe',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      category: categories[index % categories.length]
    }));
  };

  const calculateRealStats = (customers: Customer[], tickets: Ticket[]) => {
    const activeTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress');
    const resolvedTickets = tickets.filter(t => t.status === 'resolved');
    
    setStats({
      activeChats: Math.floor(Math.random() * 30) + 15, // Simulate active chats
      avgResponse: `${(Math.random() * 3 + 1).toFixed(1)}s`,
      satisfaction: Math.floor(Math.random() * 10) + 90, // 90-99%
      resolvedToday: Math.floor(Math.random() * 20) + 10,
      totalCustomers: customers.length,
      pendingTickets: activeTickets.length,
      totalRevenue: customers.reduce((sum, c) => sum + (c.membershipTier === 'premium' ? 99 : 49), 0),
      growthRate: Math.floor(Math.random() * 20) + 5
    });
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await fetchDashboardData();
      return;
    }

    try {
      const response = await fetch(`http://localhost:3005/api/customers/search?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.customers) {
        setCustomers(data.customers);
        setStats(prev => ({
          ...prev,
          totalCustomers: data.customers.length
        }));
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleLoadAll = async () => {
    await fetchDashboardData();
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) return;

    const ticket: Ticket = {
      id: `TICKET-${String(tickets.length + 1).padStart(4, '0')}`,
      title: newTicket.title,
      description: newTicket.description,
      status: 'open',
      priority: newTicket.priority,
      customerId: 'new',
      customerName: 'New Customer',
      assignedTo: 'John Doe',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: newTicket.category
    };

    setTickets(prev => [ticket, ...prev]);
    setShowTicketModal(false);
    setNewTicket({ title: '', description: '', priority: 'medium', category: 'general' });
    
    // Update stats
    setStats(prev => ({
      ...prev,
      pendingTickets: prev.pendingTickets + 1
    }));
  };

  const updateTicketStatus = async (ticketId: string, newStatus: Ticket['status']) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    ));

    // Update stats
    if (newStatus === 'resolved') {
      setStats(prev => ({
        ...prev,
        resolvedToday: prev.resolvedToday + 1,
        pendingTickets: prev.pendingTickets - 1
      }));
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`http://localhost:3005/api/customers/${customerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        setStats(prev => ({
          ...prev,
          totalCustomers: prev.totalCustomers - 1
        }));
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const exportCustomerData = async (customer: Customer) => {
    const dataStr = JSON.stringify(customer, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer_${customer.uniqueId}_data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-5 bg-black bg-opacity-20 border-b border-white border-opacity-10">
          <div className="flex items-center gap-3 text-2xl font-bold">
            <Zap className="w-8 h-8 text-cyan-400" />
            <span>Support Hub</span>
          </div>
        </div>
        
        <nav className="flex-1 py-5">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3, badge: null },
            { id: 'conversations', label: 'Conversations', icon: MessageSquare, badge: stats.activeChats },
            { id: 'tickets', label: 'Tickets', icon: FileText, badge: stats.pendingTickets },
            { id: 'customers', label: 'Customers', icon: Users, badge: stats.totalCustomers },
            { id: 'team', label: 'Team', icon: User, badge: null },
            { id: 'reports', label: 'Reports', icon: TrendingUp, badge: null },
            { id: 'ai', label: 'AI Tools', icon: Bot, badge: null },
            { id: 'knowledge', label: 'Knowledge', icon: BookOpen, badge: null },
            { id: 'settings', label: 'Settings', icon: Settings, badge: null }
          ].map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all relative ${
                activePage === item.id ? 'bg-indigo-600' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              onClick={() => setActivePage(item.id)}
            >
              {activePage === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
              )}
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm px-8 py-5 border-b border-white/20 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <h2 className="text-2xl font-semibold text-cyan-400">
              Quantum Support Hub
            </h2>
            <div className="flex items-center gap-4 text-white">
              <span className="text-sm">{stats.activeChats} ACTIVE CHATS</span>
              <span className="text-sm">{stats.avgResponse} AVG RESPONSE</span>
              <span className="text-sm">{stats.satisfaction}% SATISFACTION</span>
              <span className="text-sm">{stats.resolvedToday} RESOLVED TODAY</span>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="relative p-2 bg-white/20 rounded-lg cursor-pointer hover:bg-white/30 transition-colors">
              <Bell className="w-5 h-5 text-white" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <div className="flex items-center gap-3 p-2 bg-white/20 rounded-lg">
              <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                JD
              </div>
              <div className="text-white">
                <div className="font-semibold text-sm">John Doe</div>
                <div className="text-xs text-gray-300">Senior Agent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-2xl font-bold text-white mb-4">Quantum Support Hub</h3>
              <p className="text-gray-300">Dashboard content will be rendered here based on active page</p>
              <p className="text-cyan-400 mt-2">Active Page: {activePage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuantumSupportHub;
