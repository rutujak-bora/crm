import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Plus, Upload, Download, Eye, Pencil, Trash2, Search, FileText } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api/gem-bid";

const STATUS_COLORS = {
  "Shortlisted": "bg-blue-100 text-blue-700 border-blue-200",
  "Participated": "bg-purple-100 text-purple-700 border-purple-200",
  "Technical Evaluation": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "RA": "bg-orange-100 text-orange-700 border-orange-200",
  "Rejected": "bg-red-100 text-red-700 border-red-200",
  "Bid Awarded": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Supply Order Received": "bg-teal-100 text-teal-700 border-teal-200",
  "Material Procurement": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Order Complete": "bg-green-100 text-green-700 border-green-200",
};

const STATUSES = [
  "Shortlisted",
  "Participated",
  "Technical Evaluation",
  "RA",
  "Rejected",
  "Bid Awarded",
  "Supply Order Received",
  "Material Procurement",
  "Order Complete"
];

const NewBids = () => {
  const { getAuthHeader } = useGemBidAuth();
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    Firm_name: "",
    status: "all",
    item_category: ""
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const response = await axios.get(`${API_URL}/bids/new`, getAuthHeader());
      setBids(response.data);
    } catch (error) {
      toast.error("Failed to load bids");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bidId, newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/bids/${bidId}/status?status=${encodeURIComponent(newStatus)}`,
        {},
        getAuthHeader()
      );
      toast.success(`Status updated to ${newStatus}`);

      // If Order Complete, it will move to All Bid section
      if (newStatus === "Order Complete") {
        toast.info("Bid moved to All Bid section");
      }
      fetchBids();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (bidId) => {
    if (!window.confirm("Are you sure you want to delete this bid?")) return;

    try {
      await axios.delete(`${API_URL}/bids/${bidId}`, getAuthHeader());
      toast.success("Bid deleted");
      fetchBids();
    } catch (error) {
      toast.error("Failed to delete bid");
    }
  };

  const handleTemplateDownload = async () => {
    try {
      const response = await axios.get(`${API_URL}/template/download`, {
        ...getAuthHeader(),
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "gem_bid_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template downloaded");
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API_URL}/bulk-upload`, formData, {
        headers: {
          ...getAuthHeader().headers,
          "Content-Type": "multipart/form-data"
        }
      });

      const { created, errors } = response.data;
      toast.success(`${created} bids uploaded successfully`);
      if (errors.length > 0) {
        toast.warning(`${errors.length} rows had errors`);
        console.error("Upload errors:", errors);
      }
      fetchBids();
    } catch (error) {
      toast.error("Failed to upload bids");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const filteredBids = bids.filter(bid => {
    const matchesSearch =
      bid.gem_bid_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bid.Firm_name && bid.Firm_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bid.description && bid.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      bid.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bid.item_category && bid.item_category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bid.city && bid.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bid.department && bid.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFirm = !filters.Firm_name || (bid.Firm_name && bid.Firm_name.toLowerCase().includes(filters.Firm_name.toLowerCase()));
    const matchesStatus = filters.status === "all" || bid.status === filters.status;
    const matchesCategory = !filters.item_category || (bid.item_category && bid.item_category.toLowerCase().includes(filters.item_category.toLowerCase()));

    return matchesSearch && matchesFirm && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="new-bids-page">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">New Bids</h2>
          <p className="text-slate-500 mt-1">Manage active GEM bids</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleTemplateDownload}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
            data-testid="download-template-btn"
          >
            <Download size={16} className="mr-2" />
            Template
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleBulkUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              disabled={uploading}
              asChild
            >
              <span>
                <Upload size={16} className="mr-2" />
                {uploading ? "Uploading..." : "Bulk Upload"}
              </span>
            </Button>
          </label>
          <Button
            onClick={() => navigate("/gem-bid/new")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="add-bid-btn"
          >
            <Plus size={16} className="mr-2" />
            New Bid
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search anything (Bid No, Description, Department...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-slate-300"
              data-testid="search-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Filter by Firm Name</label>
              <Input
                placeholder="Enter firm name..."
                value={filters.Firm_name}
                onChange={(e) => setFilters({ ...filters, Firm_name: e.target.value })}
                className="bg-white border-slate-300 h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Filter by Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="bg-white border-slate-300 h-9 text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Filter by Category</label>
              <Input
                placeholder="Electronics, Furniture..."
                value={filters.item_category}
                onChange={(e) => setFilters({ ...filters, item_category: e.target.value })}
                className="bg-white border-slate-300 h-9"
              />
            </div>
          </div>

          {(searchTerm || filters.Firm_name || filters.status !== "all" || filters.item_category) && (
            <div className="flex justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilters({ Firm_name: "", status: "all", item_category: "" });
                }}
                className="text-slate-500 hover:text-slate-800 text-xs h-7"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bids Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Active Bids</CardTitle>
          <CardDescription className="text-slate-500">
            {filteredBids.length} bid{filteredBids.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBids.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium text-slate-800">No bids found</h3>
              <p className="mt-2 text-slate-500">Create a new bid or upload via Excel</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-slate-200">
                    <TableHead className="text-slate-600 font-semibold">Firm Name</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Gem Bid No</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Bid Details</TableHead>
                    <TableHead className="text-slate-600 font-semibold">End Date</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">EMD</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">Qty</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Status</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBids.map((bid, index) => (
                    <TableRow
                      key={bid.id}
                      className={`border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      data-testid={`bid-row-${bid.id}`}
                    >
                      <TableCell className="font-medium text-slate-800">
                        {bid.Firm_name || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-slate-700">
                        {bid.gem_bid_no}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {bid.Bid_details || "-"}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(bid.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-700">
                        ₹{bid.emd_amount?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-700">
                        {bid.quantity}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={bid.status}
                          onValueChange={(value) => handleStatusChange(bid.id, value)}
                        >
                          <SelectTrigger className="w-[180px] h-8 text-sm border-slate-300">
                            <Badge className={STATUS_COLORS[bid.status] || "bg-slate-100 text-slate-700"}>
                              {bid.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                <Badge className={STATUS_COLORS[status]}>
                                  {status}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/gem-bid/view/${bid.id}`)}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            data-testid={`view-bid-${bid.id}`}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/gem-bid/edit/${bid.id}`)}
                            className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                            data-testid={`edit-bid-${bid.id}`}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(bid.id)}
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            data-testid={`delete-bid-${bid.id}`}
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
    </div>
  );
};

export default NewBids;
