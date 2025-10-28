import React, { useState, useEffect } from 'react';
import { AuditTrailData } from '../../types';
import { apiService } from '../../services/api';
import { Search, Filter, Eye, Calendar, CreditCard as Edit, Save, Download, X } from 'lucide-react';

interface AuditTrailRecord {
  patient_intake_id: number;
  enrollment_id: string;
  patient_name: string;
  dob: string;
  gender: string;
  member_id: string;
  phone: string;
  address: string;
  date_of_service: string;
  insurance: string;
  vendor: string;
  diagnosis_icd10: string;
  dme_items: string;
  hcpcs_codes: string[];
  medical_necessity_yn: boolean;
  prior_auth_yn: boolean;
  auth_number: string;
  billing_payments: Array<{
    id: number;
    billing_status: string;
    total_claim_amount: string;
    allowed_amount: string;
    insurance_paid: string;
    patient_responsibility: string;
    total_paid_balance: string;
    date_paid: string;
    is_paid: string;
    claim_number: string;
    date_claim_submission: string;
    notes: string;
  }>;
  total_billed_amount: number;
  total_insurance_paid: number;
  total_patient_responsibility: number;
  total_balance_due: number;
  overall_billing_status: string;
  created_at: string;
  updated_at: string;
}

interface AuditTrailResponse {
  success: boolean;
  data: AuditTrailRecord[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  message: string;
}

export const AuditTrailForm: React.FC = () => {
  const [auditRecords, setAuditRecords] = useState<AuditTrailRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AuditTrailRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AuditTrailRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [overallTotals, setOverallTotals] = useState({
    totalClaimAmount: 0,
    allowedAmount: 0,
    insurancePaid: 0,
    patientResponsibility: 0
  });
  const recordsPerPage = 10;

  const clearAllFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setDateToFilter('');
    setStatusFilter('');
    setInsuranceFilter('');
    setCurrentPage(1);
  };

  useEffect(() => {
    loadAuditRecords();
  }, [currentPage, searchTerm, dateFilter, dateToFilter, statusFilter, insuranceFilter]);

  const loadAuditRecords = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage,
        per_page: recordsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(dateFilter && { date_from: dateFilter }),
        ...(dateToFilter && { date_to: dateToFilter }),
        ...(statusFilter && { billing_status: statusFilter }),
        ...(insuranceFilter && { insurance: insuranceFilter })
      };
      
      const response: AuditTrailResponse = await apiService.getAuditTrail(params);
      
      if (response.success) {
        setAuditRecords(response.data);
        setTotalRecords(response.pagination.total);
        setTotalPages(response.pagination.last_page);
        
        // Calculate overall totals from all records
        const totals = response.data.reduce((acc, record) => {
          // Sum up all billing payments for each record
          const recordTotals = record.billing_payments.reduce((paymentAcc, payment) => ({
            totalClaimAmount: paymentAcc.totalClaimAmount + parseFloat(payment.total_claim_amount),
            allowedAmount: paymentAcc.allowedAmount + parseFloat(payment.allowed_amount),
            insurancePaid: paymentAcc.insurancePaid + parseFloat(payment.insurance_paid),
            patientResponsibility: paymentAcc.patientResponsibility + parseFloat(payment.patient_responsibility)
          }), {
            totalClaimAmount: 0,
            allowedAmount: 0,
            insurancePaid: 0,
            patientResponsibility: 0
          });
          
          return {
            totalClaimAmount: acc.totalClaimAmount + recordTotals.totalClaimAmount,
            allowedAmount: acc.allowedAmount + recordTotals.allowedAmount,
            insurancePaid: acc.insurancePaid + recordTotals.insurancePaid,
            patientResponsibility: acc.patientResponsibility + recordTotals.patientResponsibility
          };
        }, {
          totalClaimAmount: 0,
          allowedAmount: 0,
          insurancePaid: 0,
          patientResponsibility: 0
        });
        
        setOverallTotals(totals);
      } else {
        throw new Error(response.message || 'Failed to load audit records');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load audit records');
      console.error('Failed to load audit records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (record: AuditTrailRecord) => {
    setIsLoading(true);
    try {
      if (record.patient_intake_id) {
        const detailedRecord = await apiService.getAuditRecord(record.patient_intake_id.toString());
        setSelectedRecord(detailedRecord);
      } else {
        setSelectedRecord(record);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load record details');
      setSelectedRecord(record); // Fallback to the record we have
    } finally {
      setIsLoading(false);
    }
    setSelectedRecord(record);
    setIsEditing(false);
  };

  const handleEditRecord = (record: AuditTrailRecord) => {
    setEditingRecord({ ...record });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update the record in the audit records array
      const updatedRecords = auditRecords.map(record => 
        record.patient_intake_id === editingRecord.patient_intake_id ? editingRecord : record
      );
      setAuditRecords(updatedRecords);
      
      // Update the selected record if it's the same one being edited
      if (selectedRecord?.patient_intake_id === editingRecord.patient_intake_id) {
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

  const handleExportAuditTrail = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const params = {
        ...(dateFilter && { date_from: dateFilter }),
        ...(dateToFilter && { date_to: dateToFilter }),
        ...(statusFilter && { status: statusFilter })
      };
      
      const response = await apiService.exportAuditTrail(params);
      
      if (response.success) {
        // Convert JSON data to CSV
        const csvContent = convertToCSV(response.data);
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.message || 'Export failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export audit trail');
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: AuditTrailRecord[]): string => {
    if (data.length === 0) return '';
    
    // CSV Headers
    const headers = [
      'Patient Name',
      'Member ID',
      'Enrollment ID',
      'DOB',
      'Gender',
      'Phone',
      'Address',
      'Date of Service',
      'Insurance',
      'Vendor',
      'Diagnosis ICD10',
      'DME Items',
      'HCPCS Codes',
      'Medical Necessity',
      'Prior Auth',
      'Auth Number',
      'Total Billed Amount',
      'Total Insurance Paid',
      'Total Patient Responsibility',
      'Total Balance Due',
      'Overall Billing Status',
      'Created At',
      'Updated At'
    ];
    
    // Convert data to CSV rows
    const rows = data.map(record => [
      record.patient_name,
      record.member_id,
      record.enrollment_id,
      record.dob,
      record.gender,
      record.phone,
      record.address,
      record.date_of_service,
      record.insurance,
      record.vendor,
      record.diagnosis_icd10,
      record.dme_items,
      record.hcpcs_codes.join('; '),
      record.medical_necessity_yn ? 'Yes' : 'No',
      record.prior_auth_yn ? 'Yes' : 'No',
      record.auth_number || '',
      record.total_billed_amount.toString(),
      record.total_insurance_paid.toString(),
      record.total_patient_responsibility.toString(),
      record.total_balance_due.toString(),
      record.overall_billing_status,
      record.created_at,
      record.updated_at
    ]);
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

  const updateEditingRecord = (field: keyof AuditTrailRecord, value: any) => {
    if (!editingRecord) return;
    
    setEditingRecord(prev => ({
      ...prev!,
      [field]: value
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
        {/* <button
          onClick={handleExportAuditTrail}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button> */}
      </div>

      {/* Overall Totals */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Totals</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">${overallTotals.totalClaimAmount.toFixed(2)}</div>
            <div className="text-sm font-medium text-blue-600 mb-1">Total Claim Amount</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              ${overallTotals.allowedAmount.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Allowed Amount</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${overallTotals.insurancePaid.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Insurance Paid</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${overallTotals.patientResponsibility.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Patient Responsibility</div>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient, enrollment ID, member ID..."
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
              onKeyDown={(e) => e.preventDefault()}
              placeholder="From Date"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              onKeyDown={(e) => e.preventDefault()}
              placeholder="To Date"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={insuranceFilter}
              onChange={(e) => setInsuranceFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Insurance</option>
             <option value="Aetna">Aetna</option>
             <option value="Anthem">Anthem</option>
             <option value="Cigna">Cigna</option>
             <option value="Clover">Clover</option>
             <option value="Humana">Humana</option>
             <option value="Medicaid">Medicaid</option>
              <option value="Medicare">Medicare</option>
              <option value="UHC">UHC</option>
             <option value="Well Care">Well Care</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Billing Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending">Pending</option>
              <option value="Denied">Denied</option>
              <option value="Paid">Paid</option>
              <option value="In Process">In Process</option>
            </select>
          </div>
         <button 
           onClick={clearAllFilters}
           className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
         >
           <X className="w-4 h-4" />
           Clear Filters
          </button>
        </div>
      </div>

     
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Audit Records ({totalRecords} total)
            {isLoading && <span className="text-sm text-gray-500 ml-2">Loading...</span>}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DME Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditRecords.map((record, index) => (
                <tr key={record.patient_intake_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.patient_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.member_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.enrollment_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.insurance}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.dme_items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.date_of_service).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.overall_billing_status === 'Paid'
                        ? 'bg-green-100 text-green-800'
                        : record.overall_billing_status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : record.overall_billing_status === 'Denied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {record.overall_billing_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.total_billed_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.total_balance_due.toFixed(2)}
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Audit Record' : 'Audit Details'} - {selectedRecord.patient_name}
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
                  <div><span className="font-medium">Name:</span> {selectedRecord.patient_name}</div>
                  <div><span className="font-medium">Member ID:</span> {selectedRecord.member_id}</div>
                  <div><span className="font-medium">Enrollment ID:</span> {selectedRecord.enrollment_id}</div>
                  <div><span className="font-medium">DOB:</span> {new Date(selectedRecord.dob).toLocaleDateString()}</div>
                  <div><span className="font-medium">Gender:</span> {selectedRecord.gender}</div>
                  <div><span className="font-medium">Phone:</span> {selectedRecord.phone}</div>
                  <div className="col-span-2"><span className="font-medium">Address:</span> {selectedRecord.address}</div>
                </div>
              </div>

              {/* Clinical Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Clinical & Insurance Information</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><span className="font-medium">Insurance:</span> {selectedRecord.insurance}</div>
                  <div><span className="font-medium">Vendor:</span> {selectedRecord.vendor}</div>
                  <div><span className="font-medium">Date of Service:</span> {new Date(selectedRecord.date_of_service).toLocaleDateString()}</div>
                  <div><span className="font-medium">Diagnosis (ICD-10):</span> {selectedRecord.diagnosis_icd10}</div>
                  <div><span className="font-medium">DME Items:</span> {selectedRecord.dme_items}</div>
                  <div><span className="font-medium">HCPCS Codes:</span> {selectedRecord.hcpcs_codes.join(', ')}</div>
                  <div><span className="font-medium">Medical Necessity:</span> {selectedRecord.medical_necessity_yn ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">Prior Authorization:</span> {selectedRecord.prior_auth_yn ? 'Yes' : 'No'}</div>
                  {selectedRecord.auth_number && (
                    <div><span className="font-medium">Auth Number:</span> {selectedRecord.auth_number}</div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Financial Summary</h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div><span className="font-medium">Total Billed:</span> ${selectedRecord.total_billed_amount.toFixed(2)}</div>
                  <div><span className="font-medium">Insurance Paid:</span> ${selectedRecord.total_insurance_paid.toFixed(2)}</div>
                  <div><span className="font-medium">Patient Responsibility:</span> ${selectedRecord.total_patient_responsibility.toFixed(2)}</div>
                  <div><span className="font-medium">Balance Due:</span> ${selectedRecord.total_balance_due.toFixed(2)}</div>
                  <div className="col-span-4">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedRecord.overall_billing_status === 'Paid'
                        ? 'bg-green-100 text-green-800'
                        : selectedRecord.overall_billing_status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : selectedRecord.overall_billing_status === 'Denied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      Overall Status: {selectedRecord.overall_billing_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billing Payments Details */}
              {selectedRecord.billing_payments && selectedRecord.billing_payments.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Billing Payments Details</h4>
                  <div className="space-y-4">
                    {selectedRecord.billing_payments.map((payment, index) => (
                      <div key={payment.id} className="bg-white p-3 rounded border">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div><span className="font-medium">Claim Number:</span> {payment.claim_number}</div>
                          <div><span className="font-medium">Billing Status:</span> {payment.billing_status}</div>
                          <div><span className="font-medium">Is Paid:</span> {payment.is_paid}</div>
                          <div><span className="font-medium">Total Claim Amount:</span> ${parseFloat(payment.total_claim_amount).toFixed(2)}</div>
                          <div><span className="font-medium">Allowed Amount:</span> ${parseFloat(payment.allowed_amount).toFixed(2)}</div>
                          <div><span className="font-medium">Insurance Paid:</span> ${parseFloat(payment.insurance_paid).toFixed(2)}</div>
                          <div><span className="font-medium">Patient Responsibility:</span> ${parseFloat(payment.patient_responsibility).toFixed(2)}</div>
                          <div><span className="font-medium">Date Paid:</span> {new Date(payment.date_paid).toLocaleDateString()}</div>
                          <div><span className="font-medium">Date Claim Submitted:</span> {payment.date_claim_submission ? new Date(payment.date_claim_submission).toLocaleDateString() : 'N/A'}</div>
                          {payment.notes && (
                            <div className="col-span-3"><span className="font-medium">Notes:</span> {payment.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Record Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Created:</span> {new Date(selectedRecord.created_at).toLocaleString()}</div>
                  <div><span className="font-medium">Last Updated:</span> {new Date(selectedRecord.updated_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};