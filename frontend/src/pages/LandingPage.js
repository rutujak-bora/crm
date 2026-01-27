import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Building2, Gavel, ArrowRight } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Bora Tech CRM
          </h1>
          <p className="text-slate-400 text-lg">
            Choose your system to continue
          </p>
        </div>

        {/* System Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* CRM System Card */}
          <Card className="bg-slate-800/50 border-slate-700 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate("/login")}
                data-testid="crm-system-card">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">CRM System</CardTitle>
              <CardDescription className="text-slate-400">
                Customer Relationship Management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Customer Management
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Lead & Enquiry Tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Proforma Invoices
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Purchase Orders
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Margin Calculator
                </li>
              </ul>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all">
                <span className="flex items-center gap-2">
                  Login to CRM
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* GEM BID CRM Card */}
          <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate("/gem-bid/login")}
                data-testid="gem-bid-card">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                <Gavel className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">GEM BID CRM</CardTitle>
              <CardDescription className="text-slate-400">
                Government e-Marketplace Bid Management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  GEM Bid Creation & Tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Status Lifecycle Management
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Document Upload & Storage
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Excel Bulk Upload
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Completed Bids Archive
                </li>
              </ul>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all">
                <span className="flex items-center gap-2">
                  Login to GEM BID
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 text-sm">
          © 2024 Bora Tech. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
