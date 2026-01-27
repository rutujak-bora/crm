"""
Test Working Sheet Feature for Lead/Enquiry Module
Tests for the new Working Sheet document upload field (internal reference document)
alongside the existing Tender Document (customer-provided)

Working Sheet: Internal calculations/notes/pricing document
Tender Document: Customer-provided document
Both support: PDF, DOC, DOCX, XLS, XLSX, PNG up to 25MB
"""
import pytest
import requests
import os
import tempfile
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "sunil@bora.tech"
TEST_PASSWORD = "sunil@1202"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Authentication failed")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get auth headers"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def test_customer(auth_headers):
    """Create a test customer for lead tests"""
    customer_data = {
        "customer_name": f"TEST_WS_Customer_{datetime.now().strftime('%H%M%S')}",
        "reference_name": "TEST_WS_REF",
        "contact_number": "9876543210",
        "email": "test_ws@example.com"
    }
    response = requests.post(f"{BASE_URL}/api/customers", json=customer_data, headers=auth_headers)
    assert response.status_code == 200, f"Failed to create customer: {response.text}"
    customer = response.json()
    print(f"✓ Created test customer: {customer['customer_name']}")
    yield customer
    # Cleanup
    requests.delete(f"{BASE_URL}/api/customers/{customer['id']}", headers=auth_headers)
    print(f"✓ Cleaned up test customer")


class TestWorkingSheetUpload:
    """Tests for Working Sheet upload functionality"""
    
    def test_upload_working_sheet_pdf(self, auth_headers, test_customer):
        """Test uploading a PDF working sheet"""
        # Create a lead first
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "products": [{"product": "TEST_WS_Product", "category": "Test", "quantity": 1, "price": 100}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        assert create_response.status_code == 200, f"Failed to create lead: {create_response.text}"
        lead = create_response.json()
        lead_id = lead["id"]
        
        # Create a test PDF file
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4 working sheet test content")
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, "rb") as f:
                files = {"file": ("working_sheet.pdf", f, "application/pdf")}
                upload_response = requests.post(
                    f"{BASE_URL}/api/leads/{lead_id}/upload-working-sheet",
                    files=files,
                    headers=auth_headers
                )
            
            assert upload_response.status_code == 200, f"Upload failed: {upload_response.text}"
            upload_data = upload_response.json()
            assert "document_url" in upload_data
            assert upload_data["document_url"].startswith("/api/uploads/")
            # Verify 'ws_' prefix in filename
            assert "ws_" in upload_data["document_url"], "Working sheet filename should have 'ws_' prefix"
            print(f"✓ PDF working sheet uploaded: {upload_data['document_url']}")
            
            # Verify lead has working_sheet
            get_response = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
            lead_data = get_response.json()
            assert lead_data["working_sheet"] == upload_data["document_url"]
            print(f"✓ Lead working_sheet field updated correctly")
            
            # Test downloading the document
            download_response = requests.get(f"{BASE_URL}{upload_data['document_url']}")
            assert download_response.status_code == 200
            print(f"✓ Working sheet can be downloaded")
            
        finally:
            os.unlink(temp_file_path)
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
    
    def test_upload_working_sheet_xlsx(self, auth_headers, test_customer):
        """Test uploading an XLSX working sheet (common format for calculations)"""
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "products": [{"product": "TEST_WS_Product", "category": "Test", "quantity": 1, "price": 100}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead = create_response.json()
        lead_id = lead["id"]
        
        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as f:
            f.write(b"PK test xlsx working sheet content")
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, "rb") as f:
                files = {"file": ("calculations.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
                upload_response = requests.post(
                    f"{BASE_URL}/api/leads/{lead_id}/upload-working-sheet",
                    files=files,
                    headers=auth_headers
                )
            
            assert upload_response.status_code == 200, f"XLSX upload failed: {upload_response.text}"
            print(f"✓ XLSX working sheet uploaded successfully")
            
        finally:
            os.unlink(temp_file_path)
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
    
    def test_upload_working_sheet_docx(self, auth_headers, test_customer):
        """Test uploading a DOCX working sheet"""
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "products": [{"product": "TEST_WS_Product", "category": "Test", "quantity": 1, "price": 100}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead = create_response.json()
        lead_id = lead["id"]
        
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
            f.write(b"PK test docx working sheet content")
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, "rb") as f:
                files = {"file": ("notes.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
                upload_response = requests.post(
                    f"{BASE_URL}/api/leads/{lead_id}/upload-working-sheet",
                    files=files,
                    headers=auth_headers
                )
            
            assert upload_response.status_code == 200, f"DOCX upload failed: {upload_response.text}"
            print(f"✓ DOCX working sheet uploaded successfully")
            
        finally:
            os.unlink(temp_file_path)
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
    
    def test_upload_working_sheet_png(self, auth_headers, test_customer):
        """Test uploading a PNG working sheet"""
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "products": [{"product": "TEST_WS_Product", "category": "Test", "quantity": 1, "price": 100}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead = create_response.json()
        lead_id = lead["id"]
        
        # Create a minimal valid PNG
        png_header = b'\x89PNG\r\n\x1a\n\rIHDR\x01\x01\x08\x02\x90wS\xde'
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(png_header)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, "rb") as f:
                files = {"file": ("diagram.png", f, "image/png")}
                upload_response = requests.post(
                    f"{BASE_URL}/api/leads/{lead_id}/upload-working-sheet",
                    files=files,
                    headers=auth_headers
                )
            
            assert upload_response.status_code == 200, f"PNG upload failed: {upload_response.text}"
            print(f"✓ PNG working sheet uploaded successfully")
            
        finally:
            os.unlink(temp_file_path)
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
    
    def test_upload_working_sheet_invalid_type(self, auth_headers, test_customer):
        """Test that invalid file types are rejected for working sheet"""
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "products": [{"product": "TEST_WS_Product", "category": "Test", "quantity": 1, "price": 100}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead = create_response.json()
        lead_id = lead["id"]
        
        with tempfile.NamedTemporaryFile(suffix=".exe", delete=False) as f:
            f.write(b"invalid file content")
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, "rb") as f:
                files = {"file": ("malware.exe", f, "application/octet-stream")}
                upload_response = requests.post(
                    f"{BASE_URL}/api/leads/{lead_id}/upload-working-sheet",
                    files=files,
                    headers=auth_headers
                )
            
            assert upload_response.status_code == 400, f"Expected 400 for invalid file type, got {upload_response.status_code}"
            print(f"✓ Invalid file type (.exe) correctly rejected for working sheet")
            
        finally:
            os.unlink(temp_file_path)
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)


class TestWorkingSheetDelete:
    """Tests for Working Sheet delete functionality"""
    
    def test_delete_working_sheet(self, auth_headers, test_customer):
        """Test deleting a working sheet from a lead"""
        # Create lead and upload working sheet
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "products": [{"product": "TEST_WS_Product", "category": "Test", "quantity": 1, "price": 100}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead = create_response.json()
        lead_id = lead["id"]
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4 working sheet test content")
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, "rb") as f:
                files = {"file": ("working_sheet.pdf", f, "application/pdf")}
                upload_response = requests.post(
                    f"{BASE_URL}/api/leads/{lead_id}/upload-working-sheet",
                    files=files,
                    headers=auth_headers
                )
            assert upload_response.status_code == 200
            
            # Delete the working sheet
            delete_response = requests.delete(
                f"{BASE_URL}/api/leads/{lead_id}/working-sheet",
                headers=auth_headers
            )
            assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
            print(f"✓ Working sheet deleted successfully")
            
            # Verify lead no longer has working_sheet
            get_response = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
            lead_data = get_response.json()
            assert lead_data["working_sheet"] is None
            print(f"✓ Lead working_sheet field cleared after delete")
            
        finally:
            os.unlink(temp_file_path)
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
    
    def test_upload_working_sheet_to_nonexistent_lead(self, auth_headers):
        """Test uploading working sheet to a non-existent lead returns 404"""
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4 test content")
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, "rb") as f:
                files = {"file": ("test.pdf", f, "application/pdf")}
                upload_response = requests.post(
                    f"{BASE_URL}/api/leads/nonexistent-id/upload-working-sheet",
                    files=files,
                    headers=auth_headers
                )
            
            assert upload_response.status_code == 404
            print(f"✓ Upload working sheet to non-existent lead correctly returns 404")
            
        finally:
            os.unlink(temp_file_path)


class TestBothDocumentsCoexist:
    """Tests for both Tender Document and Working Sheet coexisting on same lead"""
    
    def test_both_documents_on_same_lead(self, auth_headers, test_customer):
        """Test that both tender document and working sheet can exist on the same lead"""
        # Create a lead
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "products": [{"product": "TEST_Both_Docs", "category": "Test", "quantity": 1, "price": 100}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead = create_response.json()
        lead_id = lead["id"]
        
        # Create test files
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4 tender document content")
            tender_file_path = f.name
        
        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as f:
            f.write(b"PK working sheet content")
            ws_file_path = f.name
        
        try:
            # Upload tender document
            with open(tender_file_path, "rb") as f:
                files = {"file": ("tender.pdf", f, "application/pdf")}
                tender_response = requests.post(
                    f"{BASE_URL}/api/leads/{lead_id}/upload-tender-document",
                    files=files,
                    headers=auth_headers
                )
            assert tender_response.status_code == 200
            tender_url = tender_response.json()["document_url"]
            print(f"✓ Tender document uploaded: {tender_url}")
            
            # Upload working sheet
            with open(ws_file_path, "rb") as f:
                files = {"file": ("calculations.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
                ws_response = requests.post(
                    f"{BASE_URL}/api/leads/{lead_id}/upload-working-sheet",
                    files=files,
                    headers=auth_headers
                )
            assert ws_response.status_code == 200
            ws_url = ws_response.json()["document_url"]
            print(f"✓ Working sheet uploaded: {ws_url}")
            
            # Verify both documents exist on the lead
            get_response = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
            lead_data = get_response.json()
            
            assert lead_data["tender_document"] == tender_url, "Tender document URL mismatch"
            assert lead_data["working_sheet"] == ws_url, "Working sheet URL mismatch"
            print(f"✓ Both documents coexist on the same lead")
            
            # Verify both can be downloaded
            tender_download = requests.get(f"{BASE_URL}{tender_url}")
            assert tender_download.status_code == 200
            print(f"✓ Tender document can be downloaded")
            
            ws_download = requests.get(f"{BASE_URL}{ws_url}")
            assert ws_download.status_code == 200
            print(f"✓ Working sheet can be downloaded")
            
            # Verify filenames are different (ws_ prefix)
            assert "ws_" in ws_url, "Working sheet should have 'ws_' prefix"
            assert "ws_" not in tender_url, "Tender document should NOT have 'ws_' prefix"
            print(f"✓ Document filenames are correctly differentiated (ws_ prefix)")
            
        finally:
            os.unlink(tender_file_path)
            os.unlink(ws_file_path)
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
    
    def test_delete_one_document_keeps_other(self, auth_headers, test_customer):
        """Test that deleting one document doesn't affect the other"""
        # Create a lead
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "products": [{"product": "TEST_Delete_One", "category": "Test", "quantity": 1, "price": 100}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead = create_response.json()
        lead_id = lead["id"]
        
        # Create test files
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4 tender document content")
            tender_file_path = f.name
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4 working sheet content")
            ws_file_path = f.name
        
        try:
            # Upload both documents
            with open(tender_file_path, "rb") as f:
                files = {"file": ("tender.pdf", f, "application/pdf")}
                requests.post(f"{BASE_URL}/api/leads/{lead_id}/upload-tender-document", files=files, headers=auth_headers)
            
            with open(ws_file_path, "rb") as f:
                files = {"file": ("working.pdf", f, "application/pdf")}
                ws_response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/upload-working-sheet", files=files, headers=auth_headers)
            ws_url = ws_response.json()["document_url"]
            
            # Delete tender document
            delete_response = requests.delete(f"{BASE_URL}/api/leads/{lead_id}/tender-document", headers=auth_headers)
            assert delete_response.status_code == 200
            
            # Verify working sheet still exists
            get_response = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
            lead_data = get_response.json()
            
            assert lead_data["tender_document"] is None, "Tender document should be deleted"
            assert lead_data["working_sheet"] == ws_url, "Working sheet should still exist"
            print(f"✓ Deleting tender document doesn't affect working sheet")
            
        finally:
            os.unlink(tender_file_path)
            os.unlink(ws_file_path)
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
    
    def test_replace_working_sheet(self, auth_headers, test_customer):
        """Test replacing an existing working sheet with a new one"""
        # Create a lead
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "products": [{"product": "TEST_Replace_WS", "category": "Test", "quantity": 1, "price": 100}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead = create_response.json()
        lead_id = lead["id"]
        
        # Create test files
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4 first working sheet")
            first_ws_path = f.name
        
        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as f:
            f.write(b"PK second working sheet")
            second_ws_path = f.name
        
        try:
            # Upload first working sheet
            with open(first_ws_path, "rb") as f:
                files = {"file": ("first.pdf", f, "application/pdf")}
                first_response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/upload-working-sheet", files=files, headers=auth_headers)
            first_url = first_response.json()["document_url"]
            print(f"✓ First working sheet uploaded: {first_url}")
            
            # Upload second working sheet (should replace first)
            with open(second_ws_path, "rb") as f:
                files = {"file": ("second.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
                second_response = requests.post(f"{BASE_URL}/api/leads/{lead_id}/upload-working-sheet", files=files, headers=auth_headers)
            second_url = second_response.json()["document_url"]
            print(f"✓ Second working sheet uploaded: {second_url}")
            
            # Verify lead has the new working sheet
            get_response = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
            lead_data = get_response.json()
            
            assert lead_data["working_sheet"] == second_url, "Working sheet should be updated to second file"
            assert lead_data["working_sheet"] != first_url, "Old working sheet should be replaced"
            print(f"✓ Working sheet successfully replaced")
            
        finally:
            os.unlink(first_ws_path)
            os.unlink(second_ws_path)
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)


class TestLeadModelWorkingSheet:
    """Tests for working_sheet field in Lead model"""
    
    def test_lead_model_has_working_sheet_field(self, auth_headers, test_customer):
        """Test that Lead model includes working_sheet field"""
        lead_data = {
            "customer_id": test_customer["id"],
            "customer_name": test_customer["customer_name"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "products": [{"product": "TEST_Model", "category": "Test", "quantity": 1, "price": 100}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=auth_headers)
        lead = create_response.json()
        lead_id = lead["id"]
        
        try:
            # Verify working_sheet field exists (should be None initially)
            assert "working_sheet" in lead, "Lead should have working_sheet field"
            assert lead["working_sheet"] is None, "working_sheet should be None initially"
            print(f"✓ Lead model has working_sheet field (initially None)")
            
            # Also verify tender_document field exists
            assert "tender_document" in lead, "Lead should have tender_document field"
            print(f"✓ Lead model has both tender_document and working_sheet fields")
            
        finally:
            requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
