import { useEffect, Suspense, Component, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
// Import CORS fix to apply it globally
// import './utils/corsFix';
// Import real-time data capture
// import './services/realTimeDataCapture';
import LandingPage from './components/LandingPage';
import Enhanced3DLandingPage from './components/Enhanced3DLandingPage';
import ProductionLandingPage from './components/ProductionLandingPage';
import SignUp from './components/SignUp';
import SignIn from './components/SignInFixed';
import MembershipPlans from './components/MembershipPlans';
import PaymentFlow from './components/PaymentFlow';
// PayPalPayment import removed
// StripePayment removed
import PaymentSuccess from './components/PaymentSuccess';
import SuccessfulPaymentPage from './components/SuccessfulPaymentPage';
import MT5BotsPage from './components/MT5BotsPage';
import MT5PaymentPage from './components/MT5PaymentPage';
import MT5BotDashboard from './components/MT5BotDashboard';
import MT5Signup from './components/MT5Signup';
import MT5Signin from './components/MT5Signin';
import MT5CustomerServiceDashboard from './components/MT5CustomerServiceDashboard';
import MT5AdminDashboard from './components/MT5AdminDashboard';
import FuturesSignalsPage from './components/FuturesSignalsPage';
import Questionnaire from './components/Questionnaire';
import ConsentFormPage from './components/ConsentFormPage';
import PropFirmSelection from './components/PropFirmSelection';
import AccountConfiguration from './components/AccountConfiguration';
import RiskConfiguration from './components/RiskConfiguration';
import TradingPlanGeneration from './components/TradingPlanGenerator';
import RiskManagementPage from './components/RiskManagementPage';
import RiskManagementPlan from './components/RiskManagementPlan';
import ComprehensiveRiskPlan from './components/ComprehensiveRiskPlan';
import UploadScreenshot from './components/UploadScreenshot';
import TradeMentor from './components/TradeMentor';
import Dashboard from './components/Dashboard';
import AdminMpinLogin from './components/AdminMpinLogin';
import AdminDashboard from './components/AdminDashboard';
import AffiliateLinks from './components/AffiliateLinks';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import { SupabaseAuthProvider, useSupabaseAuth } from './contexts/SupabaseAuthContext';
import { TradingPlanProvider, useTradingPlan } from './contexts/TradingPlanContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import SubscriptionProtectedRoute from './components/SubscriptionProtectedRoute';
import { clearState } from './trading/dataStorage';
import Features from './components/Features';
import About from './components/About';
import Terms from './components/Terms';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import FAQ from './components/FAQ';
import { SignalDistributionProvider } from './components/SignalDistributionService';
import AnimationTest from './components/AnimationTest';
import LoadingPage from './components/LoadingPage';

import CustomerServiceMpinLogin from './components/CustomerServiceMpinLogin';
import CustomerServiceProtectedRoute from './components/CustomerServiceProtectedRoute';
import NexusDeskPro from './components/NexusDeskPro';
import CustomerDetail from './components/CustomerDetail';
import ContactSupport from './components/ContactSupport';
import AICoach from './components/AICoach';
import Lightning from './components/Lightning';
import Footer from './components/Footer';
import DatabaseDashboard from './components/DatabaseDashboard';
import EnhancedDatabaseDashboard from './components/EnhancedDatabaseDashboard';
import CustomerServiceDashboard from './components/CustomerServiceDashboard';
import QuantumAdminDashboard from './components/QuantumAdminDashboard';
import SignupForm from './components/SignupForm';
import EnhancedSignupForm from './components/EnhancedSignupForm';
import SignupRedirect from './components/SignupRedirect';
import EnhancedPaymentPage from './components/EnhancedPaymentPage';
import FuturesPage from './components/FuturesPage';

// Global Error Boundary for the entire app
class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Global Error Boundary caught an error:', error, errorInfo);
    
    // Handle specific React errors
    if (error.message.includes('Minified React error #310')) {
      console.error('React Hook Error #310 detected - likely caused by hook usage issues');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-red-400">Something went wrong</h1>
            <p className="text-gray-300 mb-4">
              We encountered an error while loading the application. This might be due to a temporary issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reload Page
            </button>
            <div className="mt-4 text-sm text-gray-400">
              <p>Error: {this.state.error?.message}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent = () => {
  const { signOut: userLogout, user, userProfile } = useSupabaseAuth();
  const { logout: adminLogout } = useAdmin();
  const { resetPlan } = useTradingPlan();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    userLogout();
    resetPlan();
    clearState();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('trading_state_') || key.startsWith('dashboard_data_') || key.startsWith('user_backup_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('user_consent_accepted');
    window.location.href = '/signin';
  };

  const handleAdminLogout = () => {
    adminLogout();
    navigate('/admin');
  };

  useEffect(() => {
    document.body.classList.add('perspective-body');
    return () => {
      document.body.classList.remove('perspective-body');
    };
  }, []);

  // Check if current route is a dashboard route
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/admin/dashboard') ||
                          location.pathname.startsWith('/customer-service/dashboard');

  return (
    <div className="min-h-screen" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/" element={<ProductionLandingPage />} />
          <Route path="/home" element={<ProductionLandingPage />} />
          <Route path="/3d" element={<Enhanced3DLandingPage />} />
          <Route path="/classic" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
        <Route path="/signup-prisma" element={<SignupForm />} />
        <Route path="/signup-enhanced" element={<EnhancedSignupForm />} />
        <Route path="/signup-smart" element={<SignupRedirect />} />
        <Route path="/payment-enhanced" element={<EnhancedPaymentPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/membership" element={<MembershipPlans />} />
        <Route path="/mt5-bots" element={<MT5BotsPage />} />
        <Route path="/mt5-signup" element={<MT5Signup />} />
        <Route path="/mt5-payment" element={<MT5PaymentPage />} />
        <Route path="/mt5-signin" element={<MT5Signin />} />
        <Route path="/mt5-dashboard" element={<MT5BotDashboard />} />
        <Route path="/mt5-customer-service" element={<MT5CustomerServiceDashboard />} />
        <Route path="/mt5-admin" element={<MT5AdminDashboard />} />
        <Route path="/payment-flow" element={<ProtectedRoute><PaymentFlow /></ProtectedRoute>} />
        {/* PayPal payment route removed */}
        {/* Stripe payment route removed */}
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/successful-payment" element={<SuccessfulPaymentPage />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/consent-form" element={<ConsentFormPage />} />
        <Route path="/risk-management" element={<RiskManagementPage />} />
        <Route path="/risk-management-plan" element={<RiskManagementPlan />} />
        <Route path="/comprehensive-risk-plan" element={<ComprehensiveRiskPlan />} />
        <Route path="/upload-screenshot" element={<UploadScreenshot />} />
        <Route path="/setup/prop-firm" element={<PropFirmSelection />} />
        <Route path="/setup/account" element={<AccountConfiguration />} />
        <Route path="/setup/risk" element={<RiskConfiguration />} />
        <Route path="/setup/plan" element={<TradingPlanGeneration />} />
        <Route
          path="/dashboard/:tab"
          element={
            <ErrorBoundary>
              <ProtectedRoute>
                <SubscriptionProtectedRoute>
                  <Dashboard onLogout={handleLogout} />
                </SubscriptionProtectedRoute>
              </ProtectedRoute>
            </ErrorBoundary>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ErrorBoundary>
              <ProtectedRoute>
                <SubscriptionProtectedRoute>
                  <Dashboard onLogout={handleLogout} />
                </SubscriptionProtectedRoute>
              </ProtectedRoute>
            </ErrorBoundary>
          }
        />
        <Route path="/admin" element={<AdminMpinLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard onLogout={handleAdminLogout} />
            </AdminProtectedRoute>
          }
        />
        <Route path="/database" element={<DatabaseDashboard />} />
        <Route path="/affiliate-links" element={<AffiliateLinks />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact-support" element={<ContactSupport />} />
        <Route path="/payment" element={<PaymentFlow />} />
        <Route path="/trade-mentor/:tradeId" element={<TradeMentor />} />
        <Route path="/customer-service" element={<CustomerServiceMpinLogin />} />
        <Route
          path="/customer-service/dashboard"
          element={
            <CustomerServiceProtectedRoute>
              <NexusDeskPro />
            </CustomerServiceProtectedRoute>
          }
        />
        <Route
          path="/customer-service-dashboard"
          element={<CustomerServiceDashboard />}
        />
        <Route
          path="/quantum-admin"
          element={<QuantumAdminDashboard />}
        />
        <Route path="/enhanced-database-dashboard" element={<EnhancedDatabaseDashboard />} />
        <Route path="/user-dashboard" element={<EnhancedDatabaseDashboard />} />
        <Route path="/customer-service-dashboard-final" element={<CustomerServiceDashboard />} />
        <Route path="/dashboard-main-themes" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/quantum-admin-dashboard-final" element={<QuantumAdminDashboard />} />
          <Route
            path="/customer-service/customer/:id"
            element={
              <CustomerServiceProtectedRoute>
                <CustomerDetail />
              </CustomerServiceProtectedRoute>
            }
          />
        <Route path="/ai-coach" element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
        <Route path="/futures" element={<FuturesPage />} />
        <Route path="/futures-signals" element={<FuturesSignalsPage />} />
        <Route path="/lightning" element={<Lightning><LandingPage /></Lightning>} />
        <Route path="/animation-test" element={<AnimationTest />} />
        <Route path="/loading" element={<LoadingPage />} />
        </Routes>
      </Suspense>
      {/* Show footer on all pages except dashboards */}
      {!isDashboardRoute && <Footer />}
      
    </div>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <SignalDistributionProvider>
        <AdminProvider>
          <SupabaseAuthProvider>
            <TradingPlanProvider>
              <Router>
                <AppContent />
              </Router>
            </TradingPlanProvider>
          </SupabaseAuthProvider>
        </AdminProvider>
      </SignalDistributionProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
