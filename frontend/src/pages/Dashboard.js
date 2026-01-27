import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, ClipboardList, FileText, ShoppingCart, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const Dashboard = () => {
  const { getAuthHeader } = useAuth();
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPI();
  }, []);

  const fetchKPI = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/kpi`, getAuthHeader());
      setKpi(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: "Total Customers",
      value: kpi?.total_customers || 0,
      icon: Users,
      color: "indigo",
      description: "Registered customers"
    },
    {
      title: "Active Leads",
      value: kpi?.active_leads || 0,
      icon: ClipboardList,
      color: "blue",
      description: "Pending enquiries"
    },
    {
      title: "Proforma Invoices",
      value: kpi?.total_proforma_invoices || 0,
      icon: FileText,
      color: "teal",
      description: "Sales orders"
    },
    {
      title: "Purchase Orders",
      value: kpi?.total_purchase_orders || 0,
      icon: ShoppingCart,
      color: "purple",
      description: "Active orders"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      indigo: { icon: "bg-indigo-100 text-indigo-600", accent: "text-indigo-600" },
      blue: { icon: "bg-blue-100 text-blue-600", accent: "text-blue-600" },
      teal: { icon: "bg-teal-100 text-teal-600", accent: "text-teal-600" },
      purple: { icon: "bg-purple-100 text-purple-600", accent: "text-purple-600" },
      emerald: { icon: "bg-emerald-100 text-emerald-600", accent: "text-emerald-600" }
    };
    return colors[color] || colors.indigo;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your CRM metrics</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = getColorClasses(card.color);
          return (
            <Card
              key={index}
              className="kpi-card bg-white border-slate-200"
              data-testid={`kpi-card-${index}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  {card.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl ${colorClasses.icon}`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold text-slate-800`}>
                  {card.value}
                </div>
                <p className="text-sm text-slate-400 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Margin Summary - Full Width Accent Card */}
      <Card
        className="kpi-card bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 text-white"
        data-testid="kpi-card-margin"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-emerald-100 uppercase tracking-wider">
            Margin Summary
          </CardTitle>
          <div className="p-2.5 rounded-xl bg-white/20">
            <TrendingUp size={20} strokeWidth={2} className="text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-white">
            ₹{(kpi?.margin_summary || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-sm text-emerald-100 mt-2">
            Total calculated margin from linked proforma invoices and purchase orders
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Conversion Rate</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {kpi?.active_leads > 0 
              ? `${Math.round((kpi?.total_proforma_invoices / (kpi?.active_leads + kpi?.total_proforma_invoices)) * 100)}%`
              : "0%"
            }
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Avg Order Value</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {kpi?.total_purchase_orders > 0 ? "Active" : "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Active Pipeline</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{kpi?.active_leads || 0} leads</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">System Status</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">Online</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
