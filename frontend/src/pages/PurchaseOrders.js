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
import { Plus, Search, Edit2, Trash2, Upload, Download, ShoppingCart, Eye } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const PurchaseOrders = () => {
  const { getAuthHeader } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/purchase-orders`, getAuthHeader());
      setOrders(response.data);
    } catch (error) {
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/purchase-orders/${deleteId}`, getAuthHeader());
      toast.success("Purchase Order deleted");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to delete purchase order");
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
        `${API_URL}/purchase-orders/bulk-upload`,
        formData,
        {
          ...getAuthHeader(),
          headers: {
            ...getAuthHeader().headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(`Created ${response.data.created} purchase orders`);
      if (response.data.errors?.length > 0) {
        toast.warning(`${response.data.errors.length} errors occurred`);
      }
      fetchOrders();
    } catch (error) {
      toast.error("Failed to upload file");
    }
    e.target.value = "";
  };

  const downloadTemplate = () => {
    window.open(`${API_URL}/purchase-orders/template/download`, "_blank");
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.purchase_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.products?.some(p => p.category?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPurpose = !purposeFilter || order.purpose === purposeFilter;
    return matchesSearch && matchesPurpose;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="purchase-orders-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Purchase Orders</h1>
          <p className="text-slate-500 mt-1">Manage vendor purchase orders with multiple products</p>
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
            <Link to="/purchase-orders/new" data-testid="add-po-btn">
              <Plus size={16} className="mr-2" />
              Add PO
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-300 text-slate-800"
            data-testid="search-input"
          />
        </div>
        <select
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
          className="h-10 px-3 rounded-md bg-white border border-slate-300 text-slate-700 text-sm focus:border-indigo-500"
          data-testid="purpose-filter"
        >
          <option value="">All Purposes</option>
          <option value="linked">Linked to PI</option>
          <option value="stock_in_sale">Stock in Sale</option>
        </select>
        <span className="text-sm text-slate-500">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="table-container overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-slate-200 hover:bg-slate-50">
              <TableHead className="text-slate-600 font-semibold">PO Number</TableHead>
              <TableHead className="text-slate-600 font-semibold">Date</TableHead>
              <TableHead className="text-slate-600 font-semibold">Vendor</TableHead>
              <TableHead className="text-slate-600 font-semibold">Purpose</TableHead>
              <TableHead className="text-slate-600 font-semibold text-center">Items</TableHead>
              <TableHead className="text-slate-600 font-semibold text-right">Total Amount</TableHead>
              <TableHead className="text-slate-600 font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow className="border-slate-200">
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No purchase orders found</p>
                    <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      <Link to="/purchase-orders/new">Create your first order</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order, index) => (
                <TableRow
                  key={order.id}
                  className={`border-slate-200 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  data-testid={`po-row-${order.id}`}
                >
                  <TableCell className="text-slate-800 font-mono font-semibold">
                    {order.purchase_order_number}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(order.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {order.vendor_name}
                  </TableCell>
                  <TableCell>
                    {order.purpose === "linked" ? (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        Linked: {order.proforma_invoice_number}
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                        Stock in Sale
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                      {order.products?.length || 0} {(order.products?.length || 0) === 1 ? 'Item' : 'Items'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-800 text-right font-mono font-semibold text-lg">
                    ₹{(order.total_amount || order.amount || 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                        title="View Details"
                      >
                        <Link to={`/purchase-orders/${order.id}`} data-testid={`view-po-${order.id}`}>
                          <Eye size={16} />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Edit Order"
                      >
                        <Link to={`/purchase-orders/${order.id}/edit`} data-testid={`edit-po-${order.id}`}>
                          <Edit2 size={16} />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(order.id)}
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete Order"
                        data-testid={`delete-po-${order.id}`}
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
            <AlertDialogTitle className="text-slate-800">Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete this purchase order? This action cannot be undone.
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

export default PurchaseOrders;
