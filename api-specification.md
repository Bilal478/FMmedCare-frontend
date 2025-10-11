# Laravel API Specification for FMmedCare Dashboard

## Overview
This document provides the complete API specification for updating the Laravel backend to match the frontend changes made to the FMmedCare Dashboard application.

## Database Schema Updates

### 1. Patient Intake Table (`patient_intakes`)

```sql
CREATE TABLE patient_intakes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enrollment_id VARCHAR(20) UNIQUE NOT NULL, -- Format: FM0001, FM0002, etc.
    
    -- Patient Information
    patient_name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    member_id VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    date_of_service DATE NOT NULL,
    
    -- Selection Information
    insurance ENUM('Medicare', 'Medicaid', 'Insurance', 'Self-Pay') NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    
    -- Physician Information
    primary_physician VARCHAR(255) NULL,
    physician_npi VARCHAR(20) NULL,
    prescribing_provider VARCHAR(255) NULL,
    
    -- Clinical Information
    diagnosis_icd10 VARCHAR(20) NULL,
    date_of_prescription DATE NULL,
    dme_items VARCHAR(255) NOT NULL,
    number_of_items INT DEFAULT 1,
    hcpcs_codes JSON NOT NULL, -- Array of HCPCS codes
    medical_necessity_yn BOOLEAN DEFAULT FALSE,
    prior_auth_yn BOOLEAN DEFAULT FALSE,
    auth_number VARCHAR(100) NULL,
    
    -- Delivery Tracking
    date_of_shipment DATE NULL,
    estimated_delivery_date DATE NULL,
    carrier_service ENUM('FedEx', 'USPS', 'DHL') NULL,
    tracking_number VARCHAR(100) NULL,
    proof_of_delivery TEXT NULL,
    additional_notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Billing Payments Table (`billing_payments`)

```sql
CREATE TABLE billing_payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- References to Patient Intake (Non-editable fields)
    patient_name VARCHAR(255) NOT NULL,
    enrollment_id VARCHAR(20) NOT NULL,
    member_id VARCHAR(100) NOT NULL,
    dme_item VARCHAR(255) NOT NULL,
    hcpcs VARCHAR(255) NOT NULL,
    payer ENUM('Medicare', 'Medicaid', 'Insurance', 'Self-Pay') NOT NULL,
    
    -- Billing Information (Editable fields)
    total_claim_amount DECIMAL(10,2) DEFAULT 0.00,
    allowed_amount DECIMAL(10,2) DEFAULT 0.00,
    insurance_paid DECIMAL(10,2) DEFAULT 0.00,
    date_paid DATE NULL,
    is_paid ENUM('Yes', 'No', 'Partial') DEFAULT 'No',
    patient_responsibility DECIMAL(10,2) GENERATED ALWAYS AS (total_claim_amount - allowed_amount) STORED,
    total_paid_balance DECIMAL(10,2) GENERATED ALWAYS AS (insurance_paid) STORED,
    notes TEXT NOT NULL,
    
    -- Optional Fields
    authorization_yn BOOLEAN DEFAULT FALSE,
    billing_status ENUM('Submitted', 'Pending', 'Denied', 'Paid', 'In Process') DEFAULT 'Pending',
    date_of_service DATE NULL,
    date_claim_submission DATE NULL,
    claim_number VARCHAR(100) NULL,
    
    -- Foreign Key
    patient_intake_id BIGINT UNSIGNED NULL,
    FOREIGN KEY (patient_intake_id) REFERENCES patient_intakes(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Audit Trail View (Virtual Table)

```sql
-- This should be a database view that combines data from both tables
CREATE VIEW audit_trail AS
SELECT 
    bp.id,
    -- Patient Info
    pi.patient_name as patient_name,
    pi.member_id as mrn_member_id,
    pi.enrollment_id as enrollment_id,
    pi.dob as dob,
    
    -- Clinical Info
    pi.diagnosis_icd10 as diagnosis_icd10,
    pi.dme_items as dme_item,
    JSON_UNQUOTE(JSON_EXTRACT(pi.hcpcs_codes, '$[0]')) as hcpcs,
    
    -- Billing Info
    pi.date_of_service as date_of_service,
    bp.billing_status as billing_status,
    '' as modifiers, -- Optional field
    (bp.total_claim_amount - (bp.insurance_paid + 0)) as billed_amount,
    
    -- Payer Info
    pi.insurance as payer_name,
    pi.member_id as policy_member_id,
    pi.prior_auth_yn as auth_required_yn,
    pi.auth_number as auth_number,
    bp.insurance_paid as insurance_paid,
    
    -- Patient Pay Info
    bp.patient_responsibility as patient_responsibility,
    0 as patient_paid, -- To be calculated
    bp.patient_responsibility as balance_due,
    bp.date_paid as dates_paid,
    
    -- Patient Facing
    NULL as statement_sent,
    FALSE as payment_plan_yn,
    NULL as payment_plan_terms,
    bp.notes as notes,
    
    -- Audit Trail
    bp.claim_number as claim_number,
    bp.date_claim_submission as date_claim_submitted,
    NULL as adjustments_denials,
    NULL as staff_initials,
    
    bp.created_at,
    bp.updated_at
FROM billing_payments bp
LEFT JOIN patient_intakes pi ON bp.patient_intake_id = pi.id;
```

## API Endpoints

### 1. Patient Intake Endpoints

#### GET /api/patient-intake
```php
// Parameters: page, per_page, search
// Returns paginated list of patient intakes
```

#### POST /api/patient-intake
```json
{
    "enrollment_id": "FM0001",
    "patient_info": {
        "patient_name": "John Smith",
        "dob": "1965-03-15",
        "gender": "Male",
        "member_id": "MEM001234",
        "phone": "5551234567",
        "address": "123 Main St, City, State 12345",
        "date_of_service": "2024-01-15"
    },
    "selection_info": {
        "insurance": "Medicare",
        "vendor": "Vendor A - Medical Supplies"
    },
    "physician_info": {
        "primary_physician": "Dr. Johnson",
        "physician_npi": "1234567890",
        "prescribing_provider": "Dr. Johnson"
    },
    "clinical_info": {
        "diagnosis_icd10": "E11.9",
        "date_of_prescription": "2024-01-10",
        "dme_items": "Blood Glucose Monitor",
        "number_of_items": 1,
        "hcpcs_codes": ["E0607"],
        "medical_necessity_yn": true,
        "prior_auth_yn": true,
        "auth_number": "AUTH123456"
    },
    "delivery_tracking": {
        "date_of_shipment": "2024-01-16",
        "estimated_delivery_date": "2024-01-18",
        "carrier_service": "FedEx",
        "tracking_number": "TRK123456789",
        "proof_of_delivery": "",
        "additional_notes": ""
    }
}
```

#### GET /api/patient-intake/{id}
```php
// Returns single patient intake record
```

#### PUT /api/patient-intake/{id}
```php
// Updates patient intake record
```

#### DELETE /api/patient-intake/{id}
```php
// Deletes patient intake record
```

### 2. Billing Payments Endpoints

#### GET /api/billing-payments
```php
// Parameters: page, per_page, search, status, date_from, date_to
// Returns paginated list of billing records
```

#### POST /api/billing-payments
```json
{
    "patient_name": "John Smith",
    "enrollment_id": "FM0001",
    "member_id": "MEM001234",
    "dme_item": "Blood Glucose Monitor",
    "hcpcs": "E0607",
    "payer": "Medicare",
    "total_claim_amount": 125.50,
    "allowed_amount": 100.40,
    "insurance_paid": 80.32,
    "date_paid": "2024-02-01",
    "is_paid": "Yes",
    "notes": "Payment received in full",
    "authorization_yn": true,
    "billing_status": "Paid",
    "date_of_service": "2024-01-15",
    "date_claim_submission": "2024-01-16",
    "claim_number": "CLM2024001234",
    "patient_intake_id": 1
}
```

#### GET /api/billing-payments/{id}
```php
// Returns single billing record
```

#### PUT /api/billing-payments/{id}
```php
// Updates billing record
```

#### DELETE /api/billing-payments/{id}
```php
// Deletes billing record
```

### 3. Audit Trail Endpoints

#### GET /api/audit-trail
```php
// Parameters: page, per_page, search, status, date_from, date_to, patient_name, claim_number
// Returns paginated audit trail records from the view
```

#### GET /api/audit-trail/{id}
```php
// Returns single audit record
```

#### PUT /api/audit-trail/{id}
```php
// Updates editable fields in the audit record (Module 2 fields only)
// This should update the underlying billing_payments table
```

## Model Relationships

### PatientIntake Model
```php
class PatientIntake extends Model
{
    protected $fillable = [
        'enrollment_id', 'patient_name', 'dob', 'gender', 'member_id', 
        'phone', 'address', 'date_of_service', 'insurance', 'vendor',
        'primary_physician', 'physician_npi', 'prescribing_provider',
        'diagnosis_icd10', 'date_of_prescription', 'dme_items', 
        'number_of_items', 'hcpcs_codes', 'medical_necessity_yn', 
        'prior_auth_yn', 'auth_number', 'date_of_shipment', 
        'estimated_delivery_date', 'carrier_service', 'tracking_number',
        'proof_of_delivery', 'additional_notes'
    ];

    protected $casts = [
        'hcpcs_codes' => 'array',
        'medical_necessity_yn' => 'boolean',
        'prior_auth_yn' => 'boolean',
        'dob' => 'date',
        'date_of_service' => 'date',
        'date_of_prescription' => 'date',
        'date_of_shipment' => 'date',
        'estimated_delivery_date' => 'date'
    ];

    public function billingPayments()
    {
        return $this->hasMany(BillingPayment::class);
    }
}
```

### BillingPayment Model
```php
class BillingPayment extends Model
{
    protected $fillable = [
        'patient_name', 'enrollment_id', 'member_id', 'dme_item', 
        'hcpcs', 'payer', 'total_claim_amount', 'allowed_amount', 
        'insurance_paid', 'date_paid', 'is_paid', 'notes',
        'authorization_yn', 'billing_status', 'date_of_service',
        'date_claim_submission', 'claim_number', 'patient_intake_id'
    ];

    protected $casts = [
        'total_claim_amount' => 'decimal:2',
        'allowed_amount' => 'decimal:2',
        'insurance_paid' => 'decimal:2',
        'patient_responsibility' => 'decimal:2',
        'total_paid_balance' => 'decimal:2',
        'authorization_yn' => 'boolean',
        'date_paid' => 'date',
        'date_of_service' => 'date',
        'date_claim_submission' => 'date'
    ];

    public function patientIntake()
    {
        return $this->belongsTo(PatientIntake::class);
    }
}
```

## Validation Rules

### Patient Intake Validation
```php
$rules = [
    'enrollment_id' => 'required|string|unique:patient_intakes',
    'patient_info.patient_name' => 'required|string|max:255',
    'patient_info.dob' => 'required|date',
    'patient_info.gender' => 'required|in:Male,Female,Other',
    'patient_info.member_id' => 'required|string|max:100',
    'patient_info.phone' => 'required|string|max:20',
    'patient_info.address' => 'required|string',
    'patient_info.date_of_service' => 'required|date',
    'selection_info.insurance' => 'required|in:Medicare,Medicaid,Insurance,Self-Pay',
    'selection_info.vendor' => 'required|string|max:255',
    'clinical_info.dme_items' => 'required|string|max:255',
    'clinical_info.number_of_items' => 'required|integer|min:1',
    'clinical_info.hcpcs_codes' => 'required|array|min:1',
    'clinical_info.hcpcs_codes.*' => 'string|max:10'
];
```

### Billing Payments Validation
```php
$rules = [
    'patient_name' => 'required|string|max:255',
    'enrollment_id' => 'required|string|exists:patient_intakes,enrollment_id',
    'member_id' => 'required|string|max:100',
    'dme_item' => 'required|string|max:255',
    'hcpcs' => 'required|string|max:255',
    'payer' => 'required|in:Medicare,Medicaid,Insurance,Self-Pay',
    'date_paid' => 'required|date',
    'is_paid' => 'required|in:Yes,No,Partial',
    'notes' => 'required|string',
    'billing_status' => 'in:Submitted,Pending,Denied,Paid,In Process',
    'total_claim_amount' => 'numeric|min:0',
    'allowed_amount' => 'numeric|min:0',
    'insurance_paid' => 'numeric|min:0'
];
```

## Key Business Logic

1. **Enrollment ID Generation**: Auto-generate format FM0001, FM0002, etc.
2. **Patient Responsibility Calculation**: `total_claim_amount - allowed_amount`
3. **Total Paid Balance**: Equal to `insurance_paid`
4. **Authorization Field**: Auto-populated based on `prior_auth_yn` and `auth_number` from Module 1
5. **Non-editable Fields**: Module 1 fields should be read-only in Module 2
6. **Audit Trail**: Combines data from both modules for comprehensive reporting

## Response Formats

All API responses should follow this format:
```json
{
    "success": true,
    "data": {...},
    "message": "Operation completed successfully",
    "errors": null
}
```

For paginated responses:
```json
{
    "success": true,
    "data": [...],
    "pagination": {
        "current_page": 1,
        "per_page": 10,
        "total": 100,
        "last_page": 10
    },
    "message": "Records retrieved successfully"
}
```

This specification covers all the frontend changes and provides the complete structure needed for the Laravel API implementation.