import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, Upload, Download, ClipboardList, ArrowRightCircle, Eye } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const Leads = () => {
  const { getAuthHeader } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [convertLead, setConvertLead] = useState(null);
  const [proformaNumber, setProformaNumber] = useState("");
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_URL}/leads`, getAuthHeader());
      setLeads(response.data);
    } catch (error) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/leads/${deleteId}`, getAuthHeader());
      toast.success("Lead deleted");
      fetchLeads();
    } catch (error) {
      toast.error("Failed to delete lead");
    } finally {
      setDeleteId(null);
    }
  };

  const handleConvert = async () => {
    if (!proformaNumber.trim()) {
      toast.error("Proforma Invoice Number is required");
      return;
    }

    setConverting(true);
    try {
      await axios.post(
        `${API_URL}/leads/${convertLead.id}/convert`,
        { proforma_invoice_number: proformaNumber },
        getAuthHeader()
      );
      toast.success("Lead converted to Proforma Invoice");
      setConvertLead(null);
      setProformaNumber("");
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to convert lead");
    } finally {
      setConverting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_URL}/leads/bulk-upload`,
        formData,
        {
          headers: {
            ...getAuthHeader().headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(`Created ${response.data.created} leads`);
      if (response.data.errors?.length > 0) {
        toast.warning(`${response.data.errors.length} errors occurred`);
      }
      fetchLeads();
    } catch (error) {
      toast.error("Failed to upload file");
    }
    e.target.value = "";
  };

  const downloadTemplate = () => {
    window.open(`${API_URL}/leads/template/download`, "_blank");
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.proforma_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter ||
      lead.products?.some(p => p.category?.toLowerCase().includes(categoryFilter.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(leads.flatMap(l => l.products?.map(p => p.category) || []))].filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="leads-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leads / Enquiries</h1>
          <p className="text-slate-500 mt-1">Track and convert customer enquiries</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            data-testid="download-template-btn"
          >
            <Download size={16} className="mr-2" />
            Template
          </Button>
          <label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
              asChild
            >
              <span>
                <Upload size={16} className="mr-2" />
                Upload
              </span>
            </Button>
          </label>
          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <Link to="/leads/new" data-testid="add-lead-btn">
              <Plus size={16} className="mr-2" />
              Add Lead
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-300 text-slate-800"
            data-testid="search-input"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 rounded-md bg-white border border-slate-300 text-slate-700 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          data-testid="category-filter"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="table-container overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-slate-200 hover:bg-slate-50">
              <TableHead className="text-slate-600 font-semibold">Customer</TableHead>
              <TableHead className="text-slate-600 font-semibold">PI Number</TableHead>
              <TableHead className="text-slate-600 font-semibold">Date</TableHead>
              <TableHead className="text-slate-600 font-semibold text-center">Items</TableHead>
              <TableHead className="text-slate-600 font-semibold text-right">Amount</TableHead>
              <TableHead className="text-slate-600 font-semibold">Status</TableHead>
              <TableHead className="text-slate-600 font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow className="border-slate-200">
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <ClipboardList className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No leads found</p>
                    <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      <Link to="/leads/new">Create your first lead</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead, index) => (
                <TableRow
                  key={lead.id}
                  className={`border-slate-200 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  data-testid={`lead-row-${lead.id}`}
                >
                  <TableCell className="text-slate-800 font-medium">
                    {lead.customer_name}
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-sm">
                    {lead.proforma_invoice_number || "—"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(lead.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      {lead.products?.length || 0} {(lead.products?.length || 0) === 1 ? 'Item' : 'Items'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-800 text-right font-mono font-medium">
                    ₹{lead.total_amount?.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    {lead.is_converted ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Converted
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        title="View Details"
                      >
                        <Link to={`/leads/${lead.id}`} data-testid={`view-lead-${lead.id}`}>
                          <Eye size={16} />
                        </Link>
                      </Button>
                      {!lead.is_converted && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setConvertLead(lead);
                              setProformaNumber(lead.proforma_invoice_number || "");
                            }}
                            className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                            title="Convert to Proforma"
                            data-testid={`convert-lead-${lead.id}`}
                          >
                            <ArrowRightCircle size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Edit Lead"
                          >
                            <Link to={`/leads/${lead.id}/edit`} data-testid={`edit-lead-${lead.id}`}>
                              <Edit2 size={16} />
                            </Link>
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(lead.id)}
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete Lead"
                        data-testid={`delete-lead-${lead.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Delete Lead</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="confirm-delete-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert Dialog */}
      <Dialog open={!!convertLead} onOpenChange={() => setConvertLead(null)}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Convert Lead to Proforma Invoice</DialogTitle>
            <DialogDescription className="text-slate-500">
              Enter the Proforma Invoice Number to complete the conversion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proforma_number" className="text-slate-700 font-medium">
                Proforma Invoice Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="proforma_number"
                value={proformaNumber}
                onChange={(e) => setProformaNumber(e.target.value)}
                placeholder="e.g., PI-2024-001"
                className="bg-white border-slate-300 text-slate-800"
                data-testid="proforma-number-input"
              />
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">Customer:</span> {convertLead?.customer_name}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                <span className="font-medium text-slate-700">Amount:</span> ₹{convertLead?.total_amount?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConvertLead(null)}
              className="border-slate-300 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={converting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="confirm-convert-btn"
            >
              {converting ? "Converting..." : "Convert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
