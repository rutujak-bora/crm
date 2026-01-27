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
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Eye, Search, Archive, CheckCircle } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api/gem-bid";

const AllBids = () => {
  const { getAuthHeader } = useGemBidAuth();
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredBids = bids.filter(bid =>
    bid.gem_bid_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2 className="text-2xl font-bold text-slate-800">All Bids</h2>
        <p className="text-slate-500 mt-1">View completed GEM bids (Order Complete)</p>
      </div>

      {/* Search */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Bid No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-slate-300"
              data-testid="search-input"
            />
          </div>
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
                    <TableHead className="text-slate-600 font-semibold">Gem Bid No</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Start Date</TableHead>
                    <TableHead className="text-slate-600 font-semibold">End Date</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">EMD Amount</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">Quantity</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Status</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBids.map((bid, index) => (
                    <TableRow
                      key={bid.id}
                      className={`border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      data-testid={`bid-row-${bid.id}`}
                    >
                      <TableCell className="font-mono text-slate-800 font-medium">
                        {bid.gem_bid_no}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(bid.start_date).toLocaleDateString()}
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
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Order Complete
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
