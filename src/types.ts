export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface PatientIntakeData {
  id?: string;
  enrollmentId?: string;
  patientInfo: {
    patientName: string;
    dob: string;
    gender: string;
    memberID: string;
    phone: string;
    address: string;
    dateOfService: string;
  };
  selectionInfo: {
    insurance: string;
    vendor: string;
  };
  physicianInfo: {
    primaryPhysician: string;
    physicianNPI: string;
    prescribingProvider: string;
  };
  clinicalInfo: {
    diagnosisICD10: string;
    dateOfPrescription: string;
    dmeItems: string;
    numberOfItems: number;
    hcpcsCodes: string[];
    medicalNecessityYN: boolean;
    priorAuthYN: boolean;
    authNumber: string;
  };
  deliveryTracking: {
    dateOfShipment: string;
    estimatedDeliveryDate: string;
    carrierService: string;
    trackingNumber: string;
    proofOfDelivery: string;
    additionalNotes: string;
  };
}

export interface PaymentsBillingData {
  id?: string;
  patient_name: string;
  enrollment_id: string;
  member_id: string;
  dme_item: string;
  hcpcs: string;
  payer: string;
  total_claim_amount: string;
  allowed_amount: string;
  insurance_paid: string;
  date_paid: string;
  is_paid: string;
  patient_responsibility: string;
  total_paid_balance: string;
  notes: string;
  authorization_yn?: boolean;
  billing_status?: string;
  date_of_service?: Date;
  date_claim_submission?: string;
  claim_number?: string;
  created_at?: string;
  updated_at?: string;
  patient_intake_id?: number;
  patient_intake?: any;
}

export interface AuditTrailData {
  id?: string;
  patientInfo: {
    name: string;
    mrnMemberID: string;
    enrollmentId: string;
    dob: string;
  };
  clinicalInfo: {
    diagnosisICD10: string;
    dmeItem: string;
    hcpcs: string;
  };
  billingInfo: {
    dateOfService: string;
    billingStatus: string;
    modifiers?: string;
    billedAmount: number;
  };
  payerInfo: {
    payerName: string;
    policyMemberID: string;
    authRequiredYN: boolean;
    authNumber?: string;
    insurancePaid: number;
  };
  patientPayInfo: {
    patientResponsibility: number;
    patientPaid: number;
    balanceDue: number;
    datesPaid: string;
  };
  patientFacing: {
    statementSent?: string;
    paymentPlanYN: boolean;
    paymentPlanTerms?: string;
    notes: string;
  };
  auditTrail: {
    claimNumber: string;
    dateClaimSubmitted: string;
    adjustmentsDenials?: string;
    staffInitials?: string;
  };
}