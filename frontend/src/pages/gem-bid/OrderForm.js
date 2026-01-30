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
import { ArrowLeft, Save, ShoppingCart, Plus, Trash2 } from "lucide-react";

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
    items: []
  });

  useEffect(() => {
    fetchCompletedBids();
    if (isEdit) {
      fetchOrder();
    } else {
      // Add initial item for new order
      addItem();
    }
  }, [id]);

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
        items: data.items.map(item => ({
          sku: item.sku,
          vendor: item.vendor,
          price: item.price.toString(),
          quantity: item.quantity.toString(),
          invoice_value: item.invoice_value.toString(),
          advance_paid: item.advance_paid.toString(),
          date: item.date,
          delivery_date: item.delivery_date
        }))
      });
    } catch (error) {
      toast.error("Failed to load order details");
      navigate("/gem-bid/orders");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sku: "",
          vendor: "",
          price: "",
          quantity: "",
          invoice_value: "",
          advance_paid: "",
          date: new Date().toISOString().split("T")[0],
          delivery_date: ""
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      toast.error("At least one SKU is required");
      return;
    }
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto calculate invoice value if price or quantity changes
    if (field === "price" || field === "quantity") {
      const price = parseFloat(newItems[index].price) || 0;
      const quantity = parseFloat(newItems[index].quantity) || 0;
      newItems[index].invoice_value = (price * quantity).toFixed(2);
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.gem_bid_no) {
      toast.error("Please select a Bid No");
      return;
    }

    if (formData.items.length === 0) {
      toast.error("Please add at least one SKU");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        gem_bid_no: formData.gem_bid_no,
        items: formData.items.map(item => ({
          ...item,
          price: parseFloat(item.price) || 0,
          quantity: parseFloat(item.quantity) || 0,
          invoice_value: parseFloat(item.invoice_value) || 0,
          advance_paid: parseFloat(item.advance_paid) || 0
        }))
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

  if (loading && bids.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <ShoppingCart size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">Order Details</CardTitle>
                <CardDescription>Select Bid and add SKUs</CardDescription>
              </div>
            </div>
            <Button
              type="button"
              onClick={addItem}
              className="bg-blue-600 hover:bg-blue-700 h-9"
            >
              <Plus size={16} className="mr-2" />
              Add SKU
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Bid Selection */}
            <div className="max-w-md space-y-2">
              <Label htmlFor="gem_bid_no">Bid No*</Label>
              <Select
                value={formData.gem_bid_no}
                onValueChange={(val) => setFormData(prev => ({ ...prev, gem_bid_no: val }))}
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

            {/* SKUs List */}
            <div className="space-y-6">
              {formData.items.map((item, index) => (
                <div key={index} className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 relative">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <h3 className="font-semibold text-slate-700">SKU {index + 1}</h3>
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>SKU*</Label>
                      <Input
                        placeholder="SKU Code"
                        value={item.sku}
                        onChange={(e) => handleItemChange(index, "sku", e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor*</Label>
                      <Input
                        placeholder="Vendor Name"
                        value={item.vendor}
                        onChange={(e) => handleItemChange(index, "vendor", e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price*</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, "price", e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity*</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Value</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={item.invoice_value}
                        readOnly
                        disabled
                        className="bg-slate-100 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Advance Paid*</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={item.advance_paid}
                        onChange={(e) => handleItemChange(index, "advance_paid", e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Remaining Amount</Label>
                      <Input
                        value={((parseFloat(item.invoice_value) || 0) - (parseFloat(item.advance_paid) || 0)).toFixed(2)}
                        readOnly
                        disabled
                        className="bg-slate-100 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date*</Label>
                      <Input
                        type="date"
                        value={item.date}
                        onChange={(e) => handleItemChange(index, "date", e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery Date</Label>
                      <Input
                        type="date"
                        value={item.delivery_date}
                        onChange={(e) => handleItemChange(index, "delivery_date", e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t flex justify-end gap-4">
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
