import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Save, FileText, Plus, Trash2, FolderOpen, FileSpreadsheet, ExternalLink, CheckCircle, XCircle } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const ProformaInvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await axios.get(`${API_URL}/proforma-invoices/${id}`, getAuthHeader());
      setInvoice(response.data);
      setProducts(response.data.products || []);
    } catch (error) {
      toast.error("Failed to load proforma invoice");
      navigate("/proforma-invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    
    if (field === "quantity" || field === "price") {
      const qty = field === "quantity" ? parseFloat(value) || 0 : parseFloat(newProducts[index].quantity) || 0;
      const price = field === "price" ? parseFloat(value) || 0 : parseFloat(newProducts[index].price) || 0;
      newProducts[index].amount = qty * price;
    }
    
    setProducts(newProducts);
  };

  const addProduct = () => {
    setProducts([...products, { product: "", part_number: "", category: "", quantity: 0, price: 0, amount: 0 }]);
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/proforma-invoices/${id}`,
        products.filter(p => p.product).map(p => ({
          ...p,
          part_number: p.part_number || null,
          quantity: parseFloat(p.quantity) || 0,
          price: parseFloat(p.price) || 0
        })),
        getAuthHeader()
      );
      toast.success("Proforma Invoice updated");
      setEditing(false);
      fetchInvoice();
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = products.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="proforma-detail-page">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/proforma-invoices")}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            data-testid="back-btn"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {invoice.proforma_invoice_number}
            </h1>
            <p className="text-slate-500 mt-1">Proforma Invoice Details - Synced with Lead</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.lead_id && (
            <Button
              variant="outline"
              asChild
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Link to={`/leads/${invoice.lead_id}`}>
                View Lead
              </Link>
            </Button>
          )}
          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              data-testid="edit-btn"
            >
              Edit Products
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setProducts(invoice.products || []);
                }}
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="save-btn"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Information Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-600">
              <FileText size={20} />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Invoice Information</CardTitle>
              <CardDescription className="text-slate-500">
                Auto-synced from linked lead
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">PI Number</p>
              <p className="text-lg font-mono text-slate-800 mt-1">{invoice.proforma_invoice_number}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Customer</p>
              <p className="text-lg text-slate-800 mt-1">{invoice.customer_name}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Date</p>
              <p className="text-lg text-slate-800 mt-1">{new Date(invoice.date).toLocaleDateString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-xs text-emerald-600 uppercase tracking-wider font-medium">Total Amount</p>
              <p className="text-lg font-mono text-emerald-700 mt-1 font-bold">
                ₹{(editing ? totalAmount : invoice.total_amount)?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Card - WHITE BACKGROUND */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-slate-800">Products</CardTitle>
              <CardDescription className="text-slate-500">
                {invoice.products?.length || 0} item{(invoice.products?.length || 0) !== 1 ? 's' : ''} in this invoice
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                {invoice.products?.length || 0} Items
              </Badge>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProduct}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  data-testid="add-product-btn"
                >
                  <Plus size={16} className="mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  {/* Row 1: Product Name and Part Number */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 sm:col-span-5 space-y-1">
                      <Label className="text-xs text-slate-500 font-medium">Product Name</Label>
                      <Input
                        value={product.product}
                        onChange={(e) => handleProductChange(index, "product", e.target.value)}
                        className="bg-white border-slate-300 text-slate-800"
                        placeholder="Product name"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-5 space-y-1">
                      <Label className="text-xs text-slate-500 font-medium">Part Number</Label>
                      <Input
                        value={product.part_number || ""}
                        onChange={(e) => handleProductChange(index, "part_number", e.target.value)}
                        className="bg-white border-slate-300 text-slate-800"
                        placeholder="e.g., PN-001"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-2 flex items-end justify-end">
                      {products.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(index)}
                          className="h-10 w-10 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Row 2: Category, Quantity, Price, Amount */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6 sm:col-span-3 space-y-1">
                      <Label className="text-xs text-slate-500 font-medium">Category</Label>
                      <Input
                        value={product.category}
                        onChange={(e) => handleProductChange(index, "category", e.target.value)}
                        className="bg-white border-slate-300 text-slate-800"
                        placeholder="Category"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3 space-y-1">
                      <Label className="text-xs text-slate-500 font-medium">Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                        className="bg-white border-slate-300 text-slate-800"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3 space-y-1">
                      <Label className="text-xs text-slate-500 font-medium">Price (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={product.price}
                        onChange={(e) => handleProductChange(index, "price", e.target.value)}
                        className="bg-white border-slate-300 text-slate-800"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3 space-y-1">
                      <Label className="text-xs text-slate-500 font-medium">Amount (₹)</Label>
                      <div className="h-10 flex items-center px-3 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-medium">
                        ₹{(product.amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-slate-200 hover:bg-slate-50">
                    <TableHead className="text-slate-600 font-semibold">S.No</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Product</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Part Number</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Category</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">Quantity</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">Price (₹)</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.products?.map((product, index) => (
                    <TableRow 
                      key={index} 
                      className={`border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      data-testid={`product-row-${index}`}
                    >
                      <TableCell className="text-slate-500">{index + 1}</TableCell>
                      <TableCell className="text-slate-800 font-medium">{product.product}</TableCell>
                      <TableCell className="text-slate-600 font-mono text-sm">{product.part_number || "—"}</TableCell>
                      <TableCell className="text-slate-600">{product.category}</TableCell>
                      <TableCell className="text-slate-700 text-right font-mono">{product.quantity}</TableCell>
                      <TableCell className="text-slate-700 text-right font-mono">₹{product.price?.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-slate-800 text-right font-mono font-medium">₹{product.amount?.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-end pt-4 mt-4 border-t border-slate-200">
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium">Total Amount</p>
              <p className="text-2xl font-bold text-emerald-600 font-mono" data-testid="total-amount">
                ₹{(editing ? totalAmount : invoice.total_amount)?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Section - Synced from Lead */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <FolderOpen size={20} />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Documents</CardTitle>
              <CardDescription className="text-slate-500">
                Synced from linked lead (read-only)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tender Document Row */}
          <div className={`flex items-center justify-between p-4 rounded-lg border ${invoice.tender_document ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${invoice.tender_document ? 'bg-amber-100' : 'bg-slate-200'}`}>
                <FileText size={20} className={invoice.tender_document ? 'text-amber-600' : 'text-slate-400'} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-slate-800 font-medium">Tender Document</p>
                  <span className="text-xs text-slate-500">(Customer Provided)</span>
                </div>
                {invoice.tender_document ? (
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <p className="text-sm text-emerald-600 font-medium">Available</p>
                    <span className="text-xs text-slate-500">• {invoice.tender_document.split('/').pop()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <XCircle size={14} className="text-slate-400" />
                    <p className="text-sm text-slate-500">Not uploaded in lead</p>
                  </div>
                )}
              </div>
            </div>
            {invoice.tender_document && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(process.env.REACT_APP_BACKEND_URL + invoice.tender_document, '_blank')}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                data-testid="view-tender-doc-btn"
              >
                <ExternalLink size={16} className="mr-2" />
                View
              </Button>
            )}
          </div>

          {/* Working Sheet Row */}
          <div className={`flex items-center justify-between p-4 rounded-lg border ${invoice.working_sheet ? 'bg-cyan-50 border-cyan-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${invoice.working_sheet ? 'bg-cyan-100' : 'bg-slate-200'}`}>
                <FileSpreadsheet size={20} className={invoice.working_sheet ? 'text-cyan-600' : 'text-slate-400'} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-slate-800 font-medium">Working Sheet</p>
                  <span className="text-xs text-slate-500">(Internal Reference)</span>
                </div>
                {invoice.working_sheet ? (
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <p className="text-sm text-emerald-600 font-medium">Available</p>
                    <span className="text-xs text-slate-500">• {invoice.working_sheet.split('/').pop()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <XCircle size={14} className="text-slate-400" />
                    <p className="text-sm text-slate-500">Not uploaded in lead</p>
                  </div>
                )}
              </div>
            </div>
            {invoice.working_sheet && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(process.env.REACT_APP_BACKEND_URL + invoice.working_sheet, '_blank')}
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-100"
                data-testid="view-working-sheet-btn"
              >
                <ExternalLink size={16} className="mr-2" />
                View
              </Button>
            )}
          </div>

          {/* Hint about editing documents */}
          <div className="text-center py-2 text-sm text-slate-500 bg-slate-50 rounded-lg">
            Documents are synced from the linked lead. 
            {invoice.lead_id && (
              <Link to={`/leads/${invoice.lead_id}/edit`} className="text-indigo-600 hover:text-indigo-700 ml-1">
                Edit in Lead
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProformaInvoiceDetail;
