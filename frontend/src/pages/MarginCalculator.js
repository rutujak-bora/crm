import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";
import { Calculator, TrendingUp, DollarSign, FileText } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const MarginCalculator = () => {
  const { getAuthHeader } = useAuth();
  const [marginData, setMarginData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchMarginData();
  }, []);

  const fetchMarginData = async () => {
    try {
      const response = await axios.get(`${API_URL}/margin-calculator`, getAuthHeader());
      setMarginData(response.data);
    } catch (error) {
      toast.error("Failed to load margin data");
    } finally {
      setLoading(false);
    }
  };

  const handleFreightChange = async (proformaId, poId, freightValue) => {
    const newFreight = parseFloat(freightValue) || 0;
    
    // Update locally first for responsive UI
    setMarginData(prev => prev.map(item => {
      if (item.proforma_invoice_id === proformaId && item.purchase_order_id === poId) {
        return {
          ...item,
          freight_amount: newFreight,
          margin_amount: item.remaining_amount - newFreight
        };
      }
      return item;
    }));

    // Debounced save
    setUpdatingId(`${proformaId}-${poId}`);
    try {
      await axios.put(
        `${API_URL}/margin-calculator/${proformaId}/${poId}`,
        { freight_amount: newFreight },
        getAuthHeader()
      );
    } catch (error) {
      toast.error("Failed to update freight");
      fetchMarginData(); // Revert on error
    } finally {
      setUpdatingId(null);
    }
  };

  const totalMargin = marginData.reduce((sum, item) => sum + (item.margin_amount || 0), 0);
  const totalFreight = marginData.reduce((sum, item) => sum + (item.freight_amount || 0), 0);
  const totalProformaAmount = marginData.reduce((sum, item) => sum + (item.proforma_total_amount || 0), 0);
  const totalPurchaseAmount = marginData.reduce((sum, item) => sum + (item.purchase_order_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="margin-calculator-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Margin Calculator</h1>
        <p className="text-slate-500 mt-1">Calculate profitability for linked proforma invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="kpi-card bg-white border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Proforma</p>
                <p className="text-2xl font-mono font-bold text-slate-800 mt-1">
                  ₹{totalProformaAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-100 text-teal-600">
                <DollarSign size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card bg-white border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Purchase</p>
                <p className="text-2xl font-mono font-bold text-slate-800 mt-1">
                  ₹{totalPurchaseAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
                <Calculator size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card bg-white border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Freight</p>
                <p className="text-2xl font-mono font-bold text-slate-800 mt-1">
                  ₹{totalFreight.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                <TrendingUp size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card bg-gradient-to-r from-emerald-500 to-emerald-600 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-100 uppercase tracking-wider font-medium">Total Margin</p>
                <p className={`text-2xl font-mono font-bold mt-1 text-white`}>
                  ₹{totalMargin.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20 text-white">
                <TrendingUp size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Margin Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Margin Details</CardTitle>
          <CardDescription className="text-slate-500">
            Proforma invoices with linked purchase orders. Enter freight amount to calculate margin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {marginData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No linked proforma invoices found</p>
              <p className="text-sm text-slate-400 mt-1">
                Link purchase orders to proforma invoices to calculate margins
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-slate-200 hover:bg-slate-50">
                    <TableHead className="text-slate-600 font-semibold">Proforma Invoice</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">PI Amount</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Purchase Order</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">PO Amount</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">Remaining</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-center">Freight (₹)</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marginData.map((item, index) => (
                    <TableRow
                      key={`${item.proforma_invoice_id}-${item.purchase_order_id}`}
                      className={`border-slate-200 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      data-testid={`margin-row-${index}`}
                    >
                      <TableCell className="text-slate-800 font-mono font-semibold">
                        {item.proforma_invoice_number}
                      </TableCell>
                      <TableCell className="text-slate-700 text-right font-mono">
                        ₹{item.proforma_total_amount?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-slate-600 font-mono">
                        {item.purchase_order_number}
                      </TableCell>
                      <TableCell className="text-slate-700 text-right font-mono">
                        ₹{item.purchase_order_amount?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-blue-600 text-right font-mono font-medium">
                        ₹{item.remaining_amount?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.freight_amount || 0}
                          onChange={(e) => handleFreightChange(
                            item.proforma_invoice_id,
                            item.purchase_order_id,
                            e.target.value
                          )}
                          className="w-28 mx-auto bg-white border-slate-300 text-slate-800 text-right font-mono focus:border-indigo-500"
                          data-testid={`freight-input-${index}`}
                        />
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold ${item.margin_amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{item.margin_amount?.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formula Explanation */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Calculation Formula</h3>
              <div className="mt-2 text-sm text-slate-600 font-mono">
                <p className="mb-1">
                  <span className="text-blue-600 font-medium">Remaining Amount</span> = Proforma Invoice Total − Purchase Order Total
                </p>
                <p>
                  <span className="text-emerald-600 font-medium">Margin Amount</span> = Remaining Amount − Freight Amount
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarginCalculator;
