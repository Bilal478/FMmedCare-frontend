import React, { useState, useEffect } from 'react';
import { AuditTrailData, PatientIntakeData, PaymentsBillingData } from '../../types';
import { apiService } from '../../services/api';
import { Search, Filter, Eye, Calendar, CreditCard as Edit, Save } from 'lucide-react';

export const AuditTrailForm: React.FC = () => {
  const [auditRecords, setAuditRecords] = useState<AuditTrailData[]>([]);
  const [patientIntakeData, setPatientIntakeData] = useState<PatientIntakeData[]>([]);
  const [billingData, setBillingData] = useState<PaymentsBillingData[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AuditTrailData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AuditTrailData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadModuleData();
    generateAuditRecords();
  }, []);

  const loadModuleData = () => {
    // Mock data from Module 1 (Patient Intake)
    const mockPatientData: PatientIntakeData[] = [
      {
        id: '1',
        enrollmentId: 'FM0012',
        patientInfo: {
          patientName: 'John Smith',
          memberID: 'MEM001234',
          dateOfService: '2024-01-15',
          dob: '1965-03-15',
          gender: 'Male',
          phone: '5551234567',
          address: '123 Main St, City, State 12345'
        },
        selectionInfo: {
          insurance: 'Medicare',
          vendor: 'Vendor A - Medical Supplies'
        },
        clinicalInfo: {
          dmeItems: 'Blood Glucose Monitor',
          hcpcsCodes: ['E0607'],
          numberOfItems: 1,
          diagnosisICD10: 'E11.9',
          dateOfPrescription: '2024-01-10',
          medicalNecessityYN: true,
          priorAuthYN: true,
          authNumber: 'AUTH123456'
        },
        physicianInfo: {
          primaryPhysician: 'Dr. Johnson',
          physicianNPI: '1234567890',
          prescribingProvider: 'Dr. Johnson'
        },
        deliveryTracking: {
          dateOfShipment: '2024-01-16',
          estimatedDeliveryDate: '2024-01-18',
          carrierService: 'FedEx',
          trackingNumber: 'TRK123456789',
          proofOfDelivery: '',
          additionalNotes: ''
        }
      },
      {
        id: '2',
        enrollmentId: 'FM0023',
        patientInfo: {
          patientName: 'Mary Johnson',
          memberID: 'MEM001235',
          dateOfService: '2024-01-20',
          dob: '1958-07-22',
          gender: 'Female',
          phone: '5559876543',
          address: '456 Oak Ave, City, State 12345'
        },
        selectionInfo: {
          insurance: 'Medicaid',
          vendor: 'Vendor B - DME Equipment'
        },
        clinicalInfo: {
          dmeItems: 'Wheelchair',
          hcpcsCodes: ['K0001'],
          numberOfItems: 1,
          diagnosisICD10: 'M79.3',
          dateOfPrescription: '2024-01-18',
          medicalNecessityYN: true,
          priorAuthYN: true,
          authNumber: 'AUTH789012'
        },
        physicianInfo: {
          primaryPhysician: 'Dr. Williams',
          physicianNPI: '0987654321',
          prescribingProvider: 'Dr. Williams'
        },
        deliveryTracking: {
          dateOfShipment: '2024-01-22',
          estimatedDeliveryDate: '2024-01-25',
          carrierService: 'USPS',
          trackingNumber: 'TRK987654321',
          proofOfDelivery: '',
          additionalNotes: ''
        }
      }
    ];

    // Mock data from Module 2 (Billing & Payments)
    const mockBillingData: PaymentsBillingData[] = [
      {
        id: '1',
        patientName: 'John Smith',
        enrollmentId: 'FM0012',
        memberID: 'MEM001234',
        dmeItem: 'Blood Glucose Monitor',
        hcpcs: 'E0607',
        payer: 'Medicare',
        totalClaimAmount: 125.50,
        allowedAmount: 100.40,
        insurancePaid: 80.32,
        datePaid: '2024-02-01',
        isPaid: 'Yes',
        patientResponsibility: 25.10,
        totalPaidBalance: 80.32,
        notes: 'Payment received in full',
        billingStatus: 'Paid',
        dateOfService: '2024-01-15',
        dateClaimSubmission: '2024-01-16',
        claimNumber: 'CLM2024001234'
      },
      {
        id: '2',
        patientName: 'Mary Johnson',
        enrollmentId: 'FM0023',
        memberID: 'MEM001235',
        dmeItem: 'Wheelchair',
        hcpcs: 'K0001',
        payer: 'Medicaid',
        totalClaimAmount: 2500.00,
        allowedAmount: 2200.00,
        insurancePaid: 0.00,
        datePaid: '',
        isPaid: 'No',
        patientResponsibility: 300.00,
        totalPaidBalance: 0.00,
        notes: 'Awaiting insurance approval',
        billingStatus: 'Pending',
        dateOfService: '2024-01-20',
        dateClaimSubmission: '2024-01-21',
        claimNumber: 'CLM2024001235'
      }
    ];

    setPatientIntakeData(mockPatientData);
    setBillingData(mockBillingData);
  };

  const generateAuditRecords = () => {
    // This would typically combine data from both modules
    const mockAuditData: AuditTrailData[] = [
      {
        id: '1',
        patientInfo: {
          name: 'John Smith',
          mrnMemberID: 'MEM001234',
          enrollmentId: 'FM0012',
          dob: '1965-03-15'
        },
        clinicalInfo: {
          diagnosisICD10: 'E11.9',
          dmeItem: 'Blood Glucose Monitor',
          hcpcs: 'E0607'
        },
        billingInfo: {
          dateOfService: '2024-01-15',
          billingStatus: 'Paid',
          modifiers: 'NU',
          billedAmount: 45.18 // Total Claim - (Insurance Paid + Patient Paid)
        },
        payerInfo: {
          payerName: 'Medicare',
          policyMemberID: 'MEM001234',
          authRequiredYN: true,
          authNumber: 'AUTH123456',
          insurancePaid: 80.32
        },
        patientPayInfo: {
          patientResponsibility: 25.10,
          patientPaid: 25.10,
          balanceDue: 0.00,
          datesPaid: '2024-02-01'
        },
        patientFacing: {
          statementSent: '2024-01-25',
          paymentPlanYN: false,
          notes: 'Payment received in full'
        },
        auditTrail: {
          claimNumber: 'CLM2024001234',
          dateClaimSubmitted: '2024-01-16',
          adjustmentsDenials: 'None',
          staffInitials: 'JS'
        }
      },
      {
        id: '2',
        patientInfo: {
          name: 'Mary Johnson',
          mrnMemberID: 'MEM001235',
          enrollmentId: 'FM0023',
          dob: '1958-07-22'
        },
        clinicalInfo: {
          diagnosisICD10: 'M79.3',
          dmeItem: 'Wheelchair',
          hcpcs: 'K0001'
        },
        billingInfo: {
          dateOfService: '2024-01-20',
          billingStatus: 'Pending',
          modifiers: 'RR',
          billedAmount: 2500.00
        },
        payerInfo: {
          payerName: 'Medicaid',
          policyMemberID: 'MEM001235',
          authRequiredYN: true,
          authNumber: 'AUTH789012',
          insurancePaid: 0.00
        },
        patientPayInfo: {
          patientResponsibility: 300.00,
          patientPaid: 0.00,
          balanceDue: 2500.00,
          datesPaid: ''
        },
        patientFacing: {
          statementSent: '',
          paymentPlanYN: false,
          notes: 'Awaiting insurance approval'
        },
        auditTrail: {
          claimNumber: 'CLM2024001235',
          dateClaimSubmitted: '2024-01-21',
          adjustmentsDenials: 'Pending review',
          staffInitials: 'MK'
        }
      }
    ];

    setAuditRecords(mockAuditData);
  };

  const filteredRecords = auditRecords.filter(record => {
    const matchesSearch = 
      record.patientInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientInfo.mrnMemberID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.auditTrail.claimNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !dateFilter || record.billingInfo.dateOfService >= dateFilter;
    const matchesStatus = !statusFilter || record.billingInfo.billingStatus === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const handleViewDetails = (record: AuditTrailData) => {
    setSelectedRecord(record);
    setIsEditing(false);
    setIsEditing(false);
  };

  const handleEditRecord = (record: AuditTrailData) => {
    setEditingRecord({ ...record });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Transform data to match Laravel API structure for Module 2 fields only
      const apiData = {
        // Billing Info (editable)
        billing_status: editingRecord.billingInfo.billingStatus,
        modifiers: editingRecord.billingInfo.modifiers,
        
        // Payer Info (editable)
        insurance_paid: editingRecord.payerInfo.insurancePaid,
        
        // Patient Pay Info (editable)
        patient_paid: editingRecord.patientPayInfo.patientPaid,
        balance_due: editingRecord.patientPayInfo.balanceDue,
        dates_paid: editingRecord.patientPayInfo.datesPaid,
        
        // Patient Facing (editable)
        statement_sent: editingRecord.patientFacing.statementSent,
        payment_plan_yn: editingRecord.patientFacing.paymentPlanYN,
        payment_plan_terms: editingRecord.patientFacing.paymentPlanTerms,
        notes: editingRecord.patientFacing.notes,
        
        // Audit Trail (editable)
        claim_number: editingRecord.auditTrail.claimNumber,
        date_claim_submitted: editingRecord.auditTrail.dateClaimSubmitted,
        adjustments_denials: editingRecord.auditTrail.adjustmentsDenials,
        staff_initials: editingRecord.auditTrail.staffInitials
      };
      
      // Update via audit trail endpoint (which updates the underlying billing record)
      await apiService.updateAuditRecord(editingRecord.id!, apiData);
      
      const updatedRecords = auditRecords.map(record => 
        record.id === editingRecord.id ? editingRecord : record
      );
      setAuditRecords(updatedRecords);
      
      // Update the selected record if it's the same one being edited
      if (selectedRecord?.id === editingRecord.id) {
        setSelectedRecord(editingRecord);
      }
      
      setIsEditing(false);
      setEditingRecord(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingRecord(null);
  };

  const updateEditingRecord = (section: keyof AuditTrailData, field: string, value: any) => {
    if (!editingRecord) return;
    
    setEditingRecord(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Structure & Audit Trail</h2>
          <p className="text-gray-600 mt-1">Comprehensive audit logging and data structure management</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients, MRN, claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending">Pending</option>
              <option value="Denied">Denied</option>
              <option value="Paid">Paid</option>
              <option value="Adjusted">Adjusted</option>
            </select>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Audit Records Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Audit Records ({filteredRecords.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRN/Member ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DME Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.patientInfo.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.patientInfo.mrnMemberID}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.patientInfo.enrollmentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.clinicalInfo.dmeItem}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.billingInfo.dateOfService).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.auditTrail.claimNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.billingInfo.billingStatus === 'Paid'
                        ? 'bg-green-100 text-green-800'
                        : record.billingInfo.billingStatus === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : record.billingInfo.billingStatus === 'Denied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {record.billingInfo.billingStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.billingInfo.billedAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleViewDetails(record)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Audit Record' : 'Audit Details'} - {selectedRecord.patientInfo.name}
              </h3>
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => handleEditRecord(selectedRecord)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Patient Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Patient Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedRecord.patientInfo.name}</div>
                  <div><span className="font-medium">MRN/Member ID:</span> {selectedRecord.patientInfo.mrnMemberID}</div>
                  <div><span className="font-medium">Enrollment ID:</span> {selectedRecord.patientInfo.enrollmentId}</div>
                  <div><span className="font-medium">DOB:</span> {selectedRecord.patientInfo.dob}</div>
                </div>
              </div>

              {/* Clinical Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Clinical Information</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><span className="font-medium">Diagnosis (ICD-10):</span> {selectedRecord.clinicalInfo.diagnosisICD10}</div>
                  <div><span className="font-medium">DME Item:</span> {selectedRecord.clinicalInfo.dmeItem}</div>
                  <div><span className="font-medium">HCPCS Code:</span> {selectedRecord.clinicalInfo.hcpcs}</div>
                </div>
              </div>

              {/* Billing Information */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Billing Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Date of Service:</span> {selectedRecord.billingInfo.dateOfService}</div>
                  <div><span className="font-medium">Billing Status:</span> {selectedRecord.billingInfo.billingStatus}</div>
                  <div><span className="font-medium">Modifiers:</span> {selectedRecord.billingInfo.modifiers || 'N/A'}</div>
                  <div><span className="font-medium">Billed Amount:</span> ${selectedRecord.billingInfo.billedAmount.toFixed(2)}</div>
                </div>
              </div>

              {/* Payer Information */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Payer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Payer Name:</span> {selectedRecord.payerInfo.payerName}</div>
                  <div><span className="font-medium">Policy/Member ID:</span> {selectedRecord.payerInfo.policyMemberID}</div>
                  <div><span className="font-medium">Authorization Required:</span> {selectedRecord.payerInfo.authRequiredYN ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">Authorization Number:</span> {selectedRecord.payerInfo.authNumber || 'N/A'}</div>
                  <div><span className="font-medium">Insurance Paid:</span> ${selectedRecord.payerInfo.insurancePaid.toFixed(2)}</div>
                </div>
              </div>

              {/* Patient Payment Information */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Patient Payment Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Patient Responsibility:</span> ${selectedRecord.patientPayInfo.patientResponsibility.toFixed(2)}</div>
                  <div><span className="font-medium">Patient Paid:</span> ${selectedRecord.patientPayInfo.patientPaid.toFixed(2)}</div>
                  <div><span className="font-medium">Balance Due:</span> ${selectedRecord.patientPayInfo.balanceDue.toFixed(2)}</div>
                  <div><span className="font-medium">Date(s) Paid:</span> {selectedRecord.patientPayInfo.datesPaid || 'N/A'}</div>
                </div>
              </div>

              {/* Patient-Facing Information */}
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Patient-Facing Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Statement Sent:</span> {selectedRecord.patientFacing.statementSent || 'Not sent'}</div>
                  <div><span className="font-medium">Payment Plan Setup:</span> {selectedRecord.patientFacing.paymentPlanYN ? 'Yes' : 'No'}</div>
                  {selectedRecord.patientFacing.paymentPlanTerms && (
                    <div className="col-span-2"><span className="font-medium">Payment Plan Terms:</span> {selectedRecord.patientFacing.paymentPlanTerms}</div>
                  )}
                </div>
              </div>

              {/* Audit Trail */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Audit Trail</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Claim Number:</span> {selectedRecord.auditTrail.claimNumber}</div>
                  <div><span className="font-medium">Date Claim Submitted:</span> {selectedRecord.auditTrail.dateClaimSubmitted}</div>
                  <div><span className="font-medium">Adjustments/Denials:</span> {selectedRecord.auditTrail.adjustmentsDenials || 'None'}</div>
                  <div><span className="font-medium">Staff Initials:</span> {selectedRecord.auditTrail.staffInitials || 'N/A'}</div>
                </div>
              </div>

              {/* Notes */}
              {!isEditing && selectedRecord.patientFacing.notes && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedRecord.patientFacing.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};