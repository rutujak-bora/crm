import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, ShoppingCart, Plus, Trash2 } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const PurchaseOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [formData, setFormData] = useState({
    purchase_order_number: "",
    date: new Date().toISOString().split("T")[0],
    vendor_name: "",
    purpose: "stock_in_sale",
    proforma_invoice_id: "",
    proforma_invoice_number: "",
    products: [{ product: "", category: "", quantity: 0, price: 0, amount: 0 }]
  });

  const isEdit = !!id;

  useEffect(() => {
    fetchProformaInvoices();
    if (isEdit) {
      fetchOrder();
    }
  }, [id]);

  const fetchProformaInvoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/proforma-invoices`, getAuthHeader());
      setProformaInvoices(response.data);
    } catch (error) {
      console.error("Failed to load proforma invoices");
    }
  };

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API_URL}/purchase-orders/${id}`, getAuthHeader());
      const order = response.data;
      setFormData({
        purchase_order_number: order.purchase_order_number || "",
        date: order.date || "",
        vendor_name: order.vendor_name || "",
        purpose: order.purpose || "stock_in_sale",
        proforma_invoice_id: order.proforma_invoice_id || "",
        proforma_invoice_number: order.proforma_invoice_number || "",
        products: order.products?.length > 0 
          ? order.products 
          : [{ product: "", category: "", quantity: 0, price: 0, amount: 0 }]
      });
    } catch (error) {
      toast.error("Failed to load purchase order");
      navigate("/purchase-orders");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePurposeChange = (value) => {
    setFormData({
      ...formData,
      purpose: value,
      proforma_invoice_id: value === "stock_in_sale" ? "" : formData.proforma_invoice_id,
      proforma_invoice_number: value === "stock_in_sale" ? "" : formData.proforma_invoice_number
    });
  };

  const handleProformaChange = (invoiceId) => {
    const invoice = proformaInvoices.find(i => i.id === invoiceId);
    setFormData({
      ...formData,
      proforma_invoice_id: invoiceId,
      proforma_invoice_number: invoice?.proforma_invoice_number || ""
    });
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    
    // Auto-calculate amount
    if (field === "quantity" || field === "price") {
      const qty = field === "quantity" ? parseFloat(value) || 0 : parseFloat(newProducts[index].quantity) || 0;
      const price = field === "price" ? parseFloat(value) || 0 : parseFloat(newProducts[index].price) || 0;
      newProducts[index].amount = qty * price;
    }
    
    setFormData({ ...formData, products: newProducts });
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { product: "", category: "", quantity: 0, price: 0, amount: 0 }]
    });
  };

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      const newProducts = formData.products.filter((_, i) => i !== index);
      setFormData({ ...formData, products: newProducts });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.purpose === "linked" && !formData.proforma_invoice_id) {
      toast.error("Please select a Proforma Invoice");
      return;
    }

    if (!formData.products.some(p => p.product && p.quantity > 0)) {
      toast.error("Please add at least one product with quantity");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        products: formData.products.filter(p => p.product).map(p => ({
          ...p,
          quantity: parseFloat(p.quantity) || 0,
          price: parseFloat(p.price) || 0
        }))
      };

      if (isEdit) {
        await axios.put(`${API_URL}/purchase-orders/${id}`, payload, getAuthHeader());
        toast.success("Purchase Order updated");
      } else {
        await axios.post(`${API_URL}/purchase-orders`, payload, getAuthHeader());
        toast.success("Purchase Order created");
      }
      navigate("/purchase-orders");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save purchase order");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.products.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="po-form-page">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/purchase-orders")}
          className="text-slate-400 hover:text-slate-200"
          data-testid="back-btn"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">
            {isEdit ? "Edit Purchase Order" : "New Purchase Order"}
          </h1>
          <p className="text-slate-400 mt-1">
            {isEdit ? "Update purchase order details" : "Create a new purchase order"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <ShoppingCart size={20} />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-100">Order Details</CardTitle>
                <CardDescription className="text-slate-500">
                  Basic purchase order information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="purchase_order_number" className="text-slate-300">
                  PO Number <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="purchase_order_number"
                  name="purchase_order_number"
                  value={formData.purchase_order_number}
                  onChange={handleChange}
                  placeholder="e.g., PO-2024-001"
                  className="bg-slate-800/50 border-slate-700 text-slate-200"
                  required
                  data-testid="po-number-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-300">
                  Date <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="bg-slate-800/50 border-slate-700 text-slate-200"
                  required
                  data-testid="date-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_name" className="text-slate-300">
                  Vendor Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="vendor_name"
                  name="vendor_name"
                  value={formData.vendor_name}
                  onChange={handleChange}
                  placeholder="Enter vendor name"
                  className="bg-slate-800/50 border-slate-700 text-slate-200"
                  required
                  data-testid="vendor-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  Purpose <span className="text-red-400">*</span>
                </Label>
                <Select value={formData.purpose} onValueChange={handlePurposeChange}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200" data-testid="purpose-select">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="linked" className="text-slate-200 focus:bg-slate-800">
                      Linked to Proforma Invoice
                    </SelectItem>
                    <SelectItem value="stock_in_sale" className="text-slate-200 focus:bg-slate-800">
                      Stock in Sale
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.purpose === "linked" && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-300">
                    Proforma Invoice <span className="text-red-400">*</span>
                  </Label>
                  <Select value={formData.proforma_invoice_id} onValueChange={handleProformaChange}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200" data-testid="proforma-select">
                      <SelectValue placeholder="Select proforma invoice" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {proformaInvoices.map((invoice) => (
                        <SelectItem
                          key={invoice.id}
                          value={invoice.id}
                          className="text-slate-200 focus:bg-slate-800"
                        >
                          {invoice.proforma_invoice_number} - {invoice.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-slate-100">Products</CardTitle>
                <CardDescription className="text-slate-500">
                  Add products with quantity and price. Each product calculates its own amount.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProduct}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                data-testid="add-product-btn"
              >
                <Plus size={16} className="mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.products.map((product, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-800"
                data-testid={`product-row-${index}`}
              >
                <div className="col-span-12 sm:col-span-3 space-y-1">
                  <Label className="text-xs text-slate-400">Product</Label>
                  <Input
                    value={product.product}
                    onChange={(e) => handleProductChange(index, "product", e.target.value)}
                    placeholder="Product name"
                    className="bg-slate-800/50 border-slate-700 text-slate-200"
                    data-testid={`product-name-${index}`}
                  />
                </div>
                <div className="col-span-6 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-slate-400">Category</Label>
                  <Input
                    value={product.category}
                    onChange={(e) => handleProductChange(index, "category", e.target.value)}
                    placeholder="Category"
                    className="bg-slate-800/50 border-slate-700 text-slate-200"
                    data-testid={`product-category-${index}`}
                  />
                </div>
                <div className="col-span-6 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-slate-400">Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={product.quantity}
                    onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-200"
                    data-testid={`product-quantity-${index}`}
                  />
                </div>
                <div className="col-span-6 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-slate-400">Price (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={product.price}
                    onChange={(e) => handleProductChange(index, "price", e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-200"
                    data-testid={`product-price-${index}`}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-slate-400">Amount (₹)</Label>
                  <div className="h-10 flex items-center px-3 rounded-md bg-slate-800/70 border border-slate-700 text-slate-300 font-mono">
                    {(product.amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-end justify-end">
                  {formData.products.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProduct(index)}
                      className="h-10 w-10 text-red-400 hover:bg-red-500/10"
                      data-testid={`remove-product-${index}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <div className="text-right">
                <p className="text-sm text-slate-400">PO Total Amount</p>
                <p className="text-2xl font-semibold text-slate-100 font-mono" data-testid="total-amount">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/purchase-orders")}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            data-testid="cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 btn-glow"
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
                {isEdit ? "Update" : "Create"} Order
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderForm;
