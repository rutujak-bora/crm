import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useGemBidAuth } from "../../context/GemBidAuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, ShoppingCart } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api/gem-bid";

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useGemBidAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [bids, setBids] = useState([]);
  const [formData, setFormData] = useState({
    gem_bid_no: "",
    sku: "",
    vendor: "",
    price: "",
    quantity: "",
    invoice_value: "",
    advance_paid: "",
    date: new Date().toISOString().split("T")[0],
    delivery_date: ""
  });

  const [remainingAmount, setRemainingAmount] = useState(0);

  useEffect(() => {
    fetchCompletedBids();
    if (isEdit) {
      fetchOrder();
    }
  }, [id]);

  useEffect(() => {
    const invoice = parseFloat(formData.invoice_value) || 0;
    const advance = parseFloat(formData.advance_paid) || 0;
    setRemainingAmount(invoice - advance);
  }, [formData.invoice_value, formData.advance_paid]);

  const fetchCompletedBids = async () => {
    try {
      const response = await axios.get(`${API_URL}/bids/completed`, getAuthHeader());
      setBids(response.data);
    } catch (error) {
      toast.error("Failed to load completed bids");
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/orders/${id}`, getAuthHeader());
      const data = response.data;
      setFormData({
        gem_bid_no: data.gem_bid_no,
        sku: data.sku,
        vendor: data.vendor,
        price: data.price.toString(),
        quantity: data.quantity.toString(),
        invoice_value: data.invoice_value.toString(),
        advance_paid: data.advance_paid.toString(),
        date: data.date,
        delivery_date: data.delivery_date
      });
    } catch (error) {
      toast.error("Failed to load order details");
      navigate("/gem-bid/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.gem_bid_no) {
      toast.error("Please select a Bid No");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity),
        invoice_value: parseFloat(formData.invoice_value),
        advance_paid: parseFloat(formData.advance_paid)
      };

      if (isEdit) {
        await axios.put(`${API_URL}/orders/${id}`, payload, getAuthHeader());
        toast.success("Order updated successfully");
      } else {
        await axios.post(`${API_URL}/orders`, payload, getAuthHeader());
        toast.success("Order created successfully");
      }
      navigate("/gem-bid/orders");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save order");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, gem_bid_no: value }));
  };

  if (loading && bids.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/gem-bid/orders")}
          className="text-slate-600"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isEdit ? "Edit Order" : "New Order"}
          </h2>
          <p className="text-slate-500">
            {isEdit ? "Update order details" : "Create a new order for a completed bid"}
          </p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
              <ShoppingCart size={20} />
            </div>
            <div>
              <CardTitle className="text-lg">Order Information</CardTitle>
              <CardDescription>All fields are required except where noted</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bid No (Dropdown) */}
              <div className="space-y-2">
                <Label htmlFor="gem_bid_no">Bid No*</Label>
                <Select
                  value={formData.gem_bid_no}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger id="gem_bid_no" className="bg-white border-slate-300">
                    <SelectValue placeholder="Select a Bid No" />
                  </SelectTrigger>
                  <SelectContent>
                    {bids.map((bid) => (
                      <SelectItem key={bid.id} value={bid.gem_bid_no}>
                        {bid.gem_bid_no}
                      </SelectItem>
                    ))}
                    {bids.length === 0 && (
                      <SelectItem value="none" disabled>No completed bids found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku">SKU*</Label>
                <Input
                  id="sku"
                  name="sku"
                  placeholder="Enter SKU"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Vendor */}
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor*</Label>
                <Input
                  id="vendor"
                  name="vendor"
                  placeholder="Enter Vendor Name"
                  value={formData.vendor}
                  onChange={handleChange}
                  required
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price*</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity*</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Invoice Value */}
              <div className="space-y-2">
                <Label htmlFor="invoice_value">Invoice Value*</Label>
                <Input
                  id="invoice_value"
                  name="invoice_value"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.invoice_value}
                  onChange={handleChange}
                  required
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Advance Paid */}
              <div className="space-y-2">
                <Label htmlFor="advance_paid">Advance Paid*</Label>
                <Input
                  id="advance_paid"
                  name="advance_paid"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.advance_paid}
                  onChange={handleChange}
                  required
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Remaining Amount (Auto) */}
              <div className="space-y-2">
                <Label htmlFor="remaining_amount">Remaining Amount (Auto)</Label>
                <Input
                  id="remaining_amount"
                  value={remainingAmount.toFixed(2)}
                  readOnly
                  disabled
                  className="bg-slate-100 border-slate-300 font-mono"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date*</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Delivery Date */}
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date*</Label>
                <Input
                  id="delivery_date"
                  name="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={handleChange}
                  required
                  className="bg-white border-slate-300"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/gem-bid/orders")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                <Save size={18} className="mr-2" />
                {isEdit ? "Update Order" : "Save Order"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderForm;
