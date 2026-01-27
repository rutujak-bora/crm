import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useGemBidAuth } from "../../context/GemBidAuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import { Eye, Search, ShoppingCart, PlusCircle, Edit2, Trash2, FileText } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api/gem-bid";

const Orders = () => {
    const { getAuthHeader } = useGemBidAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewingOrder, setViewingOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${API_URL}/orders`, getAuthHeader());
            setOrders(response.data);
        } catch (error) {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this order?")) return;

        try {
            await axios.delete(`${API_URL}/orders/${id}`, getAuthHeader());
            toast.success("Order deleted successfully");
            fetchOrders();
        } catch (error) {
            toast.error("Failed to delete order");
        }
    };

    const filteredOrders = orders.filter(order =>
        order.gem_bid_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Orders</h2>
                    <p className="text-slate-500 mt-1">Manage orders for completed GEM bids</p>
                </div>
                <Button
                    onClick={() => navigate("/gem-bid/orders/new")}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                >
                    <PlusCircle size={18} className="mr-2" />
                    New Order
                </Button>
            </div>

            {/* Search */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by Bid No, Vendor or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white border-slate-300"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                            <ShoppingCart size={20} />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-slate-800">Order List</CardTitle>
                            <CardDescription className="text-slate-500">
                                {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} found
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-4 text-lg font-medium text-slate-800">No orders found</h3>
                            <p className="mt-2 text-slate-500">
                                {searchTerm ? "Try a different search term" : "Create your first order by clicking 'New Order'"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 border-slate-200">
                                        <TableHead className="w-16 font-semibold text-slate-600 px-4 py-4">Sr No</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Bid No</TableHead>
                                        <TableHead className="font-semibold text-slate-600">SKU</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Vendor</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right">Invoice Value</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right">Remaining</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Date</TableHead>
                                        <TableHead className="text-center font-semibold text-slate-600 w-32">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order, index) => (
                                        <TableRow
                                            key={order.id}
                                            className="border-slate-200 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <TableCell className="font-medium text-slate-500 px-4 py-4">{index + 1}</TableCell>
                                            <TableCell className="font-mono text-emerald-700 font-medium">{order.gem_bid_no}</TableCell>
                                            <TableCell className="text-slate-700">{order.sku}</TableCell>
                                            <TableCell className="text-slate-700">{order.vendor}</TableCell>
                                            <TableCell className="text-right font-mono text-slate-800">₹{order.invoice_value.toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-right font-mono text-emerald-600 font-medium">₹{order.remaining_amount.toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-slate-600 text-sm">{new Date(order.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setViewingOrder(order)}
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => navigate(`/gem-bid/orders/edit/${order.id}`)}
                                                        className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                                                        title="Edit Order"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(order.id)}
                                                        className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Order Detail Modal */}
            <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
                <DialogContent className="max-w-2xl bg-white border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-emerald-600 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/20">
                                <ShoppingCart size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Order Details</DialogTitle>
                                <DialogDescription className="text-emerald-100">
                                    Detailed view for order {viewingOrder?.gem_bid_no}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {viewingOrder && (
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bid Information</h4>
                                    <p className="text-sm font-bold text-slate-800">{viewingOrder.gem_bid_no}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Order Date</h4>
                                    <p className="text-sm font-medium text-slate-800">{new Date(viewingOrder.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">SKU</h4>
                                    <p className="text-sm font-medium text-slate-800">{viewingOrder.sku}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Vendor</h4>
                                    <p className="text-sm font-medium text-slate-800">{viewingOrder.vendor}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Price per unit</h4>
                                    <p className="text-sm font-mono text-slate-800">₹{viewingOrder.price.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Quantity</h4>
                                    <p className="text-sm font-mono text-slate-800">{viewingOrder.quantity}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Invoice Value</h4>
                                    <p className="text-sm font-mono text-slate-800">₹{viewingOrder.invoice_value.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Advance Paid</h4>
                                    <p className="text-sm font-mono text-slate-800">₹{viewingOrder.advance_paid.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Remaining Amount</h4>
                                    <p className="text-sm font-mono font-bold text-emerald-600">₹{viewingOrder.remaining_amount.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Delivery Date</h4>
                                    <p className="text-sm font-medium text-slate-800">{new Date(viewingOrder.delivery_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                <Button
                                    onClick={() => setViewingOrder(null)}
                                    className="bg-slate-800 hover:bg-slate-900"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Orders;
