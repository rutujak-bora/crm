"""
Test Lead Documents Feature - Tender Document and Working Sheet Delete Functionality
Tests the document upload, view, and delete endpoints for leads
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "sunil@bora.tech"
TEST_PASSWORD = "sunil@1202"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get auth headers"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


@pytest.fixture(scope="module")
def test_customer(auth_headers):
    """Create a test customer for leads"""
    customer_data = {
        "customer_name": "TEST_DocCustomer",
        "reference_name": "DOC-REF",
        "contact_number": "9876543210",
        "email": "test_doc@example.com"
    }
    response = requests.post(f"{BASE_URL}/api/customers", json=customer_data, headers=auth_headers)
    assert response.status_code == 200, f"Failed to create customer: {response.text}"
    customer = response.json()
    yield customer
    # Cleanup
    requests.delete(f"{BASE_URL}/api/customers/{customer['id']}", headers=auth_headers)


@pytest.fixture(scope="module")
def test_lead(auth_headers, test_customer):
    """Create a test lead for document testing"""
    lead_data = {
        "customer_id": test_customer["id"],
        "customer_name": test_customer["customer_name"],
        "date": "2024-01-15",
        "products": [
            {
                "product": "Test Product",
                "part_number": "TP-001",
                "category": "Electronics",
                "quantity": 10,
                "price": 100,
                "amount": 1000
            }
        ],
        "follow_up_date": "2024-01-20",
        "remark": "Test lead for document testing"
    }
    response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
    assert response.status_code == 200, f"Failed to create lead: {response.text}"
    lead = response.json()
    yield lead
    # Cleanup
    requests.delete(f"{BASE_URL}/api/leads/{lead['id']}", headers=auth_headers)


class TestLeadDocumentEndpoints:
    """Test document upload and delete endpoints"""
    
    def test_get_lead_without_documents(self, auth_headers, test_lead):
        """Test that lead can be fetched and shows no documents initially"""
        response = requests.get(f"{BASE_URL}/api/leads/{test_lead['id']}", headers=auth_headers)
        assert response.status_code == 200
        lead = response.json()
        assert lead.get("tender_document") is None, "New lead should have no tender document"
        assert lead.get("working_sheet") is None, "New lead should have no working sheet"
        print("✓ Lead without documents shows null for both document fields")
    
    def test_upload_tender_document(self, auth_headers, test_lead):
        """Test uploading a tender document"""
        # Create a simple PDF-like file
        file_content = b"%PDF-1.4 test content"
        files = {"file": ("test_tender.pdf", io.BytesIO(file_content), "application/pdf")}
        headers = {"Authorization": auth_headers["Authorization"]}
        
        response = requests.post(
            f"{BASE_URL}/api/leads/{test_lead['id']}/upload-tender-document",
            files=files,
            headers=headers
        )
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert "document_url" in data
        assert data["document_url"].startswith("/api/uploads/")
        print(f"✓ Tender document uploaded: {data['document_url']}")
    
    def test_verify_tender_document_uploaded(self, auth_headers, test_lead):
        """Verify tender document is persisted in lead"""
        response = requests.get(f"{BASE_URL}/api/leads/{test_lead['id']}", headers=auth_headers)
        assert response.status_code == 200
        lead = response.json()
        assert lead.get("tender_document") is not None, "Tender document should be set"
        assert lead["tender_document"].startswith("/api/uploads/")
        print(f"✓ Tender document persisted: {lead['tender_document']}")
    
    def test_upload_working_sheet(self, auth_headers, test_lead):
        """Test uploading a working sheet"""
        file_content = b"test xlsx content"
        files = {"file": ("test_working.xlsx", io.BytesIO(file_content), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        headers = {"Authorization": auth_headers["Authorization"]}
        
        response = requests.post(
            f"{BASE_URL}/api/leads/{test_lead['id']}/upload-working-sheet",
            files=files,
            headers=headers
        )
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert "document_url" in data
        assert "ws_" in data["document_url"], "Working sheet should have ws_ prefix"
        print(f"✓ Working sheet uploaded: {data['document_url']}")
    
    def test_verify_working_sheet_uploaded(self, auth_headers, test_lead):
        """Verify working sheet is persisted in lead"""
        response = requests.get(f"{BASE_URL}/api/leads/{test_lead['id']}", headers=auth_headers)
        assert response.status_code == 200
        lead = response.json()
        assert lead.get("working_sheet") is not None, "Working sheet should be set"
        assert "ws_" in lead["working_sheet"], "Working sheet URL should have ws_ prefix"
        print(f"✓ Working sheet persisted: {lead['working_sheet']}")
    
    def test_both_documents_coexist(self, auth_headers, test_lead):
        """Verify both documents can exist on the same lead"""
        response = requests.get(f"{BASE_URL}/api/leads/{test_lead['id']}", headers=auth_headers)
        assert response.status_code == 200
        lead = response.json()
        assert lead.get("tender_document") is not None, "Tender document should exist"
        assert lead.get("working_sheet") is not None, "Working sheet should exist"
        print("✓ Both documents coexist on the same lead")
    
    def test_delete_tender_document(self, auth_headers, test_lead):
        """Test deleting tender document - should only remove document, not lead"""
        response = requests.delete(
            f"{BASE_URL}/api/leads/{test_lead['id']}/tender-document",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete failed: {response.text}"
        data = response.json()
        assert data.get("message") == "Document deleted"
        print("✓ Tender document delete endpoint returned success")
    
    def test_verify_tender_document_deleted(self, auth_headers, test_lead):
        """Verify tender document is removed but lead still exists"""
        response = requests.get(f"{BASE_URL}/api/leads/{test_lead['id']}", headers=auth_headers)
        assert response.status_code == 200, "Lead should still exist after document deletion"
        lead = response.json()
        assert lead.get("tender_document") is None, "Tender document should be null after deletion"
        assert lead.get("working_sheet") is not None, "Working sheet should still exist"
        assert lead.get("customer_name") == "TEST_DocCustomer", "Lead data should be intact"
        print("✓ Tender document deleted, lead and working sheet intact")
    
    def test_delete_working_sheet(self, auth_headers, test_lead):
        """Test deleting working sheet - should only remove document, not lead"""
        response = requests.delete(
            f"{BASE_URL}/api/leads/{test_lead['id']}/working-sheet",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete failed: {response.text}"
        data = response.json()
        assert data.get("message") == "Working sheet deleted"
        print("✓ Working sheet delete endpoint returned success")
    
    def test_verify_working_sheet_deleted(self, auth_headers, test_lead):
        """Verify working sheet is removed but lead still exists"""
        response = requests.get(f"{BASE_URL}/api/leads/{test_lead['id']}", headers=auth_headers)
        assert response.status_code == 200, "Lead should still exist after document deletion"
        lead = response.json()
        assert lead.get("working_sheet") is None, "Working sheet should be null after deletion"
        assert lead.get("tender_document") is None, "Tender document should still be null"
        assert lead.get("customer_name") == "TEST_DocCustomer", "Lead data should be intact"
        assert len(lead.get("products", [])) == 1, "Products should be intact"
        print("✓ Working sheet deleted, lead data intact")
    
    def test_delete_nonexistent_tender_document(self, auth_headers, test_lead):
        """Test deleting tender document when none exists - should succeed gracefully"""
        response = requests.delete(
            f"{BASE_URL}/api/leads/{test_lead['id']}/tender-document",
            headers=auth_headers
        )
        # Should succeed even if no document exists
        assert response.status_code == 200
        print("✓ Delete non-existent tender document succeeds gracefully")
    
    def test_delete_nonexistent_working_sheet(self, auth_headers, test_lead):
        """Test deleting working sheet when none exists - should succeed gracefully"""
        response = requests.delete(
            f"{BASE_URL}/api/leads/{test_lead['id']}/working-sheet",
            headers=auth_headers
        )
        # Should succeed even if no document exists
        assert response.status_code == 200
        print("✓ Delete non-existent working sheet succeeds gracefully")


class TestLeadDocumentErrorCases:
    """Test error cases for document endpoints"""
    
    def test_delete_tender_document_nonexistent_lead(self, auth_headers):
        """Test deleting tender document from non-existent lead"""
        response = requests.delete(
            f"{BASE_URL}/api/leads/nonexistent-lead-id/tender-document",
            headers=auth_headers
        )
        assert response.status_code == 404
        print("✓ Delete tender document from non-existent lead returns 404")
    
    def test_delete_working_sheet_nonexistent_lead(self, auth_headers):
        """Test deleting working sheet from non-existent lead"""
        response = requests.delete(
            f"{BASE_URL}/api/leads/nonexistent-lead-id/working-sheet",
            headers=auth_headers
        )
        assert response.status_code == 404
        print("✓ Delete working sheet from non-existent lead returns 404")
    
    def test_upload_invalid_file_type(self, auth_headers, test_lead):
        """Test uploading invalid file type"""
        file_content = b"test content"
        files = {"file": ("test.exe", io.BytesIO(file_content), "application/octet-stream")}
        headers = {"Authorization": auth_headers["Authorization"]}
        
        response = requests.post(
            f"{BASE_URL}/api/leads/{test_lead['id']}/upload-tender-document",
            files=files,
            headers=headers
        )
        assert response.status_code == 400
        print("✓ Upload invalid file type returns 400")


class TestLeadProductPartNumber:
    """Test that Part Number column is properly handled"""
    
    def test_lead_with_part_number(self, auth_headers, test_customer):
        """Test creating lead with part number in products"""
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": "2024-01-15",
            "products": [
                {
                    "product": "Widget A",
                    "part_number": "PN-12345",
                    "category": "Electronics",
                    "quantity": 5,
                    "price": 200,
                    "amount": 1000
                },
                {
                    "product": "Widget B",
                    "part_number": None,
                    "category": "Hardware",
                    "quantity": 3,
                    "price": 150,
                    "amount": 450
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create lead: {response.text}"
        lead = response.json()
        
        # Verify part numbers
        assert lead["products"][0]["part_number"] == "PN-12345"
        assert lead["products"][1]["part_number"] is None
        print("✓ Lead created with part numbers correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{lead['id']}", headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
