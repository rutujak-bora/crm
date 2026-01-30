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
import { Eye, Search, ShoppingCart, PlusCircle, Edit2, Trash2, Package } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api/gem-bid";

const Orders = () => {
    const { getAuthHeader } = useGemBidAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        vendor: ""
    });
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
        if (!window.confirm("Are you sure you want to delete this entire order and all its SKUs?")) return;

        try {
            await axios.delete(`${API_URL}/orders/${id}`, getAuthHeader());
            toast.success("Order deleted successfully");
            fetchOrders();
        } catch (error) {
            toast.error("Failed to delete order");
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.gem_bid_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.items?.some(item =>
                item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.vendor.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const matchesVendor = !filters.vendor || order.items?.some(item =>
            item.vendor.toLowerCase().includes(filters.vendor.toLowerCase())
        );

        return matchesSearch && matchesVendor;
    });

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

            {/* Search and Filters */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by Bid No, Vendor, or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white border-slate-300"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Filter by Vendor</label>
                            <Input
                                placeholder="Enter vendor name..."
                                value={filters.vendor}
                                onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
                                className="bg-white border-slate-300 h-9"
                            />
                        </div>
                    </div>

                    {(searchTerm || filters.vendor) && (
                        <div className="flex justify-end pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilters({ vendor: "" });
                                }}
                                className="text-slate-500 hover:text-slate-800 text-xs h-7"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
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
                                        <TableHead className="font-semibold text-slate-600">Total SKUs</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Primary SKU</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right">Total Invoice Value</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Last SKU Date</TableHead>
                                        <TableHead className="text-center font-semibold text-slate-600 w-32">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order, index) => {
                                        const totalInvoice = order.items?.reduce((sum, item) => sum + (item.invoice_value || 0), 0) || 0;
                                        const firstSku = order.items?.[0]?.sku || "-";
                                        const firstDate = order.items?.[0]?.date || "-";

                                        return (
                                            <TableRow
                                                key={order.id}
                                                className="border-slate-200 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <TableCell className="font-medium text-slate-500 px-4 py-4">{index + 1}</TableCell>
                                                <TableCell className="font-mono text-emerald-700 font-medium">{order.gem_bid_no}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {order.items?.length || 0} Items
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-700">{firstSku}</TableCell>
                                                <TableCell className="text-right font-mono text-slate-800 font-medium">₹{totalInvoice.toLocaleString('en-IN')}</TableCell>
                                                <TableCell className="text-slate-600 text-sm">
                                                    {firstDate !== "-" ? new Date(firstDate).toLocaleDateString() : "-"}
                                                </TableCell>
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
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Order Detail Modal */}
            <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] bg-white border-none shadow-2xl p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/20">
                                <Package size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Bid No: {viewingOrder?.gem_bid_no}</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Viewing all {viewingOrder?.items?.length} SKUs for this bid
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {viewingOrder?.items?.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-200/50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                    <h4 className="font-bold text-slate-700 text-sm">SKU #{idx + 1}: {item.sku}</h4>
                                    <span className="text-xs font-medium text-slate-500">Dated: {new Date(item.date).toLocaleDateString()}</span>
                                </div>
                                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Vendor</p>
                                        <p className="text-sm font-semibold text-slate-800">{item.vendor || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Price</p>
                                        <p className="text-sm font-mono text-slate-800">₹{item.price.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Quantity</p>
                                        <p className="text-sm font-mono text-slate-800">{item.quantity}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Delivery Date</p>
                                        <p className="text-sm font-medium text-emerald-700">{new Date(item.delivery_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Invoice Value</p>
                                        <p className="text-sm font-mono text-slate-800">₹{item.invoice_value.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Advance Paid</p>
                                        <p className="text-sm font-mono text-blue-600">₹{item.advance_paid.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="space-y-1 bg-emerald-50 p-2 rounded border border-emerald-100 col-span-2">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Remaining Amount</p>
                                        <p className="text-lg font-mono font-bold text-emerald-700">₹{item.remaining_amount.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                        <Button
                            onClick={() => setViewingOrder(null)}
                            className="bg-slate-800 hover:bg-slate-900"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Orders;
