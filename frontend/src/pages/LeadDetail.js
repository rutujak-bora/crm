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
import { ArrowLeft, Edit2, ClipboardList, Calendar, User, FileText, ExternalLink, FileSpreadsheet, Trash2, CheckCircle, XCircle, FolderOpen } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDoc, setDeleteDoc] = useState(null); // 'tender' or 'working'
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await axios.get(`${API_URL}/leads/${id}`, getAuthHeader());
      setLead(response.data);
    } catch (error) {
      toast.error("Failed to load lead");
      navigate("/leads");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteDoc) return;
    
    setDeleting(true);
    try {
      const endpoint = deleteDoc === 'tender' 
        ? `${API_URL}/leads/${id}/tender-document`
        : `${API_URL}/leads/${id}/working-sheet`;
      
      await axios.delete(endpoint, getAuthHeader());
      
      // Update local state
      if (deleteDoc === 'tender') {
        setLead({ ...lead, tender_document: null });
      } else {
        setLead({ ...lead, working_sheet: null });
      }
      
      toast.success(`${deleteDoc === 'tender' ? 'Tender Document' : 'Working Sheet'} removed successfully`);
    } catch (error) {
      toast.error(`Failed to remove ${deleteDoc === 'tender' ? 'tender document' : 'working sheet'}`);
    } finally {
      setDeleting(false);
      setDeleteDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="lead-detail-page">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/leads")}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            data-testid="back-btn"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Lead Details
            </h1>
            <p className="text-slate-500 mt-1">View complete lead information, products and documents</p>
          </div>
        </div>
        {!lead.is_converted && (
          <Button
            asChild
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            data-testid="edit-btn"
          >
            <Link to={`/leads/${id}/edit`}>
              <Edit2 size={16} className="mr-2" />
              Edit Lead
            </Link>
          </Button>
        )}
      </div>

      {/* Lead Information Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <ClipboardList size={20} />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Lead Information</CardTitle>
              <CardDescription className="text-slate-500">
                Customer enquiry details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-slate-400" />
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Customer</p>
              </div>
              <p className="text-lg text-slate-800 font-medium">{lead.customer_name}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-slate-400" />
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">PI Number</p>
              </div>
              <p className="text-lg font-mono text-slate-800">
                {lead.proforma_invoice_number || "—"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-slate-400" />
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Date</p>
              </div>
              <p className="text-lg text-slate-800">
                {new Date(lead.date).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Status</p>
              {lead.is_converted ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Converted
                </Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                  Pending
                </Badge>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {lead.follow_up_date && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Follow-up Date</p>
                <p className="text-slate-800">{new Date(lead.follow_up_date).toLocaleDateString()}</p>
              </div>
            )}
            {lead.remark && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Remark</p>
                <p className="text-slate-800">{lead.remark}</p>
              </div>
            )}
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
                {lead.products?.length || 0} item{(lead.products?.length || 0) !== 1 ? 's' : ''} in this lead
              </CardDescription>
            </div>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              {lead.products?.length || 0} {(lead.products?.length || 0) === 1 ? 'Item' : 'Items'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-container overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-slate-200 hover:bg-slate-50">
                  <TableHead className="text-slate-600 font-semibold">S.No</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Product</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Part Number</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Category</TableHead>
                  <TableHead className="text-slate-600 font-semibold text-right">Quantity</TableHead>
                  <TableHead className="text-slate-600 font-semibold text-right">Price (₹)</TableHead>
                  <TableHead className="text-slate-600 font-semibold text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lead.products?.map((product, index) => (
                  <TableRow key={index} className={`border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`} data-testid={`product-row-${index}`}>
                    <TableCell className="text-slate-500">{index + 1}</TableCell>
                    <TableCell className="text-slate-800 font-medium">{product.product}</TableCell>
                    <TableCell className="text-slate-600 font-mono text-sm">{product.part_number || "—"}</TableCell>
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
                ₹{lead.total_amount?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Section - Always visible */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <FolderOpen size={20} />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Documents</CardTitle>
              <CardDescription className="text-slate-500">
                Tender document and internal working sheet
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tender Document Row */}
          <div className={`flex items-center justify-between p-4 rounded-lg border ${lead.tender_document ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${lead.tender_document ? 'bg-amber-100' : 'bg-slate-200'}`}>
                <FileText size={20} className={lead.tender_document ? 'text-amber-600' : 'text-slate-400'} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-slate-800 font-medium">Tender Document</p>
                  <span className="text-xs text-slate-500">(Customer Provided)</span>
                </div>
                {lead.tender_document ? (
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <p className="text-sm text-emerald-600 font-medium">Uploaded</p>
                    <span className="text-xs text-slate-500">• {lead.tender_document.split('/').pop()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <XCircle size={14} className="text-slate-400" />
                    <p className="text-sm text-slate-500">Not uploaded</p>
                  </div>
                )}
              </div>
            </div>
            {lead.tender_document && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(process.env.REACT_APP_BACKEND_URL + lead.tender_document, '_blank')}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  data-testid="view-tender-doc-btn"
                >
                  <ExternalLink size={16} className="mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDoc('tender')}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  data-testid="remove-tender-doc-btn"
                >
                  <Trash2 size={16} className="mr-2" />
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Working Sheet Row */}
          <div className={`flex items-center justify-between p-4 rounded-lg border ${lead.working_sheet ? 'bg-cyan-50 border-cyan-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${lead.working_sheet ? 'bg-cyan-100' : 'bg-slate-200'}`}>
                <FileSpreadsheet size={20} className={lead.working_sheet ? 'text-cyan-600' : 'text-slate-400'} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-slate-800 font-medium">Working Sheet</p>
                  <span className="text-xs text-slate-500">(Internal Reference)</span>
                </div>
                {lead.working_sheet ? (
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <p className="text-sm text-emerald-600 font-medium">Uploaded</p>
                    <span className="text-xs text-slate-500">• {lead.working_sheet.split('/').pop()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <XCircle size={14} className="text-slate-400" />
                    <p className="text-sm text-slate-500">Not uploaded</p>
                  </div>
                )}
              </div>
            </div>
            {lead.working_sheet && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(process.env.REACT_APP_BACKEND_URL + lead.working_sheet, '_blank')}
                  className="border-cyan-300 text-cyan-700 hover:bg-cyan-100"
                  data-testid="view-working-sheet-btn"
                >
                  <ExternalLink size={16} className="mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDoc('working')}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  data-testid="remove-working-sheet-btn"
                >
                  <Trash2 size={16} className="mr-2" />
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Hint to upload documents */}
          {!lead.tender_document && !lead.working_sheet && (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500">
                No documents uploaded yet. 
                {!lead.is_converted && (
                  <Link to={`/leads/${id}/edit`} className="text-indigo-600 hover:text-indigo-700 ml-1">
                    Edit lead to upload documents
                  </Link>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">
              Remove {deleteDoc === 'tender' ? 'Tender Document' : 'Working Sheet'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will remove the {deleteDoc === 'tender' ? 'tender document' : 'working sheet'} from this lead. 
              The lead record will not be affected. You can upload a new document later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
              data-testid="confirm-remove-doc-btn"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  Removing...
                </span>
              ) : (
                'Remove Document'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LeadDetail;
