import React, { useState, useEffect } from 'react';
import { PaymentsBillingData, PatientIntakeData } from '../../types';
import { apiService } from '../../services/api';
import { Plus, Save, Search, CreditCard as Edit, Trash2, AlertCircle, X, CheckCircle  } from 'lucide-react';

const initialBilling: PaymentsBillingData = {
  patientName: '',
  enrollmentId: '',
  memberID: '',
  dmeItem: '',
  hcpcs: '',
  payer: '',
  totalClaimAmount: 0,
  allowedAmount: 0,
  insurancePaid: 0,
  datePaid: '',
  isPaid: 'No',
  patientResponsibility: 0,
  totalPaidBalance: 0,
  notes: '',
  authorizationYN: false,
  billingStatus: 'Pending',
  dateOfService: '',
  dateClaimSubmission: '',
  claimNumber: ''
};

export const BillingPaymentsForm: React.FC = () => {
  const [billingRecords, setBillingRecords] = useState<PaymentsBillingData[]>([]);
  const [currentRecord, setCurrentRecord] = useState<PaymentsBillingData>(initialBilling);
  const [patientIntakeData, setPatientIntakeData] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // Added this new state variable
  const [patientNameError, setPatientNameError] = useState<string | null>(null);

  // Load patient intake data on component mount
  useEffect(() => {
    loadPatientIntakeData();
  }, []);

  const loadPatientIntakeData = async () => {
    setIsLoadingPatients(true);
    try {
      // Fetch patient intake data from API
      const response = await apiService.getPatientIntakes({ per_page: 100 });
      setPatientIntakeData(response.data || []);
    } catch (error) {
      setError('Failed to load patient intake data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const loadBillingRecords = async () => {
    try {
      const response = await apiService.getPaymentsBilling({ per_page: 100 });
      setBillingRecords(response.data || []);
    } catch (error) {
      console.error('Failed to load billing records:', error);
    }
  };

  const handlePatientSelection = (enrollmentId: string) => {
    const selectedPatientData = patientIntakeData.find(p => p.enrollment_id === enrollmentId);
    if (selectedPatientData) {
      setCurrentRecord({
        ...initialBilling,
        patientName: selectedPatientData.patient_name,
        enrollmentId: selectedPatientData.enrollment_id,
        memberID: selectedPatientData.member_id,
        dmeItem: selectedPatientData.dme_items,
        hcpcs: Array.isArray(selectedPatientData.hcpcs_codes) 
          ? selectedPatientData.hcpcs_codes.join(', ')
          : selectedPatientData.hcpcs_codes,
        payer: selectedPatientData.insurance,
        dateOfService: selectedPatientData.date_of_service,
        authorizationYN: selectedPatientData.prior_auth_yn && !!selectedPatientData.auth_number
      });
      setSelectedPatient(enrollmentId);
    }
  };

  const calculatePatientResponsibility = () => {
    const { totalClaimAmount, allowedAmount, insurancePaid } = currentRecord;
    return Math.max(0, totalClaimAmount - (allowedAmount - insurancePaid));
  };

  const updateCurrentRecord = (field: keyof PaymentsBillingData, value: any) => {
    setCurrentRecord(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'patientName') {
        const nameRegex = /^[A-Za-z\s]*$/;
        if (value && !nameRegex.test(value)) {
          setPatientNameError('Patient name can only contain letters and spaces');
          return; // Don't update if invalid
        } else {
          setPatientNameError(null);
        }
      }
      // Auto-calculate fields
      if (field === 'insurancePaid') {
        updated.totalPaidBalance = value;
      }
      
      // Calculate patient responsibility
      if (['totalClaimAmount', 'allowedAmount'].includes(field)) {
        const totalClaim = field === 'totalClaimAmount' ? value : updated.totalClaimAmount;
        const allowed = field === 'allowedAmount' ? value : updated.allowedAmount;
        updated.patientResponsibility = Math.max(0, totalClaim - allowed);
      }
      
      return updated;
    });
  };

  const validateForm = () => {
    const required = [
      'patientName', 'enrollmentId', 'memberID', 'dmeItem', 
      'hcpcs', 'payer', 'datePaid', 'isPaid'
    ];
    
    return required.every(field => {
      const value = currentRecord[field as keyof PaymentsBillingData];
      return value !== '' && value !== null && value !== undefined;
    });
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please fill in all mandatory fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Transform data to match Laravel API structure
      const apiData = {
        patient_name: currentRecord.patientName,
        enrollment_id: currentRecord.enrollmentId,
        member_id: currentRecord.memberID,
        dme_item: currentRecord.dmeItem,
        hcpcs: currentRecord.hcpcs,
        payer: currentRecord.payer,
        total_claim_amount: currentRecord.totalClaimAmount,
        allowed_amount: currentRecord.allowedAmount,
        insurance_paid: currentRecord.insurancePaid,
        date_paid: currentRecord.datePaid,
        is_paid: currentRecord.isPaid,
        notes: currentRecord.notes,
        authorization_yn: currentRecord.authorizationYN,
        billing_status: currentRecord.billingStatus,
        date_of_service: currentRecord.dateOfService,
        date_claim_submission: currentRecord.dateClaimSubmission,
        claim_number: currentRecord.claimNumber,
        patient_intake_id: null, // Will be set by backend based on enrollment_id
        patient_responsibility: Math.max(0, currentRecord.totalClaimAmount - currentRecord.allowedAmount),
        total_paid_balance: currentRecord.insurancePaid
      };
      
      if (isEditing) {
        await apiService.updatePaymentsBilling(currentRecord.id || '', apiData);
        const updatedRecords = [...billingRecords];
        updatedRecords[editIndex] = { ...currentRecord, ...apiData };
        setBillingRecords(updatedRecords);
      } else {
        const newRecord = await apiService.createPaymentsBilling(apiData);
        setBillingRecords([...billingRecords, newRecord]);
      }

      setCurrentRecord(initialBilling);
      setSelectedPatient('');
      setIsEditing(false);
      setEditIndex(-1);
      setSuccessMessage(isEditing ? 'Record successfully updated.' : 'Record successfully saved.');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save billing record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (index: number) => {
    setCurrentRecord(billingRecords[index]);
    setSelectedPatient(billingRecords[index].enrollmentId);
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDelete = async (index: number) => {
    const record = billingRecords[index];
    if (record.id && window.confirm('Are you sure you want to delete this record?')) {
      try {
        await apiService.deletePaymentsBilling(record.id);
        setBillingRecords(billingRecords.filter((_, i) => i !== index));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete record');
      }
    }
  };

  const filteredRecords = billingRecords.filter(record =>
    (record.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.enrollmentId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Billing & Payments</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 font-medium">Please fix the following errors:</span>
              <button
                onClick={() => setValidationErrors([])}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {isEditing ? 'Edit Billing Record' : 'Add New Billing Record'}
        </h3>

        {/* Patient Selection */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Patient (Enrollment ID) *
          </label>
          {isLoadingPatients ? (
            <div className="flex items-center gap-2 p-3 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Loading patients...
            </div>
          ) : (
          <select
            value={selectedPatient}
            onChange={(e) => handlePatientSelection(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isEditing}
          >
            <option value="">Select Patient</option>
            {patientIntakeData.map(patient => (
              <option key={patient.enrollment_id} value={patient.enrollment_id}>
                {patient.enrollment_id} - {patient.patient_name}
              </option>
            ))}
          </select>
          )}
        </div>

        {selectedPatient && (
          <div className="space-y-6">
            {/* Non-editable fields from Module 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                <input
                    type="text"
                    value={currentRecord.patientName}
                    readOnly
                    className={`w-full p-3 border rounded-lg bg-gray-100 text-gray-600 ${
                      patientNameError 
                        ? 'border-red-300' 
                        : 'border-gray-300'
                    }`}
                  />
                  {patientNameError && (
                    <p className="mt-1 text-sm text-red-600">{patientNameError}</p>
                  )}

              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment ID *</label>
                <input
                  type="text"
                  value={currentRecord.enrollmentId}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Member ID *</label>
                <input
                  type="text"
                  value={currentRecord.memberID}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DME Item *</label>
                <input
                  type="text"
                  value={currentRecord.dmeItem}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HCPCS Code *</label>
                <input
                  type="text"
                  value={currentRecord.hcpcs}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payer *</label>
                <input
                  type="text"
                  value={currentRecord.payer}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            {/* Editable billing fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Claim Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentRecord.totalClaimAmount}
                  onChange={(e) => updateCurrentRecord('totalClaimAmount', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentRecord.allowedAmount}
                  onChange={(e) => updateCurrentRecord('allowedAmount', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Paid Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentRecord.insurancePaid}
                  onChange={(e) => updateCurrentRecord('insurancePaid', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Paid *</label>
                <input
                  type="date"
                  value={currentRecord.datePaid}
                  onChange={(e) => updateCurrentRecord('datePaid', e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Is Paid *</label>
                <select
                  value={currentRecord.isPaid}
                  onChange={(e) => updateCurrentRecord('isPaid', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient Responsibility (PR) ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={Math.max(0, currentRecord.allowedAmount  - currentRecord.insurancePaid)}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated: Allowed Amount - Insurance Paid Amount</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Paid Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentRecord.totalPaidBalance}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated: Insurance Paid Amount</p>
              </div>
            </div>

            {/* Optional fields */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Optional Fields</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Billing Status</label>
                  <select
                    value={currentRecord.billingStatus}
                    onChange={(e) => updateCurrentRecord('billingStatus', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Pending">Pending</option>
                    <option value="Denied">Denied</option>
                    <option value="Paid">Paid</option>
                    <option value="In Process">In Process</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Service (DOS)</label>
                  <input
                    type="text"
                    value={new Date(currentRecord.dateOfService).toLocaleDateString()}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={currentRecord.authorizationYN}
                      readOnly
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Authorization</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Claim Submission</label>
                  <input
                    type="date"
                    value={currentRecord.dateClaimSubmission}
                    onChange={(e) => updateCurrentRecord('dateClaimSubmission', e.target.value)}
                    onKeyDown={(e) => e.preventDefault()}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Claim Number</label>
                  <input
                    type="text"
                    value={currentRecord.claimNumber}
                    onChange={(e) => updateCurrentRecord('claimNumber', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes *</label>
              <textarea
                value={currentRecord.notes}
                onChange={(e) => updateCurrentRecord('notes', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter any additional notes..."
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading || !validateForm()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : (isEditing ? 'Update Record' : 'Save Record')}
            </button>
          </div>
        )}
      </div>

      {/* Records Table */}
      {filteredRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Billing Records ({filteredRecords.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DME Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Claim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Responsibility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.enrollmentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.dmeItem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(record.totalClaimAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(record.insurancePaid || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(record.patientResponsibility || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.isPaid === 'Yes'
                          ? 'bg-green-100 text-green-800'
                          : record.isPaid === 'Partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.isPaid}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};