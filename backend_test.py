#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class CRMAPITester:
    def __init__(self, base_url="https://salestracker-124.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_ids = {
            'customers': [],
            'leads': [],
            'proforma_invoices': [],
            'purchase_orders': []
        }

    def log_result(self, test_name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {error}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "error": error
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json() if response.content else {}
                    self.log_result(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_result(name, True, f"Status: {response.status_code}")
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_result(name, False, error=error_msg)
                return False, {}

        except Exception as e:
            self.log_result(name, False, error=f"Exception: {str(e)}")
            return False, {}

    def test_login_valid(self):
        """Test login with valid credentials"""
        success, response = self.run_test(
            "Login with valid credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "sunil@bora.tech", "password": "sunil@1202"}
        )
        if success and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_login_invalid(self):
        """Test login with invalid credentials"""
        success, _ = self.run_test(
            "Login with invalid credentials",
            "POST",
            "auth/login",
            401,
            data={"email": "wrong@email.com", "password": "wrongpass"}
        )
        return success

    def test_auth_verify(self):
        """Test auth verification"""
        success, _ = self.run_test(
            "Auth verification",
            "GET",
            "auth/verify",
            200
        )
        return success

    def test_dashboard_kpi(self):
        """Test dashboard KPI endpoint"""
        success, response = self.run_test(
            "Dashboard KPI",
            "GET",
            "dashboard/kpi",
            200
        )
        if success:
            required_fields = ['total_customers', 'active_leads', 'total_proforma_invoices', 'total_purchase_orders', 'margin_summary']
            for field in required_fields:
                if field not in response:
                    self.log_result(f"Dashboard KPI - {field} field", False, error=f"Missing {field}")
                    return False
            self.log_result("Dashboard KPI - All fields present", True)
        return success

    def test_customer_crud(self):
        """Test customer CRUD operations"""
        # Create customer
        customer_data = {
            "customer_name": "Test Customer API",
            "reference_name": "REF-TEST-001",
            "contact_number": "9876543210",
            "email": "test@example.com"
        }
        
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        
        if not success:
            return False
            
        customer_id = response.get('id')
        if customer_id:
            self.created_ids['customers'].append(customer_id)
        
        # Get all customers
        success, _ = self.run_test(
            "Get All Customers",
            "GET",
            "customers",
            200
        )
        
        if not success:
            return False
        
        # Get specific customer
        if customer_id:
            success, _ = self.run_test(
                "Get Specific Customer",
                "GET",
                f"customers/{customer_id}",
                200
            )
            
            if not success:
                return False
            
            # Update customer
            update_data = {
                "customer_name": "Updated Test Customer",
                "reference_name": "REF-TEST-002",
                "contact_number": "9876543211",
                "email": "updated@example.com"
            }
            
            success, _ = self.run_test(
                "Update Customer",
                "PUT",
                f"customers/{customer_id}",
                200,
                data=update_data
            )
        
        return success

    def test_lead_crud(self):
        """Test lead CRUD operations"""
        # First ensure we have a customer
        if not self.created_ids['customers']:
            self.test_customer_crud()
        
        if not self.created_ids['customers']:
            self.log_result("Lead CRUD - No customer available", False, error="Cannot test leads without customer")
            return False
        
        customer_id = self.created_ids['customers'][0]
        
        # Create lead
        lead_data = {
            "customer_id": customer_id,
            "customer_name": "Test Customer API",
            "proforma_invoice_number": "PI-TEST-001",
            "date": "2024-01-15",
            "products": [
                {
                    "product": "Test Product",
                    "category": "Electronics",
                    "quantity": 10,
                    "price": 100,
                    "amount": 1000
                }
            ],
            "follow_up_date": "2024-01-20",
            "remark": "Test lead"
        }
        
        success, response = self.run_test(
            "Create Lead",
            "POST",
            "leads",
            200,
            data=lead_data
        )
        
        if not success:
            return False
            
        lead_id = response.get('id')
        if lead_id:
            self.created_ids['leads'].append(lead_id)
        
        # Get all leads
        success, _ = self.run_test(
            "Get All Leads",
            "GET",
            "leads",
            200
        )
        
        if not success:
            return False
        
        # Get specific lead
        if lead_id:
            success, _ = self.run_test(
                "Get Specific Lead",
                "GET",
                f"leads/{lead_id}",
                200
            )
        
        return success

    def test_lead_conversion(self):
        """Test lead conversion to proforma invoice"""
        if not self.created_ids['leads']:
            self.test_lead_crud()
        
        if not self.created_ids['leads']:
            self.log_result("Lead Conversion - No lead available", False, error="Cannot test conversion without lead")
            return False
        
        lead_id = self.created_ids['leads'][0]
        
        success, response = self.run_test(
            "Convert Lead to Proforma Invoice",
            "POST",
            f"leads/{lead_id}/convert",
            200,
            data={"proforma_invoice_number": "PI-CONVERTED-001"}
        )
        
        if success and response.get('id'):
            self.created_ids['proforma_invoices'].append(response['id'])
        
        return success

    def test_proforma_invoices(self):
        """Test proforma invoice operations"""
        # Ensure we have converted leads
        if not self.created_ids['proforma_invoices']:
            self.test_lead_conversion()
        
        # Get all proforma invoices
        success, _ = self.run_test(
            "Get All Proforma Invoices",
            "GET",
            "proforma-invoices",
            200
        )
        
        if not success:
            return False
        
        # Get specific proforma invoice
        if self.created_ids['proforma_invoices']:
            pi_id = self.created_ids['proforma_invoices'][0]
            success, _ = self.run_test(
                "Get Specific Proforma Invoice",
                "GET",
                f"proforma-invoices/{pi_id}",
                200
            )
        
        return success

    def test_purchase_order_crud(self):
        """Test purchase order CRUD operations"""
        # Create purchase order with single product (new format)
        po_data = {
            "purchase_order_number": "PO-TEST-001",
            "date": "2024-01-15",
            "vendor_name": "Test Vendor",
            "purpose": "stock_in_sale",
            "products": [
                {
                    "product": "Test Product PO",
                    "category": "Hardware",
                    "quantity": 5,
                    "price": 80,
                    "amount": 400
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Purchase Order (Single Product)",
            "POST",
            "purchase-orders",
            200,
            data=po_data
        )
        
        if not success:
            return False
            
        po_id = response.get('id')
        if po_id:
            self.created_ids['purchase_orders'].append(po_id)
        
        # Verify total amount calculation
        if response.get('total_amount') != 400:
            self.log_result("PO Single Product - Amount Calculation", False, error=f"Expected 400, got {response.get('total_amount')}")
            return False
        else:
            self.log_result("PO Single Product - Amount Calculation", True)
        
        # Get all purchase orders
        success, _ = self.run_test(
            "Get All Purchase Orders",
            "GET",
            "purchase-orders",
            200
        )
        
        if not success:
            return False
        
        # Get specific purchase order
        if po_id:
            success, response = self.run_test(
                "Get Specific Purchase Order",
                "GET",
                f"purchase-orders/{po_id}",
                200
            )
            
            if success:
                # Verify products array exists
                if 'products' not in response or not response['products']:
                    self.log_result("PO Single Product - Products Array", False, error="Products array missing or empty")
                    return False
                else:
                    self.log_result("PO Single Product - Products Array", True)
        
        return success

    def test_multi_product_purchase_order(self):
        """Test purchase order with multiple products"""
        # Create purchase order with multiple products
        po_data = {
            "purchase_order_number": "PO-MULTI-001",
            "date": "2024-01-16",
            "vendor_name": "Multi Product Vendor",
            "purpose": "stock_in_sale",
            "products": [
                {
                    "product": "Product A",
                    "category": "Electronics",
                    "quantity": 10,
                    "price": 50,
                    "amount": 500
                },
                {
                    "product": "Product B",
                    "category": "Hardware",
                    "quantity": 5,
                    "price": 100,
                    "amount": 500
                },
                {
                    "product": "Product C",
                    "category": "Software",
                    "quantity": 2,
                    "price": 250,
                    "amount": 500
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Multi-Product Purchase Order",
            "POST",
            "purchase-orders",
            200,
            data=po_data
        )
        
        if not success:
            return False
            
        po_id = response.get('id')
        if po_id:
            self.created_ids['purchase_orders'].append(po_id)
        
        # Verify total amount calculation (500 + 500 + 500 = 1500)
        expected_total = 1500
        if response.get('total_amount') != expected_total:
            self.log_result("Multi-Product PO - Total Amount", False, error=f"Expected {expected_total}, got {response.get('total_amount')}")
            return False
        else:
            self.log_result("Multi-Product PO - Total Amount", True)
        
        # Verify products count
        if len(response.get('products', [])) != 3:
            self.log_result("Multi-Product PO - Products Count", False, error=f"Expected 3 products, got {len(response.get('products', []))}")
            return False
        else:
            self.log_result("Multi-Product PO - Products Count", True)
        
        return success

    def test_edit_purchase_order(self):
        """Test editing purchase order - add/remove products"""
        # First create a PO to edit
        if not self.created_ids['purchase_orders']:
            self.test_purchase_order_crud()
        
        if not self.created_ids['purchase_orders']:
            self.log_result("Edit PO - No PO available", False, error="Cannot test edit without existing PO")
            return False
        
        po_id = self.created_ids['purchase_orders'][0]
        
        # Update PO with additional products
        update_data = {
            "purchase_order_number": "PO-TEST-001-UPDATED",
            "date": "2024-01-15",
            "vendor_name": "Test Vendor Updated",
            "purpose": "stock_in_sale",
            "products": [
                {
                    "product": "Original Product",
                    "category": "Hardware",
                    "quantity": 5,
                    "price": 80,
                    "amount": 400
                },
                {
                    "product": "Added Product",
                    "category": "Software",
                    "quantity": 3,
                    "price": 200,
                    "amount": 600
                }
            ]
        }
        
        success, response = self.run_test(
            "Update Purchase Order (Add Product)",
            "PUT",
            f"purchase-orders/{po_id}",
            200,
            data=update_data
        )
        
        if not success:
            return False
        
        # Verify updated total amount (400 + 600 = 1000)
        expected_total = 1000
        if response.get('total_amount') != expected_total:
            self.log_result("Edit PO - Updated Total Amount", False, error=f"Expected {expected_total}, got {response.get('total_amount')}")
            return False
        else:
            self.log_result("Edit PO - Updated Total Amount", True)
        
        # Verify products count increased
        if len(response.get('products', [])) != 2:
            self.log_result("Edit PO - Updated Products Count", False, error=f"Expected 2 products, got {len(response.get('products', []))}")
            return False
        else:
            self.log_result("Edit PO - Updated Products Count", True)
        
        return success

    def test_linked_purchase_order(self):
        """Test creating purchase order linked to proforma invoice"""
        if not self.created_ids['proforma_invoices']:
            self.test_lead_conversion()
        
        if not self.created_ids['proforma_invoices']:
            self.log_result("Linked PO - No proforma invoice available", False, error="Cannot test linked PO without PI")
            return False
        
        pi_id = self.created_ids['proforma_invoices'][0]
        
        po_data = {
            "purchase_order_number": "PO-LINKED-001",
            "date": "2024-01-16",
            "vendor_name": "Linked Vendor",
            "purpose": "linked",
            "proforma_invoice_id": pi_id,
            "products": [
                {
                    "product": "Linked Product A",
                    "category": "Electronics",
                    "quantity": 3,
                    "price": 200,
                    "amount": 600
                },
                {
                    "product": "Linked Product B",
                    "category": "Hardware",
                    "quantity": 2,
                    "price": 150,
                    "amount": 300
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Linked Multi-Product Purchase Order",
            "POST",
            "purchase-orders",
            200,
            data=po_data
        )
        
        if success and response.get('id'):
            self.created_ids['purchase_orders'].append(response['id'])
            
            # Verify total amount for linked PO (600 + 300 = 900)
            expected_total = 900
            if response.get('total_amount') != expected_total:
                self.log_result("Linked Multi-Product PO - Total Amount", False, error=f"Expected {expected_total}, got {response.get('total_amount')}")
                return False
            else:
                self.log_result("Linked Multi-Product PO - Total Amount", True)
        
        return success

    def test_margin_calculator(self):
        """Test margin calculator"""
        # Ensure we have linked PO
        if not any(po for po in self.created_ids['purchase_orders']):
            self.test_linked_purchase_order()
        
        success, response = self.run_test(
            "Get Margin Calculator Data",
            "GET",
            "margin-calculator",
            200
        )
        
        if success and response:
            # Test updating freight for first margin entry
            if len(response) > 0:
                margin_entry = response[0]
                pi_id = margin_entry.get('proforma_invoice_id')
                po_id = margin_entry.get('purchase_order_id')
                
                if pi_id and po_id:
                    success, _ = self.run_test(
                        "Update Margin Freight",
                        "PUT",
                        f"margin-calculator/{pi_id}/{po_id}",
                        200,
                        data={"freight_amount": 50}
                    )
        
        return success

    def test_template_downloads(self):
        """Test template download endpoints"""
        endpoints = [
            ("Customer Template", "customers/template/download"),
            ("Lead Template", "leads/template/download"),
            ("Purchase Order Template", "purchase-orders/template/download")
        ]
        
        all_success = True
        for name, endpoint in endpoints:
            try:
                url = f"{self.base_url}/{endpoint}"
                headers = {}
                if self.token:
                    headers['Authorization'] = f'Bearer {self.token}'
                
                response = requests.get(url, headers=headers, timeout=10)
                success = response.status_code == 200
                
                if success:
                    self.log_result(f"Download {name}", True)
                else:
                    self.log_result(f"Download {name}", False, error=f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_result(f"Download {name}", False, error=str(e))
                all_success = False
        
        return all_success

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete purchase orders
        for po_id in self.created_ids['purchase_orders']:
            try:
                self.run_test(f"Delete PO {po_id}", "DELETE", f"purchase-orders/{po_id}", 200)
            except:
                pass
        
        # Delete proforma invoices
        for pi_id in self.created_ids['proforma_invoices']:
            try:
                self.run_test(f"Delete PI {pi_id}", "DELETE", f"proforma-invoices/{pi_id}", 200)
            except:
                pass
        
        # Delete leads
        for lead_id in self.created_ids['leads']:
            try:
                self.run_test(f"Delete Lead {lead_id}", "DELETE", f"leads/{lead_id}", 200)
            except:
                pass
        
        # Delete customers
        for customer_id in self.created_ids['customers']:
            try:
                self.run_test(f"Delete Customer {customer_id}", "DELETE", f"customers/{customer_id}", 200)
            except:
                pass

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting CRM API Tests...")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication tests
        print("\n🔐 Authentication Tests")
        if not self.test_login_valid():
            print("❌ Cannot proceed without valid login")
            return False
        
        self.test_login_invalid()
        self.test_auth_verify()
        
        # Core functionality tests
        print("\n📊 Dashboard Tests")
        self.test_dashboard_kpi()
        
        print("\n👥 Customer Tests")
        self.test_customer_crud()
        
        print("\n📋 Lead Tests")
        self.test_lead_crud()
        self.test_lead_conversion()
        
        print("\n📄 Proforma Invoice Tests")
        self.test_proforma_invoices()
        
        print("\n🛒 Purchase Order Tests")
        self.test_purchase_order_crud()
        self.test_multi_product_purchase_order()
        self.test_edit_purchase_order()
        self.test_linked_purchase_order()
        
        print("\n💰 Margin Calculator Tests")
        self.test_margin_calculator()
        
        print("\n📥 Template Download Tests")
        self.test_template_downloads()
        
        # Cleanup
        self.cleanup_test_data()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = CRMAPITester()
    
    try:
        success = tester.run_all_tests()
        all_passed = tester.print_summary()
        
        # Save results to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"/app/test_reports/backend_api_results_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump({
                "timestamp": timestamp,
                "total_tests": tester.tests_run,
                "passed_tests": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
                "test_results": tester.test_results
            }, f, indent=2)
        
        print(f"\n📁 Results saved to: {results_file}")
        
        return 0 if all_passed else 1
        
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())