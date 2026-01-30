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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Eye, Search, Archive, CheckCircle } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api/gem-bid";

const COMPLETED_STATUSES = [
  "Bid Awarded",
  "Supply Order Received",
  "Material Procurement",
  "Order Complete"
];

const AllBids = () => {
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

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const response = await axios.get(`${API_URL}/bids/completed`, getAuthHeader());
      setBids(response.data);
    } catch (error) {
      toast.error("Failed to load completed bids");
    } finally {
      setLoading(false);
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
    <div className="space-y-6" data-testid="all-bids-page">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Working Bids</h2>
        <p className="text-slate-500 mt-1">View awarded and completed GEM bids</p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search anything (Bid No, Description, Firm Name...)"
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
                  {COMPLETED_STATUSES.map((status) => (
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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-100 text-green-600">
              <Archive size={20} />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Completed Bids</CardTitle>
              <CardDescription className="text-slate-500">
                {filteredBids.length} completed bid{filteredBids.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBids.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium text-slate-800">No completed bids</h3>
              <p className="mt-2 text-slate-500">
                Bids will appear here when their status is set to &quot;Order Complete&quot;
              </p>
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
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          {bid.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/gem-bid/view/${bid.id}`)}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            data-testid={`view-bid-${bid.id}`}
                          >
                            <Eye size={16} />
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

export default AllBids;
