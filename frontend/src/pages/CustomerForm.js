import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, User } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    reference_name: "",
    contact_number: "",
    email: ""
  });

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers/${id}`, getAuthHeader());
      setFormData({
        customer_name: response.data.customer_name || "",
        reference_name: response.data.reference_name || "",
        contact_number: response.data.contact_number || "",
        email: response.data.email || ""
      });
    } catch (error) {
      toast.error("Failed to load customer");
      navigate("/customers");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await axios.put(`${API_URL}/customers/${id}`, formData, getAuthHeader());
        toast.success("Customer updated");
      } else {
        await axios.post(`${API_URL}/customers`, formData, getAuthHeader());
        toast.success("Customer created");
      }
      navigate("/customers");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" data-testid="customer-form-page">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/customers")}
          className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          data-testid="back-btn"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? "Edit Customer" : "New Customer"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? "Update customer information" : "Add a new customer to your database"}
          </p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
              <User size={20} />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Customer Details</CardTitle>
              <CardDescription className="text-slate-500">
                Fill in the customer information below
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="customer_name" className="text-slate-700 font-medium">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  className="bg-white border-slate-300 text-slate-800 focus:border-indigo-500"
                  required
                  data-testid="customer-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_name" className="text-slate-700 font-medium">
                  Reference Name
                </Label>
                <Input
                  id="reference_name"
                  name="reference_name"
                  value={formData.reference_name}
                  onChange={handleChange}
                  placeholder="Enter reference"
                  className="bg-white border-slate-300 text-slate-800 focus:border-indigo-500"
                  data-testid="reference-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_number" className="text-slate-700 font-medium">
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact_number"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="bg-white border-slate-300 text-slate-800 focus:border-indigo-500"
                  required
                  data-testid="contact-number-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="bg-white border-slate-300 text-slate-800 focus:border-indigo-500"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/customers")}
                className="border-slate-300 text-slate-600 hover:bg-slate-100"
                data-testid="cancel-btn"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                data-testid="save-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save size={16} />
                    {isEdit ? "Update" : "Create"} Customer
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerForm;
