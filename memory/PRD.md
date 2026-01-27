# CRM System PRD

## Original Problem Statement
Build a single-user CRM system to manage:
- Customers
- Leads / Enquiries
- Proforma Invoices (Sales Orders)
- Purchase Orders
- Margin Calculation

System includes: Secure login (single authorized user), KPI-based dashboard, Module-wise navigation, Excel bulk upload support, Automatic amount & margin calculations.

## User Personas
- **Primary User**: Sunil Bora (sunil@bora.tech) - Business owner managing customer relationships, sales, and procurement

## Core Requirements (Static)
1. Fixed credentials authentication (sunil@bora.tech / sunil@1202)
2. 30-minute session timeout
3. KPI Dashboard with real-time metrics
4. Customer Management with CRUD + bulk upload
5. Lead/Enquiry Management with conversion flow
6. Proforma Invoice (Sales Order) management
7. Purchase Order management (linked or stock-in-sale) with MULTIPLE PRODUCTS per PO
8. Margin Calculator with freight input

## What's Been Implemented

### December 2024

#### Backend (FastAPI)
- ✅ JWT Authentication with 30-min expiry
- ✅ Customer CRUD APIs (/api/customers)
- ✅ Lead CRUD + Conversion APIs (/api/leads) - Multi-product support
- ✅ Proforma Invoice APIs (/api/proforma-invoices)
- ✅ Purchase Order APIs (/api/purchase-orders) - **Multi-product support added**
- ✅ Margin Calculator APIs (/api/margin-calculator)
- ✅ Dashboard KPI API (/api/dashboard/kpi)
- ✅ Excel template downloads
- ✅ Bulk upload endpoints (supports multiple products per PO)

#### Frontend (React)
- ✅ Login page with professional UI
- ✅ Dashboard with 5 KPI cards + quick stats
- ✅ Customer list + form pages
- ✅ Lead list + form with multi-product support
- ✅ Lead conversion dialog
- ✅ Proforma Invoice list + detail pages
- ✅ Purchase Order list + form pages **with multi-product support**
  - Add Product button for multiple product rows
  - Each product row calculates its own amount
  - PO Total = Sum of all product amounts
- ✅ Margin Calculator with editable freight
- ✅ Responsive sidebar navigation
- ✅ Dark theme with professional blue tones

### January 2, 2025 - Lead/Enquiry Enhancement

#### Part Number Field (Product Level)
- ✅ Added `part_number` field to ProductItem model in backend
- ✅ Part Number column added after Product Name in Lead Form
- ✅ Part Number saved per product in lead (each product has its own part number)
- ✅ Excel template updated with Part Number column
- ✅ Bulk upload processes Part Number correctly
- ✅ Part Number displayed in Lead Detail products table

#### Tender Document Field (Lead Level) - Customer Provided
- ✅ Added `tender_document` field to Lead model in backend
- ✅ File upload endpoint: POST /api/leads/{lead_id}/upload-tender-document
- ✅ File delete endpoint: DELETE /api/leads/{lead_id}/tender-document
- ✅ File serve endpoint: GET /api/uploads/{filename}
- ✅ Supported file types: PDF, DOC, DOCX, XLS, XLSX, PNG
- ✅ Max file size: 25MB
- ✅ Tender Document upload section in Lead Form (amber styling)
- ✅ Tender Document card in Lead Detail (with view/download button)
- ✅ Files stored in /app/backend/uploads/

#### Working Sheet Field (Lead Level) - Internal Reference
- ✅ Added `working_sheet` field to Lead model in backend
- ✅ File upload endpoint: POST /api/leads/{lead_id}/upload-working-sheet
- ✅ File delete endpoint: DELETE /api/leads/{lead_id}/working-sheet
- ✅ Supported file types: PDF, DOC, DOCX, XLS, XLSX, PNG
- ✅ Max file size: 25MB
- ✅ Working Sheet upload section in Lead Form (cyan styling)
- ✅ Working Sheet card in Lead Detail (with view/download button)
- ✅ Files prefixed with 'ws_' to distinguish from tender documents
- ✅ Both documents can coexist on same lead
- ✅ Clear visual distinction: Tender (amber) = customer-provided, Working Sheet (cyan) = internal

#### Lead Detail Page - Document Management Enhancement
- ✅ Documents section always visible (even without documents)
- ✅ Each document shows upload status (Uploaded/Not uploaded) with icons
- ✅ Uploaded documents show document filename
- ✅ View button to open/download document in new tab
- ✅ Remove button to delete document (only document, not lead)
- ✅ Delete confirmation dialog with clear messaging
- ✅ Success toast after document removal
- ✅ "Edit lead to upload documents" link when no documents

#### Proforma Invoice (PI) Module Enhancements
- ✅ Lead to PI conversion carries forward all data including tender_document and working_sheet
- ✅ Real-time sync: PI GET endpoint syncs products, total_amount, and documents from linked lead
- ✅ PI detail page shows Part Number column in products table
- ✅ PI products section has white background for better readability
- ✅ PI Documents section displays Tender Document and Working Sheet from lead
- ✅ PI documents are read-only (View button only, no Remove)
- ✅ "Edit in Lead" link for document management
- ✅ "View Lead" button in PI detail to navigate to linked lead
- ✅ Lead update preserves existing document references (bug fix)

### Database (MongoDB)
- ✅ customers collection
- ✅ leads collection (with tender_document and working_sheet fields)
- ✅ proforma_invoices collection (now with tender_document and working_sheet synced from lead)
- ✅ purchase_orders collection (with products array)
- ✅ margins collection (for freight data)

## Prioritized Backlog

### P0 (Completed)
- All core CRUD operations
- Authentication & authorization
- KPI Dashboard
- Lead conversion workflow
- Margin calculation
- Part Number field for products
- Tender Document upload for leads
- Working Sheet upload for leads
- Lead to PI data and document synchronization

### P1 (Future Enhancements)
- PDF export for invoices
- Email notifications
- Advanced reporting
- PO Excel upload grouping fix (multiple rows with same PO number → single PO)

### P2 (Nice to Have)
- Multi-currency support
- Customer portal
- Mobile app
- Integration with accounting software
- Drag-and-drop product reordering
- Product templates for frequently used items
- Quick-view modals

## Next Tasks
1. Fix PO Excel bulk upload grouping logic (pending from previous session)
2. Add PDF generation for proforma invoices
3. Implement search filters for all list pages
4. Add date range filtering for reports
5. Consider adding export functionality
