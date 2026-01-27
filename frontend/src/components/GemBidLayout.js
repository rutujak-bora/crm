import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGemBidAuth } from "../context/GemBidAuthContext";
import { Button } from "../components/ui/button";
import { Gavel, PlusCircle, Archive, LogOut, Home, ShoppingCart } from "lucide-react";

const GemBidLayout = ({ children }) => {
  const { user, logout } = useGemBidAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { path: "/gem-bid", label: "New Bid", icon: PlusCircle },
    { path: "/gem-bid/all", label: "All Bid", icon: Archive },
    { path: "/gem-bid/orders", label: "Order", icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Gavel size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">GEM BID CRM</h1>
                <p className="text-emerald-200 text-xs">Government e-Marketplace</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-emerald-200 text-sm hidden sm:block">
                Welcome, {user?.name || "User"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-emerald-200 hover:text-white hover:bg-white/10"
              >
                <Home size={18} className="mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-emerald-200 hover:text-white hover:bg-white/10"
                data-testid="gem-logout-btn"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${isActive
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                    : "border-transparent text-slate-600 hover:text-emerald-700 hover:border-emerald-300"
                    }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default GemBidLayout;
