import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useGemBidAuth } from "../../context/GemBidAuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Gavel } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api/gem-bid";

const STATUSES = [
  "Shortlisted",
  "Participated",
  "Technical Evaluation",
  "RA",
  "Rejected",
  "Bid Awarded",
  "Supply Order Received",
  "Material Procurement",
  "Order Complete"
];

const BidForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useGemBidAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gem_bid_no: "",
    description: "",
    start_date: "",
    end_date: "",
    emd_amount: "",
    quantity: "",
    city: "",
    department: "",
    item_category: "",
    epbg_percentage: "",
    epbg_month: "",
    status: "Shortlisted"
  });

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetchBid();
    }
  }, [id]);

  const fetchBid = async () => {
    try {
      const response = await axios.get(`${API_URL}/bids/${id}`, getAuthHeader());
      const bid = response.data;
      setFormData({
        gem_bid_no: bid.gem_bid_no || "",
        description: bid.description || "",
        start_date: bid.start_date?.split("T")[0] || "",
        end_date: bid.end_date?.split("T")[0] || "",
        emd_amount: bid.emd_amount || "",
        quantity: bid.quantity || "",
        city: bid.city || "",
        department: bid.department || "",
        item_category: bid.item_category || "",
        epbg_percentage: bid.epbg_percentage || "",
        epbg_month: bid.epbg_month || "",
        status: bid.status || "Shortlisted"
      });
    } catch (error) {
      toast.error("Failed to load bid");
      navigate("/gem-bid");
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.gem_bid_no || !formData.start_date || !formData.end_date ||
      !formData.emd_amount || !formData.quantity) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        emd_amount: parseFloat(formData.emd_amount) || 0,
        quantity: parseFloat(formData.quantity) || 0,
        epbg_percentage: formData.epbg_percentage ? parseFloat(formData.epbg_percentage) : null,
        epbg_month: formData.epbg_month ? parseInt(formData.epbg_month) : null
      };

      if (isEdit) {
        await axios.put(`${API_URL}/bids/${id}`, payload, getAuthHeader());
        toast.success("Bid updated successfully");
      } else {
        await axios.post(`${API_URL}/bids`, payload, getAuthHeader());
        toast.success("Bid created successfully");
      }
      navigate("/gem-bid");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="bid-form-page">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/gem-bid")}
          className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          data-testid="back-btn"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? "Edit Bid" : "New Bid"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? "Update bid details" : "Create a new GEM bid entry"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <Gavel size={20} />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800">Basic Information</CardTitle>
                <CardDescription className="text-slate-500">
                  Enter the primary bid details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Gem Bid No *</Label>
                <Input
                  value={formData.gem_bid_no}
                  onChange={(e) => handleChange("gem_bid_no", e.target.value)}
                  placeholder="GEM/2024/B/001"
                  className="bg-white border-slate-300"
                  required
                  data-testid="gem-bid-no-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger className="bg-white border-slate-300" data-testid="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter bid description..."
                className="bg-white border-slate-300 min-h-[100px]"
                data-testid="description-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  className="bg-white border-slate-300"
                  required
                  data-testid="start-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange("end_date", e.target.value)}
                  className="bg-white border-slate-300"
                  required
                  data-testid="end-date-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">EMD Amount (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.emd_amount}
                  onChange={(e) => handleChange("emd_amount", e.target.value)}
                  placeholder="50000"
                  className="bg-white border-slate-300"
                  required
                  data-testid="emd-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Quantity *</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  placeholder="100"
                  className="bg-white border-slate-300"
                  required
                  data-testid="quantity-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details Card */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Additional Details</CardTitle>
            <CardDescription className="text-slate-500">
              Optional bid information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Delhi"
                  className="bg-white border-slate-300"
                  data-testid="city-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="Ministry of Finance"
                  className="bg-white border-slate-300"
                  data-testid="department-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Item Category</Label>
              <Input
                value={formData.item_category}
                onChange={(e) => handleChange("item_category", e.target.value)}
                placeholder="Electronics"
                className="bg-white border-slate-300"
                data-testid="item-category-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">EPBG Percentage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.epbg_percentage}
                  onChange={(e) => handleChange("epbg_percentage", e.target.value)}
                  placeholder="5"
                  className="bg-white border-slate-300"
                  data-testid="epbg-percentage-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">EPBG Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.epbg_month}
                  onChange={(e) => handleChange("epbg_month", e.target.value)}
                  placeholder="12"
                  className="bg-white border-slate-300"
                  data-testid="epbg-month-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/gem-bid")}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
            data-testid="cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="save-btn"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={16} />
                {isEdit ? "Update" : "Create"} Bid
              </span>
            )}
          </Button>
        </div>
      </form>
    </div >
  );
};

export default BidForm;
