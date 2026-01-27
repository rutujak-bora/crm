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
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Search, Eye, Trash2, FileText } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const ProformaInvoices = () => {
  const { getAuthHeader } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/proforma-invoices`, getAuthHeader());
      setInvoices(response.data);
    } catch (error) {
      toast.error("Failed to load proforma invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/proforma-invoices/${deleteId}`, getAuthHeader());
      toast.success("Proforma Invoice deleted");
      fetchInvoices();
    } catch (error) {
      toast.error("Failed to delete proforma invoice");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.proforma_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || 
      inv.products?.some(p => p.category?.toLowerCase().includes(categoryFilter.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(invoices.flatMap(i => i.products?.map(p => p.category) || []))].filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="proforma-invoices-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proforma Invoices</h1>
          <p className="text-slate-500 mt-1">Sales orders from converted leads</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-300 text-slate-800"
            data-testid="search-input"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 rounded-md bg-white border border-slate-300 text-slate-700 text-sm focus:border-indigo-500"
          data-testid="category-filter"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">
          {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="table-container overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-slate-200 hover:bg-slate-50">
              <TableHead className="text-slate-600 font-semibold">PI Number</TableHead>
              <TableHead className="text-slate-600 font-semibold">Customer</TableHead>
              <TableHead className="text-slate-600 font-semibold">Date</TableHead>
              <TableHead className="text-slate-600 font-semibold text-center">Items</TableHead>
              <TableHead className="text-slate-600 font-semibold text-right">Total Amount</TableHead>
              <TableHead className="text-slate-600 font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow className="border-slate-200">
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No proforma invoices found</p>
                    <p className="text-sm text-slate-400">Convert leads to create proforma invoices</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice, index) => (
                <TableRow
                  key={invoice.id}
                  className={`border-slate-200 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  data-testid={`invoice-row-${invoice.id}`}
                >
                  <TableCell className="text-slate-800 font-mono font-semibold">
                    {invoice.proforma_invoice_number}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {invoice.customer_name}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(invoice.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-teal-50 text-teal-700 border-teal-200">
                      {invoice.products?.length || 0} {(invoice.products?.length || 0) === 1 ? 'Item' : 'Items'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-800 text-right font-mono font-semibold text-lg">
                    ₹{invoice.total_amount?.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                      >
                        <Link to={`/proforma-invoices/${invoice.id}`} data-testid={`view-invoice-${invoice.id}`}>
                          <Eye size={16} />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(invoice.id)}
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        data-testid={`delete-invoice-${invoice.id}`}
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Delete Proforma Invoice</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete this proforma invoice? This action cannot be undone.
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
    </div>
  );
};

export default ProformaInvoices;
