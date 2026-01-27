import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useGemBidAuth } from "../../context/GemBidAuthContext";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Upload, FileText, ExternalLink, Trash2, Calendar, MapPin, Building, Tag, Gavel, Clock, FolderOpen } from "lucide-react";

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

const BidDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useGemBidAuth();
  const [bid, setBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBid();
  }, [id]);

  const fetchBid = async () => {
    try {
      const response = await axios.get(`${API_URL}/bids/${id}`, getAuthHeader());
      setBid(response.data);
    } catch (error) {
      toast.error("Failed to load bid");
      navigate("/gem-bid");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_URL}/bids/${id}/documents`, formData, {
        ...getAuthHeader(),
        headers: {
          ...getAuthHeader().headers,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Document uploaded");
      fetchBid();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload document");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteDocument = async (docIndex) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await axios.delete(`${API_URL}/bids/${id}/documents/${docIndex}`, getAuthHeader());
      toast.success("Document deleted");
      fetchBid();
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const isCompleted = bid?.status === "Order Complete";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!bid) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="bid-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isCompleted ? "/gem-bid/all" : "/gem-bid")}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            data-testid="back-btn"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 font-mono">
              {bid.gem_bid_no}
            </h1>
            <p className="text-slate-500 mt-1">Bid Details</p>
          </div>
        </div>
        {!isCompleted && (
          <Button
            onClick={() => navigate(`/gem-bid/edit/${id}`)}
            className="bg-amber-600 hover:bg-amber-700 text-white"
            data-testid="edit-btn"
          >
            <Pencil size={16} className="mr-2" />
            Edit Bid
          </Button>
        )}
      </div>

      {/* Bid Information Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <Gavel size={20} />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800">Bid Information</CardTitle>
                <CardDescription className="text-slate-500">
                  Primary bid details
                </CardDescription>
              </div>
            </div>
            <Badge className={STATUS_COLORS[bid.status] || "bg-slate-100 text-slate-700"}>
              {bid.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-slate-400" />
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Start Date</p>
              </div>
              <p className="text-lg text-slate-800">
                {new Date(bid.start_date).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-slate-400" />
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">End Date</p>
              </div>
              <p className="text-lg text-slate-800">
                {new Date(bid.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-xs text-emerald-600 uppercase tracking-wider font-medium mb-2">EMD Amount</p>
              <p className="text-lg font-mono font-bold text-emerald-700">
                ₹{bid.emd_amount?.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-600 uppercase tracking-wider font-medium mb-2">Quantity</p>
              <p className="text-lg font-mono font-bold text-blue-700">
                {bid.quantity}
              </p>
            </div>
          </div>

          {/* Description */}
          {bid.description && (
            <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Description</p>
              <p className="text-slate-700">{bid.description}</p>
            </div>
          )}

          {/* Additional Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {bid.city && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={14} className="text-slate-400" />
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">City</p>
                </div>
                <p className="text-slate-800">{bid.city}</p>
              </div>
            )}
            {bid.department && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Building size={14} className="text-slate-400" />
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Department</p>
                </div>
                <p className="text-slate-800">{bid.department}</p>
              </div>
            )}
            {bid.item_category && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={14} className="text-slate-400" />
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Item Category</p>
                </div>
                <p className="text-slate-800">{bid.item_category}</p>
              </div>
            )}
            {(bid.epbg_percentage || bid.epbg_month) && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">EPBG</p>
                <p className="text-slate-800">
                  {bid.epbg_percentage}% / {bid.epbg_month} months
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status History Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <Clock size={20} />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Status History</CardTitle>
              <CardDescription className="text-slate-500">
                Track of all status changes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bid.status_history?.length > 0 ? (
            <div className="space-y-3">
              {bid.status_history.slice().reverse().map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <div className="flex-1">
                    <Badge className={STATUS_COLORS[item.status] || "bg-slate-100 text-slate-700"}>
                      {item.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-slate-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No status history available</p>
          )}
        </CardContent>
      </Card>

      {/* Documents Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <FolderOpen size={20} />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800">Documents</CardTitle>
                <CardDescription className="text-slate-500">
                  Uploaded documents for this bid
                </CardDescription>
              </div>
            </div>
            {!isCompleted && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png"
                  onChange={handleDocumentUpload}
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
                    {uploading ? "Uploading..." : "Upload Document"}
                  </span>
                </Button>
              </label>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {bid.documents?.length > 0 ? (
            <div className="space-y-3">
              {bid.documents.map((doc, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium">{doc.filename}</p>
                      <p className="text-xs text-slate-500">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(process.env.REACT_APP_BACKEND_URL + doc.url, '_blank')}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                      data-testid={`view-doc-${index}`}
                    >
                      <ExternalLink size={16} className="mr-2" />
                      View
                    </Button>
                    {!isCompleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(index)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        data-testid={`delete-doc-${index}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-500">No documents uploaded</p>
              {!isCompleted && (
                <p className="text-sm text-slate-400 mt-1">
                  Upload documents using the button above
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BidDetail;
