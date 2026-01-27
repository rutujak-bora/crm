import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
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
import { ArrowLeft, Edit2, ShoppingCart, Calendar, Building, FileText } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const PurchaseOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API_URL}/purchase-orders/${id}`, getAuthHeader());
      setOrder(response.data);
    } catch (error) {
      toast.error("Failed to load purchase order");
      navigate("/purchase-orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) return null;

  const totalAmount = order.total_amount || order.amount || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="po-detail-page">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/purchase-orders")}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            data-testid="back-btn"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {order.purchase_order_number}
            </h1>
            <p className="text-slate-500 mt-1">Purchase Order Details</p>
          </div>
        </div>
        <Button
          asChild
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          data-testid="edit-btn"
        >
          <Link to={`/purchase-orders/${id}/edit`}>
            <Edit2 size={16} className="mr-2" />
            Edit Order
          </Link>
        </Button>
      </div>

      {/* Order Information Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <ShoppingCart size={20} />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Order Information</CardTitle>
              <CardDescription className="text-slate-500">
                Purchase order details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-slate-400" />
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">PO Number</p>
              </div>
              <p className="text-lg font-mono text-slate-800 font-semibold">{order.purchase_order_number}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-slate-400" />
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Date</p>
              </div>
              <p className="text-lg text-slate-800">
                {new Date(order.date).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Building size={14} className="text-slate-400" />
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Vendor</p>
              </div>
              <p className="text-lg text-slate-800">{order.vendor_name}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Purpose</p>
              {order.purpose === "linked" ? (
                <div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    Linked to PI
                  </Badge>
                  <p className="text-sm text-slate-600 mt-1 font-mono">
                    {order.proforma_invoice_number}
                  </p>
                </div>
              ) : (
                <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                  Stock in Sale
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-slate-800">Products</CardTitle>
              <CardDescription className="text-slate-500">
                {order.products?.length || 0} item{(order.products?.length || 0) !== 1 ? 's' : ''} in this order
              </CardDescription>
            </div>
            <Badge className="bg-purple-50 text-purple-700 border-purple-200">
              {order.products?.length || 0} {(order.products?.length || 0) === 1 ? 'Item' : 'Items'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-slate-200 hover:bg-slate-50">
                  <TableHead className="text-slate-600 font-semibold">S.No</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Product</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Category</TableHead>
                  <TableHead className="text-slate-600 font-semibold text-right">Quantity</TableHead>
                  <TableHead className="text-slate-600 font-semibold text-right">Price (₹)</TableHead>
                  <TableHead className="text-slate-600 font-semibold text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.products?.map((product, index) => (
                  <TableRow key={index} className={`border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`} data-testid={`product-row-${index}`}>
                    <TableCell className="text-slate-500">{index + 1}</TableCell>
                    <TableCell className="text-slate-800 font-medium">{product.product}</TableCell>
                    <TableCell className="text-slate-600">{product.category}</TableCell>
                    <TableCell className="text-slate-700 text-right font-mono">{product.quantity}</TableCell>
                    <TableCell className="text-slate-700 text-right font-mono">{product.price?.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-slate-800 text-right font-mono font-medium">{product.amount?.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="flex justify-end pt-4 mt-4 border-t border-slate-200">
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium">Total Amount</p>
              <p className="text-2xl font-bold text-emerald-600 font-mono" data-testid="total-amount">
                ₹{totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderDetail;
