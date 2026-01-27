import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, ClipboardList, Plus, Trash2, Upload, FileText, X, FileSpreadsheet } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const LeadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingWorkingSheet, setUploadingWorkingSheet] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    proforma_invoice_number: "",
    date: new Date().toISOString().split("T")[0],
    products: [{ product: "", part_number: "", category: "", quantity: 0, price: 0, amount: 0 }],
    follow_up_date: "",
    remark: "",
    tender_document: null,
    working_sheet: null
  });

  const isEdit = !!id;

  useEffect(() => {
    fetchCustomers();
    if (isEdit) {
      fetchLead();
    }
  }, [id]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers`, getAuthHeader());
      setCustomers(response.data);
    } catch (error) {
      toast.error("Failed to load customers");
    }
  };

  const fetchLead = async () => {
    try {
      const response = await axios.get(`${API_URL}/leads/${id}`, getAuthHeader());
      const lead = response.data;
      setFormData({
        customer_id: lead.customer_id || "",
        customer_name: lead.customer_name || "",
        proforma_invoice_number: lead.proforma_invoice_number || "",
        date: lead.date || "",
        products: lead.products?.length > 0 ? lead.products.map(p => ({
          ...p,
          part_number: p.part_number || ""
        })) : [{ product: "", part_number: "", category: "", quantity: 0, price: 0, amount: 0 }],
        follow_up_date: lead.follow_up_date || "",
        remark: lead.remark || "",
        tender_document: lead.tender_document || null,
        working_sheet: lead.working_sheet || null
      });
    } catch (error) {
      toast.error("Failed to load lead");
      navigate("/leads");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData({
      ...formData,
      customer_id: customerId,
      customer_name: customer?.customer_name || ""
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
      products: [...formData.products, { product: "", part_number: "", category: "", quantity: 0, price: 0, amount: 0 }]
    });
  };

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      const newProducts = formData.products.filter((_, i) => i !== index);
      setFormData({ ...formData, products: newProducts });
    }
  };

  const handleTenderUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      toast.error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      e.target.value = "";
      return;
    }

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size exceeds 25MB limit");
      e.target.value = "";
      return;
    }

    if (!isEdit) {
      // For new leads, store file reference to upload after lead creation
      setFormData({ ...formData, tender_document: file });
      toast.success("Document selected. It will be uploaded when you save the lead.");
    } else {
      // For existing leads, upload immediately
      setUploadingDoc(true);
      const uploadData = new FormData();
      uploadData.append("file", file);

      try {
        const response = await axios.post(
          `${API_URL}/leads/${id}/upload-tender-document`,
          uploadData,
          {
            ...getAuthHeader(),
            headers: {
              ...getAuthHeader().headers,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setFormData({ ...formData, tender_document: response.data.document_url });
        toast.success("Document uploaded successfully");
      } catch (error) {
        toast.error(error.response?.data?.detail || "Failed to upload document");
      } finally {
        setUploadingDoc(false);
      }
    }
    e.target.value = "";
  };

  const handleRemoveTenderDocument = async () => {
    if (isEdit && formData.tender_document && typeof formData.tender_document === 'string') {
      try {
        await axios.delete(`${API_URL}/leads/${id}/tender-document`, getAuthHeader());
        toast.success("Document removed");
      } catch (error) {
        toast.error("Failed to remove document");
        return;
      }
    }
    setFormData({ ...formData, tender_document: null });
  };

  // Working Sheet handlers
  const handleWorkingSheetUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      toast.error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      e.target.value = "";
      return;
    }

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size exceeds 25MB limit");
      e.target.value = "";
      return;
    }

    if (!isEdit) {
      // For new leads, store file reference to upload after lead creation
      setFormData({ ...formData, working_sheet: file });
      toast.success("Working sheet selected. It will be uploaded when you save the lead.");
    } else {
      // For existing leads, upload immediately
      setUploadingWorkingSheet(true);
      const uploadData = new FormData();
      uploadData.append("file", file);

      try {
        const response = await axios.post(
          `${API_URL}/leads/${id}/upload-working-sheet`,
          uploadData,
          {
            ...getAuthHeader(),
            headers: {
              ...getAuthHeader().headers,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setFormData({ ...formData, working_sheet: response.data.document_url });
        toast.success("Working sheet uploaded successfully");
      } catch (error) {
        toast.error(error.response?.data?.detail || "Failed to upload working sheet");
      } finally {
        setUploadingWorkingSheet(false);
      }
    }
    e.target.value = "";
  };

  const handleRemoveWorkingSheet = async () => {
    if (isEdit && formData.working_sheet && typeof formData.working_sheet === 'string') {
      try {
        await axios.delete(`${API_URL}/leads/${id}/working-sheet`, getAuthHeader());
        toast.success("Working sheet removed");
      } catch (error) {
        toast.error("Failed to remove working sheet");
        return;
      }
    }
    setFormData({ ...formData, working_sheet: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      toast.error("Please select a customer");
      return;
    }

    if (!formData.products.some(p => p.product && p.quantity > 0)) {
      toast.error("Please add at least one product with quantity");
      return;
    }

    setLoading(true);

    try {
      // Prepare payload without tender_document (handled separately)
      const { tender_document, working_sheet, ...rest } = formData;
      const payload = {
        ...rest,
        products: formData.products.filter(p => p.product).map(p => ({
          ...p,
          part_number: p.part_number || null,
          quantity: parseFloat(p.quantity) || 0,
          price: parseFloat(p.price) || 0
        }))
      };

      let leadId = id;
      if (isEdit) {
        await axios.put(`${API_URL}/leads/${id}`, payload, getAuthHeader());
        toast.success("Lead updated");
      } else {
        const response = await axios.post(`${API_URL}/leads`, payload, getAuthHeader());
        leadId = response.data.id;
        toast.success("Lead created");
        
        // Upload tender document for new lead if file was selected
        if (tender_document && tender_document instanceof File) {
          const uploadData = new FormData();
          uploadData.append("file", tender_document);
          try {
            await axios.post(
              `${API_URL}/leads/${leadId}/upload-tender-document`,
              uploadData,
              {
                ...getAuthHeader(),
                headers: {
                  ...getAuthHeader().headers,
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            toast.success("Tender document uploaded");
          } catch (uploadError) {
            toast.warning("Lead created but tender document upload failed");
          }
        }
        
        // Upload working sheet for new lead if file was selected
        if (working_sheet && working_sheet instanceof File) {
          const uploadData = new FormData();
          uploadData.append("file", working_sheet);
          try {
            await axios.post(
              `${API_URL}/leads/${leadId}/upload-working-sheet`,
              uploadData,
              {
                ...getAuthHeader(),
                headers: {
                  ...getAuthHeader().headers,
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            toast.success("Working sheet uploaded");
          } catch (uploadError) {
            toast.warning("Lead created but working sheet upload failed");
          }
        }
      }
      navigate("/leads");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save lead");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.products.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="lead-form-page">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/leads")}
          className="text-slate-400 hover:text-slate-200"
          data-testid="back-btn"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">
            {isEdit ? "Edit Lead" : "New Lead"}
          </h1>
          <p className="text-slate-400 mt-1">
            {isEdit ? "Update lead information" : "Create a new lead/enquiry"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <ClipboardList size={20} />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-100">Lead Details</CardTitle>
                <CardDescription className="text-slate-500">
                  Basic lead information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Customer <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={handleCustomerChange}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200" data-testid="customer-select">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer.id}
                        value={customer.id}
                        className="text-slate-200 focus:bg-slate-800"
                      >
                        {customer.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proforma_invoice_number" className="text-slate-300">
                  Proforma Invoice Number (Optional)
                </Label>
                <Input
                  id="proforma_invoice_number"
                  name="proforma_invoice_number"
                  value={formData.proforma_invoice_number}
                  onChange={handleChange}
                  placeholder="e.g., PI-2024-001"
                  className="bg-slate-800/50 border-slate-700 text-slate-200"
                  data-testid="proforma-number-input"
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
                <Label htmlFor="follow_up_date" className="text-slate-300">
                  Follow-up Date
                </Label>
                <Input
                  id="follow_up_date"
                  name="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={handleChange}
                  className="bg-slate-800/50 border-slate-700 text-slate-200"
                  data-testid="followup-date-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remark" className="text-slate-300">Remark</Label>
              <Textarea
                id="remark"
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                placeholder="Add any notes or remarks..."
                className="bg-slate-800/50 border-slate-700 text-slate-200 min-h-[80px]"
                data-testid="remark-input"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-slate-100">Products</CardTitle>
                <CardDescription className="text-slate-500">
                  Add products with quantity and price
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
                className="p-4 rounded-lg bg-slate-800/30 border border-slate-800 space-y-3"
                data-testid={`product-row-${index}`}
              >
                {/* Row 1: Product Name and Part Number */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 sm:col-span-6 space-y-1">
                    <Label className="text-xs text-slate-400">Product Name</Label>
                    <Input
                      value={product.product}
                      onChange={(e) => handleProductChange(index, "product", e.target.value)}
                      placeholder="Product name"
                      className="bg-slate-800/50 border-slate-700 text-slate-200"
                      data-testid={`product-name-${index}`}
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-5 space-y-1">
                    <Label className="text-xs text-slate-400">Part Number</Label>
                    <Input
                      value={product.part_number || ""}
                      onChange={(e) => handleProductChange(index, "part_number", e.target.value)}
                      placeholder="e.g., PN-001"
                      className="bg-slate-800/50 border-slate-700 text-slate-200"
                      data-testid={`product-part-number-${index}`}
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex items-end justify-end">
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
                {/* Row 2: Category, Quantity, Price, Amount */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6 sm:col-span-3 space-y-1">
                    <Label className="text-xs text-slate-400">Category</Label>
                    <Input
                      value={product.category}
                      onChange={(e) => handleProductChange(index, "category", e.target.value)}
                      placeholder="Category"
                      className="bg-slate-800/50 border-slate-700 text-slate-200"
                      data-testid={`product-category-${index}`}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3 space-y-1">
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
                  <div className="col-span-6 sm:col-span-3 space-y-1">
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
                  <div className="col-span-6 sm:col-span-3 space-y-1">
                    <Label className="text-xs text-slate-400">Amount (₹)</Label>
                    <div className="h-10 flex items-center px-3 rounded-md bg-slate-800/70 border border-slate-700 text-slate-300 font-mono">
                      {(product.amount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <div className="text-right">
                <p className="text-sm text-slate-400">Total Amount</p>
                <p className="text-2xl font-semibold text-slate-100 font-mono" data-testid="total-amount">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tender Document Card - Customer Provided */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <FileText size={20} />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-100">Tender Document</CardTitle>
                <CardDescription className="text-slate-500">
                  Customer-provided tender document (PDF, DOC, DOCX, XLS, XLSX, PNG - Max 25MB)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {formData.tender_document ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <FileText size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">
                      {typeof formData.tender_document === 'string' 
                        ? formData.tender_document.split('/').pop()
                        : formData.tender_document.name
                      }
                    </p>
                    <p className="text-xs text-slate-500">
                      {typeof formData.tender_document === 'string' 
                        ? 'Customer provided document'
                        : `${(formData.tender_document.size / 1024 / 1024).toFixed(2)} MB - Ready to upload`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {typeof formData.tender_document === 'string' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(process.env.REACT_APP_BACKEND_URL + formData.tender_document, '_blank')}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      data-testid="view-tender-doc-btn"
                    >
                      View
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveTenderDocument}
                    className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                    data-testid="remove-tender-doc-btn"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <label className="block">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png"
                  onChange={handleTenderUpload}
                  className="hidden"
                  disabled={uploadingDoc}
                />
                <div className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
                  {uploadingDoc ? (
                    <div className="flex items-center gap-3">
                      <span className="animate-spin h-5 w-5 border-2 border-slate-400 border-t-slate-200 rounded-full" />
                      <span className="text-slate-400">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="text-slate-500 mb-3" />
                      <p className="text-slate-300 font-medium">Click to upload tender document</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, XLS, XLSX, PNG up to 25MB</p>
                    </>
                  )}
                </div>
              </label>
            )}
          </CardContent>
        </Card>

        {/* Working Sheet Card - Internal Reference */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-100">Working Sheet</CardTitle>
                <CardDescription className="text-slate-500">
                  Internal working document for calculations, notes, pricing (PDF, DOC, DOCX, XLS, XLSX, PNG - Max 25MB)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {formData.working_sheet ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <FileSpreadsheet size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">
                      {typeof formData.working_sheet === 'string' 
                        ? formData.working_sheet.split('/').pop()
                        : formData.working_sheet.name
                      }
                    </p>
                    <p className="text-xs text-slate-500">
                      {typeof formData.working_sheet === 'string' 
                        ? 'Internal working document'
                        : `${(formData.working_sheet.size / 1024 / 1024).toFixed(2)} MB - Ready to upload`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {typeof formData.working_sheet === 'string' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(process.env.REACT_APP_BACKEND_URL + formData.working_sheet, '_blank')}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      data-testid="view-working-sheet-btn"
                    >
                      View
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveWorkingSheet}
                    className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                    data-testid="remove-working-sheet-btn"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <label className="block">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png"
                  onChange={handleWorkingSheetUpload}
                  className="hidden"
                  disabled={uploadingWorkingSheet}
                />
                <div className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
                  {uploadingWorkingSheet ? (
                    <div className="flex items-center gap-3">
                      <span className="animate-spin h-5 w-5 border-2 border-slate-400 border-t-slate-200 rounded-full" />
                      <span className="text-slate-400">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="text-slate-500 mb-3" />
                      <p className="text-slate-300 font-medium">Click to upload working sheet</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, XLS, XLSX, PNG up to 25MB</p>
                    </>
                  )}
                </div>
              </label>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/leads")}
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
                {isEdit ? "Update" : "Create"} Lead
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;
