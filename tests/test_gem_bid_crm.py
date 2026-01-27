"""
GEM BID CRM Module - Backend API Tests
Tests for the separate GEM BID CRM system with its own authentication and data storage
"""
import pytest
import requests
import os
import io
from openpyxl import Workbook

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# GEM BID Credentials
GEM_BID_EMAIL = "yash@bora.tech"
GEM_BID_PASSWORD = "password#@123"

# Main CRM Credentials
CRM_EMAIL = "sunil@bora.tech"
CRM_PASSWORD = "sunil@1202"

# Valid GEM BID Statuses
GEM_BID_STATUSES = [
    "Shortlisted",
    "Participated",
    "Technical Evaluation",
    "RA",
    "Rejected",
    "Bid Awarded",
    "Supply Order Received",
    "Material Procurement",
    "Order Complete"
]


class TestGemBidAuthentication:
    """Test GEM BID authentication - separate from main CRM"""
    
    def test_gem_bid_login_success(self):
        """Test GEM BID login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": GEM_BID_EMAIL,
            "password": GEM_BID_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == GEM_BID_EMAIL
        assert data["user"]["name"] == "Yash Bora"
        assert len(data["token"]) > 0
    
    def test_gem_bid_login_wrong_credentials(self):
        """Test GEM BID login rejects wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_gem_bid_login_wrong_password(self):
        """Test GEM BID login rejects correct email with wrong password"""
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": GEM_BID_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_crm_credentials_rejected_for_gem_bid(self):
        """Test that main CRM credentials don't work for GEM BID login"""
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": CRM_EMAIL,
            "password": CRM_PASSWORD
        })
        assert response.status_code == 401, "CRM credentials should not work for GEM BID"


class TestGemBidTokenIsolation:
    """Test that GEM BID and CRM tokens are isolated"""
    
    @pytest.fixture
    def gem_bid_token(self):
        """Get GEM BID auth token"""
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": GEM_BID_EMAIL,
            "password": GEM_BID_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def crm_token(self):
        """Get main CRM auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CRM_EMAIL,
            "password": CRM_PASSWORD
        })
        return response.json()["token"]
    
    def test_gem_bid_token_works_for_gem_bid_api(self, gem_bid_token):
        """Test GEM BID token works for GEM BID endpoints"""
        response = requests.get(
            f"{BASE_URL}/api/gem-bid/bids",
            headers={"Authorization": f"Bearer {gem_bid_token}"}
        )
        assert response.status_code == 200, f"GEM BID token should work for GEM BID API: {response.text}"
    
    def test_crm_token_rejected_for_gem_bid_api(self, crm_token):
        """Test CRM token is rejected for GEM BID endpoints"""
        response = requests.get(
            f"{BASE_URL}/api/gem-bid/bids",
            headers={"Authorization": f"Bearer {crm_token}"}
        )
        assert response.status_code == 401, "CRM token should be rejected for GEM BID API"
    
    def test_gem_bid_token_rejected_for_crm_api(self, gem_bid_token):
        """Test GEM BID token is rejected for main CRM endpoints"""
        response = requests.get(
            f"{BASE_URL}/api/customers",
            headers={"Authorization": f"Bearer {gem_bid_token}"}
        )
        assert response.status_code == 401, "GEM BID token should be rejected for CRM API"


class TestGemBidCRUD:
    """Test GEM BID CRUD operations"""
    
    @pytest.fixture
    def auth_header(self):
        """Get authenticated header for GEM BID"""
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": GEM_BID_EMAIL,
            "password": GEM_BID_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def test_bid_data(self):
        """Sample bid data for testing"""
        return {
            "gem_bid_no": "TEST_GEM/2024/B/001",
            "description": "Test bid for automated testing",
            "start_date": "2024-01-15",
            "end_date": "2024-02-15",
            "emd_amount": 50000,
            "quantity": 100,
            "city": "Delhi",
            "department": "Ministry of Finance",
            "item_category": "Electronics",
            "epbg_percentage": 5,
            "epbg_month": 12,
            "status": "Shortlisted"
        }
    
    def test_create_bid(self, auth_header, test_bid_data):
        """Test creating a new GEM bid"""
        response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids",
            json=test_bid_data,
            headers=auth_header
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["gem_bid_no"] == test_bid_data["gem_bid_no"]
        assert data["emd_amount"] == test_bid_data["emd_amount"]
        assert data["quantity"] == test_bid_data["quantity"]
        assert data["status"] == "Shortlisted"
        assert "id" in data
        assert "status_history" in data
        assert len(data["status_history"]) == 1
        assert data["status_history"][0]["status"] == "Shortlisted"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/gem-bid/bids/{data['id']}", headers=auth_header)
    
    def test_get_bid_by_id(self, auth_header, test_bid_data):
        """Test getting a bid by ID"""
        # Create bid first
        create_response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids",
            json=test_bid_data,
            headers=auth_header
        )
        bid_id = create_response.json()["id"]
        
        # Get bid
        response = requests.get(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}",
            headers=auth_header
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == bid_id
        assert data["gem_bid_no"] == test_bid_data["gem_bid_no"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/gem-bid/bids/{bid_id}", headers=auth_header)
    
    def test_update_bid(self, auth_header, test_bid_data):
        """Test updating a bid"""
        # Create bid first
        create_response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids",
            json=test_bid_data,
            headers=auth_header
        )
        bid_id = create_response.json()["id"]
        
        # Update bid
        updated_data = test_bid_data.copy()
        updated_data["description"] = "Updated description"
        updated_data["emd_amount"] = 75000
        
        response = requests.put(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}",
            json=updated_data,
            headers=auth_header
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["description"] == "Updated description"
        assert data["emd_amount"] == 75000
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/gem-bid/bids/{bid_id}", headers=auth_header)
    
    def test_delete_bid(self, auth_header, test_bid_data):
        """Test deleting a bid"""
        # Create bid first
        create_response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids",
            json=test_bid_data,
            headers=auth_header
        )
        bid_id = create_response.json()["id"]
        
        # Delete bid
        response = requests.delete(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}",
            headers=auth_header
        )
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}",
            headers=auth_header
        )
        assert get_response.status_code == 404


class TestGemBidStatusManagement:
    """Test GEM BID status management and history"""
    
    @pytest.fixture
    def auth_header(self):
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": GEM_BID_EMAIL,
            "password": GEM_BID_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def created_bid(self, auth_header):
        """Create a bid for testing"""
        bid_data = {
            "gem_bid_no": "TEST_STATUS/2024/B/001",
            "start_date": "2024-01-15",
            "end_date": "2024-02-15",
            "emd_amount": 50000,
            "quantity": 100,
            "status": "Shortlisted"
        }
        response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids",
            json=bid_data,
            headers=auth_header
        )
        bid = response.json()
        yield bid
        # Cleanup
        requests.delete(f"{BASE_URL}/api/gem-bid/bids/{bid['id']}", headers=auth_header)
    
    def test_all_9_statuses_valid(self, auth_header):
        """Test that all 9 statuses are valid"""
        response = requests.get(
            f"{BASE_URL}/api/gem-bid/statuses",
            headers=auth_header
        )
        assert response.status_code == 200
        
        statuses = response.json()
        assert len(statuses) == 9, f"Expected 9 statuses, got {len(statuses)}"
        
        expected_statuses = [
            "Shortlisted", "Participated", "Technical Evaluation", "RA",
            "Rejected", "Bid Awarded", "Supply Order Received",
            "Material Procurement", "Order Complete"
        ]
        for status in expected_statuses:
            assert status in statuses, f"Status '{status}' not found"
    
    def test_status_change_updates_history(self, auth_header, created_bid):
        """Test that status change adds to status_history"""
        bid_id = created_bid["id"]
        
        # Change status
        response = requests.patch(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}/status?status=Participated",
            headers=auth_header
        )
        assert response.status_code == 200
        
        # Verify status history
        get_response = requests.get(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}",
            headers=auth_header
        )
        data = get_response.json()
        
        assert data["status"] == "Participated"
        assert len(data["status_history"]) == 2
        assert data["status_history"][0]["status"] == "Shortlisted"
        assert data["status_history"][1]["status"] == "Participated"
    
    def test_invalid_status_rejected(self, auth_header, created_bid):
        """Test that invalid status is rejected"""
        bid_id = created_bid["id"]
        
        response = requests.patch(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}/status?status=InvalidStatus",
            headers=auth_header
        )
        assert response.status_code == 400


class TestGemBidSections:
    """Test New Bid and All Bid sections"""
    
    @pytest.fixture
    def auth_header(self):
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": GEM_BID_EMAIL,
            "password": GEM_BID_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_new_bids_excludes_order_complete(self, auth_header):
        """Test that New Bids section excludes Order Complete bids"""
        # Create a bid with Order Complete status
        bid_data = {
            "gem_bid_no": "TEST_COMPLETE/2024/B/001",
            "start_date": "2024-01-15",
            "end_date": "2024-02-15",
            "emd_amount": 50000,
            "quantity": 100,
            "status": "Order Complete"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids",
            json=bid_data,
            headers=auth_header
        )
        bid_id = create_response.json()["id"]
        
        # Get new bids
        response = requests.get(
            f"{BASE_URL}/api/gem-bid/bids/new",
            headers=auth_header
        )
        assert response.status_code == 200
        
        bids = response.json()
        bid_ids = [b["id"] for b in bids]
        assert bid_id not in bid_ids, "Order Complete bid should not be in New Bids"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/gem-bid/bids/{bid_id}", headers=auth_header)
    
    def test_completed_bids_only_order_complete(self, auth_header):
        """Test that All Bids section shows only Order Complete bids"""
        # Create a bid with Order Complete status
        bid_data = {
            "gem_bid_no": "TEST_ALLBID/2024/B/001",
            "start_date": "2024-01-15",
            "end_date": "2024-02-15",
            "emd_amount": 50000,
            "quantity": 100,
            "status": "Order Complete"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids",
            json=bid_data,
            headers=auth_header
        )
        bid_id = create_response.json()["id"]
        
        # Get completed bids
        response = requests.get(
            f"{BASE_URL}/api/gem-bid/bids/completed",
            headers=auth_header
        )
        assert response.status_code == 200
        
        bids = response.json()
        # All bids should have Order Complete status
        for bid in bids:
            assert bid["status"] == "Order Complete", f"Found non-complete bid: {bid['status']}"
        
        # Our test bid should be in the list
        bid_ids = [b["id"] for b in bids]
        assert bid_id in bid_ids, "Order Complete bid should be in completed bids"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/gem-bid/bids/{bid_id}", headers=auth_header)
    
    def test_status_change_to_order_complete_moves_bid(self, auth_header):
        """Test that changing status to Order Complete moves bid to All Bid section"""
        # Create a bid with Shortlisted status
        bid_data = {
            "gem_bid_no": "TEST_MOVE/2024/B/001",
            "start_date": "2024-01-15",
            "end_date": "2024-02-15",
            "emd_amount": 50000,
            "quantity": 100,
            "status": "Shortlisted"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids",
            json=bid_data,
            headers=auth_header
        )
        bid_id = create_response.json()["id"]
        
        # Verify it's in new bids
        new_response = requests.get(f"{BASE_URL}/api/gem-bid/bids/new", headers=auth_header)
        new_bid_ids = [b["id"] for b in new_response.json()]
        assert bid_id in new_bid_ids, "Bid should be in New Bids initially"
        
        # Change status to Order Complete
        requests.patch(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}/status?status=Order Complete",
            headers=auth_header
        )
        
        # Verify it's now in completed bids
        completed_response = requests.get(f"{BASE_URL}/api/gem-bid/bids/completed", headers=auth_header)
        completed_bid_ids = [b["id"] for b in completed_response.json()]
        assert bid_id in completed_bid_ids, "Bid should be in Completed Bids after status change"
        
        # Verify it's NOT in new bids anymore
        new_response2 = requests.get(f"{BASE_URL}/api/gem-bid/bids/new", headers=auth_header)
        new_bid_ids2 = [b["id"] for b in new_response2.json()]
        assert bid_id not in new_bid_ids2, "Bid should not be in New Bids after status change"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/gem-bid/bids/{bid_id}", headers=auth_header)


class TestGemBidDocuments:
    """Test GEM BID document upload and management"""
    
    @pytest.fixture
    def auth_header(self):
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": GEM_BID_EMAIL,
            "password": GEM_BID_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def created_bid(self, auth_header):
        """Create a bid for document testing"""
        bid_data = {
            "gem_bid_no": "TEST_DOC/2024/B/001",
            "start_date": "2024-01-15",
            "end_date": "2024-02-15",
            "emd_amount": 50000,
            "quantity": 100,
            "status": "Shortlisted"
        }
        response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids",
            json=bid_data,
            headers=auth_header
        )
        bid = response.json()
        yield bid
        # Cleanup
        requests.delete(f"{BASE_URL}/api/gem-bid/bids/{bid['id']}", headers=auth_header)
    
    def test_upload_document(self, auth_header, created_bid):
        """Test uploading a document to a bid"""
        bid_id = created_bid["id"]
        
        # Create a test file
        files = {
            "file": ("test_document.pdf", b"Test PDF content", "application/pdf")
        }
        
        response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}/documents",
            files=files,
            headers=auth_header
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "document_url" in data
        assert data["filename"] == "test_document.pdf"
        
        # Verify document is in bid
        get_response = requests.get(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}",
            headers=auth_header
        )
        bid_data = get_response.json()
        assert len(bid_data["documents"]) == 1
        assert bid_data["documents"][0]["filename"] == "test_document.pdf"
    
    def test_delete_document(self, auth_header, created_bid):
        """Test deleting a document from a bid"""
        bid_id = created_bid["id"]
        
        # Upload a document first
        files = {
            "file": ("test_delete.pdf", b"Test PDF content", "application/pdf")
        }
        requests.post(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}/documents",
            files=files,
            headers=auth_header
        )
        
        # Delete the document
        response = requests.delete(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}/documents/0",
            headers=auth_header
        )
        assert response.status_code == 200
        
        # Verify document is removed
        get_response = requests.get(
            f"{BASE_URL}/api/gem-bid/bids/{bid_id}",
            headers=auth_header
        )
        bid_data = get_response.json()
        assert len(bid_data["documents"]) == 0


class TestGemBidExcelOperations:
    """Test Excel template download and bulk upload"""
    
    @pytest.fixture
    def auth_header(self):
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": GEM_BID_EMAIL,
            "password": GEM_BID_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_template_download(self, auth_header):
        """Test downloading Excel template"""
        response = requests.get(
            f"{BASE_URL}/api/gem-bid/template/download",
            headers=auth_header
        )
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
    
    def test_bulk_upload(self, auth_header):
        """Test bulk upload of bids via Excel"""
        # Create Excel file in memory
        wb = Workbook()
        ws = wb.active
        ws.title = "GEM Bids"
        
        # Headers
        headers = [
            "Gem Bid No*", "Description", "Start Date* (YYYY-MM-DD)", "End Date* (YYYY-MM-DD)",
            "EMD Amount*", "Quantity*", "City", "Department", "Item Category",
            "EPBG Percentage", "EPBG Month", "Status*"
        ]
        ws.append(headers)
        
        # Test data
        ws.append([
            "TEST_BULK/2024/B/001", "Bulk upload test", "2024-01-15", "2024-02-15",
            50000, 100, "Delhi", "Ministry of Finance", "Electronics",
            5, 12, "Shortlisted"
        ])
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        # Upload
        files = {
            "file": ("test_bulk.xlsx", output.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        }
        
        response = requests.post(
            f"{BASE_URL}/api/gem-bid/bulk-upload",
            files=files,
            headers=auth_header
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["created"] >= 1, "At least one bid should be created"
        
        # Cleanup - find and delete the test bid
        bids_response = requests.get(f"{BASE_URL}/api/gem-bid/bids", headers=auth_header)
        for bid in bids_response.json():
            if bid["gem_bid_no"] == "TEST_BULK/2024/B/001":
                requests.delete(f"{BASE_URL}/api/gem-bid/bids/{bid['id']}", headers=auth_header)


class TestDataIsolation:
    """Test that GEM BID data is isolated from main CRM"""
    
    @pytest.fixture
    def gem_bid_header(self):
        response = requests.post(f"{BASE_URL}/api/gem-bid/auth/login", json={
            "email": GEM_BID_EMAIL,
            "password": GEM_BID_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def crm_header(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CRM_EMAIL,
            "password": CRM_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_crm_still_works(self, crm_header):
        """Test that main CRM system still works"""
        # Test customers endpoint
        response = requests.get(f"{BASE_URL}/api/customers", headers=crm_header)
        assert response.status_code == 200, "CRM customers endpoint should work"
        
        # Test leads endpoint
        response = requests.get(f"{BASE_URL}/api/leads", headers=crm_header)
        assert response.status_code == 200, "CRM leads endpoint should work"
        
        # Test dashboard
        response = requests.get(f"{BASE_URL}/api/dashboard/kpi", headers=crm_header)
        assert response.status_code == 200, "CRM dashboard should work"
    
    def test_gem_bid_data_not_in_crm(self, gem_bid_header, crm_header):
        """Test that GEM BID data doesn't appear in CRM"""
        # Create a GEM bid
        bid_data = {
            "gem_bid_no": "TEST_ISOLATION/2024/B/001",
            "start_date": "2024-01-15",
            "end_date": "2024-02-15",
            "emd_amount": 50000,
            "quantity": 100,
            "status": "Shortlisted"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/gem-bid/bids",
            json=bid_data,
            headers=gem_bid_header
        )
        bid_id = create_response.json()["id"]
        
        # Check that it doesn't appear in CRM leads
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=crm_header)
        leads = leads_response.json()
        lead_ids = [l.get("id") for l in leads]
        assert bid_id not in lead_ids, "GEM BID should not appear in CRM leads"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/gem-bid/bids/{bid_id}", headers=gem_bid_header)


class TestMainCRMLogin:
    """Test that main CRM login still works"""
    
    def test_crm_login_success(self):
        """Test main CRM login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CRM_EMAIL,
            "password": CRM_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == CRM_EMAIL
    
    def test_gem_bid_credentials_rejected_for_crm(self):
        """Test that GEM BID credentials don't work for main CRM login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GEM_BID_EMAIL,
            "password": GEM_BID_PASSWORD
        })
        assert response.status_code == 401, "GEM BID credentials should not work for CRM"
