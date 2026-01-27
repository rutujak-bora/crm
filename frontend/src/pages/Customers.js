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
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, Upload, Download, Users } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const Customers = () => {
  const { getAuthHeader } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers`, getAuthHeader());
      setCustomers(response.data);
    } catch (error) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/customers/${deleteId}`, getAuthHeader());
      toast.success("Customer deleted");
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to delete customer");
    } finally {
      setDeleteId(null);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_URL}/customers/bulk-upload`,
        formData,
        {
          ...getAuthHeader(),
          headers: {
            ...getAuthHeader().headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(`Created ${response.data.created} customers`);
      if (response.data.errors?.length > 0) {
        toast.warning(`${response.data.errors.length} errors occurred`);
      }
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to upload file");
    }
    e.target.value = "";
  };

  const downloadTemplate = () => {
    window.open(`${API_URL}/customers/template/download`, "_blank");
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact_number?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="customers-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 mt-1">Manage your customer database</p>
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
              data-testid="upload-file-input"
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
            <Link to="/customers/new" data-testid="add-customer-btn">
              <Plus size={16} className="mr-2" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-300 text-slate-800"
            data-testid="search-input"
          />
        </div>
        <span className="text-sm text-slate-500">
          {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-slate-200 hover:bg-slate-50">
              <TableHead className="text-slate-600 font-semibold">Customer Name</TableHead>
              <TableHead className="text-slate-600 font-semibold">Reference</TableHead>
              <TableHead className="text-slate-600 font-semibold">Contact</TableHead>
              <TableHead className="text-slate-600 font-semibold">Email</TableHead>
              <TableHead className="text-slate-600 font-semibold">Created</TableHead>
              <TableHead className="text-slate-600 font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow className="border-slate-200">
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No customers found</p>
                    <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      <Link to="/customers/new">Add your first customer</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer, index) => (
                <TableRow
                  key={customer.id}
                  className={`border-slate-200 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  data-testid={`customer-row-${customer.id}`}
                >
                  <TableCell className="text-slate-800 font-medium">
                    {customer.customer_name}
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-sm">
                    {customer.reference_name || "—"}
                  </TableCell>
                  <TableCell className="text-slate-600">{customer.contact_number}</TableCell>
                  <TableCell className="text-slate-500">{customer.email}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(customer.created_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                      >
                        <Link to={`/customers/${customer.id}/edit`} data-testid={`edit-customer-${customer.id}`}>
                          <Edit2 size={16} />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(customer.id)}
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        data-testid={`delete-customer-${customer.id}`}
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
            <AlertDialogTitle className="text-slate-800">Delete Customer</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete this customer? This action cannot be undone.
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

export default Customers;
