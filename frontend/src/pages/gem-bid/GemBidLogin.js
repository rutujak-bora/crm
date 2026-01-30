import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGemBidAuth } from "../../context/GemBidAuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ArrowLeft, Gavel } from "lucide-react";

const GemBidLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useGemBidAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/gem-bid");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      toast.error("Session expired. Please login again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Welcome to GEM BID CRM!");
      navigate("/gem-bid");
    } catch (error) {
      const message = error.response?.data?.detail || "Invalid credentials";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white relative flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Left decoration */}
      <div className="hidden lg:block absolute left-0 top-0 w-1/3 h-full bg-gradient-to-br from-emerald-700 to-emerald-900">
        <div className="flex flex-col justify-center h-full px-12 text-white">
          <h2 className="text-4xl font-bold mb-4">GEM BID CRM</h2>
          <p className="text-emerald-200 text-lg">
            Government e-Marketplace Bid Management System for tracking and managing your GEM bids efficiently.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-emerald-100">Bid Lifecycle Tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-emerald-100">Status History Management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-emerald-100">Document Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 lg:left-[36%] text-slate-600 hover:text-slate-800 hover:bg-slate-100"
        data-testid="back-to-landing"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Home
      </Button>

      <Card className="w-full max-w-md relative z-10 bg-white border-slate-200 shadow-xl animate-fade-in lg:ml-auto lg:mr-24">
        <CardHeader className="text-center space-y-1 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
            <Gavel className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            GEM BID CRM
          </CardTitle>
          <CardDescription className="text-slate-500">
            Enter your credentials to access GEM Bid management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="yash.b@bora.tech"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                  data-testid="gem-login-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                  data-testid="gem-login-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-300"
              data-testid="gem-login-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In to GEM BID
                  <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GemBidLogin;
