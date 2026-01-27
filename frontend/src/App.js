import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GemBidAuthProvider, useGemBidAuth } from "./context/GemBidAuthContext";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";
import GemBidLayout from "./components/GemBidLayout";

// Landing Page
import LandingPage from "./pages/LandingPage";

// CRM Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerForm from "./pages/CustomerForm";
import Leads from "./pages/Leads";
import LeadForm from "./pages/LeadForm";
import LeadDetail from "./pages/LeadDetail";
import ProformaInvoices from "./pages/ProformaInvoices";
import ProformaInvoiceDetail from "./pages/ProformaInvoiceDetail";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderForm from "./pages/PurchaseOrderForm";
import PurchaseOrderDetail from "./pages/PurchaseOrderDetail";
import MarginCalculator from "./pages/MarginCalculator";

// GEM BID CRM Pages
import GemBidLogin from "./pages/gem-bid/GemBidLogin";
import NewBids from "./pages/gem-bid/NewBids";
import AllBids from "./pages/gem-bid/AllBids";
import BidForm from "./pages/gem-bid/BidForm";
import BidDetail from "./pages/gem-bid/BidDetail";
import Orders from "./pages/gem-bid/Orders";
import OrderForm from "./pages/gem-bid/OrderForm";

// CRM Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?expired=true" replace />;
  }

  return <Layout>{children}</Layout>;
};

// GEM BID Protected Route
const GemBidProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useGemBidAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/gem-bid/login?expired=true" replace />;
  }

  return <GemBidLayout>{children}</GemBidLayout>;
};

function App() {
  return (
    <AuthProvider>
      <GemBidAuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* CRM Login */}
            <Route path="/login" element={<Login />} />

            {/* CRM Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/customers/new" element={<ProtectedRoute><CustomerForm /></ProtectedRoute>} />
            <Route path="/customers/:id/edit" element={<ProtectedRoute><CustomerForm /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/leads/new" element={<ProtectedRoute><LeadForm /></ProtectedRoute>} />
            <Route path="/leads/:id/edit" element={<ProtectedRoute><LeadForm /></ProtectedRoute>} />
            <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
            <Route path="/proforma-invoices" element={<ProtectedRoute><ProformaInvoices /></ProtectedRoute>} />
            <Route path="/proforma-invoices/:id" element={<ProtectedRoute><ProformaInvoiceDetail /></ProtectedRoute>} />
            <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
            <Route path="/purchase-orders/new" element={<ProtectedRoute><PurchaseOrderForm /></ProtectedRoute>} />
            <Route path="/purchase-orders/:id/edit" element={<ProtectedRoute><PurchaseOrderForm /></ProtectedRoute>} />
            <Route path="/purchase-orders/:id" element={<ProtectedRoute><PurchaseOrderDetail /></ProtectedRoute>} />
            <Route path="/margin-calculator" element={<ProtectedRoute><MarginCalculator /></ProtectedRoute>} />

            {/* GEM BID CRM Login */}
            <Route path="/gem-bid/login" element={<GemBidLogin />} />

            {/* GEM BID CRM Protected Routes */}
            <Route path="/gem-bid" element={<GemBidProtectedRoute><NewBids /></GemBidProtectedRoute>} />
            <Route path="/gem-bid/all" element={<GemBidProtectedRoute><AllBids /></GemBidProtectedRoute>} />
            <Route path="/gem-bid/new" element={<GemBidProtectedRoute><BidForm /></GemBidProtectedRoute>} />
            <Route path="/gem-bid/edit/:id" element={<GemBidProtectedRoute><BidForm /></GemBidProtectedRoute>} />
            <Route path="/gem-bid/view/:id" element={<GemBidProtectedRoute><BidDetail /></GemBidProtectedRoute>} />
            <Route path="/gem-bid/orders" element={<GemBidProtectedRoute><Orders /></GemBidProtectedRoute>} />
            <Route path="/gem-bid/orders/new" element={<GemBidProtectedRoute><OrderForm /></GemBidProtectedRoute>} />
            <Route path="/gem-bid/orders/edit/:id" element={<GemBidProtectedRoute><OrderForm /></GemBidProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GemBidAuthProvider>
    </AuthProvider>
  );
}

export default App;
