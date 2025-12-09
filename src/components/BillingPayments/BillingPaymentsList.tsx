import React, { useState, useEffect } from 'react';
import { PaymentsBillingData } from '../../types';
import { apiService } from '../../services/api';
import { Search, Filter, Eye, CreditCard as Edit, Trash2, Calendar, CreditCard, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface BillingPaymentsListProps {
  title: string;
}

export const BillingPaymentsList: React.FC<BillingPaymentsListProps> = ({ title }) => {
  const [billingRecords, setBillingRecords] = useState<PaymentsBillingData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payerFilter, setPayerFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PaymentsBillingData | null>(null);

  useEffect(() => {
    loadBillingRecords();
  }, []);

  const loadBillingRecords = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getPaymentsBilling({ per_page: 100 });
      setBillingRecords(response.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load billing records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this billing record?')) {
      try {
        await apiService.deletePaymentsBilling(id);
        setBillingRecords(records => records.filter(record => record.id !== id));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete record');
      }
    }
  };

  const getStatusBadge = (record: PaymentsBillingData) => {
    if (record.billing_status === 'Paid') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </span>
      );
    }  else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          {record.billing_status}
        </span>
      );
    }
  };

  const filteredRecords = billingRecords.filter(record => {
    const matchesSearch = 
      (record.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.enrollment_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.claim_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !dateFilter || (record.date_paid && record.date_paid >= dateFilter);
    const matchesStatus = !statusFilter || record.is_paid === statusFilter;
    const matchesPayer = !payerFilter || record.payer === payerFilter;

    return matchesSearch && matchesDate && matchesStatus && matchesPayer;
  });

  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-white-600 mt-1">Manage billing and payment records</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Records: {filteredRecords.length}
        </div>
      </div>

      

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients, claims..."
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
              <option value="Yes">Paid</option>
              <option value="No">Outstanding</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
          <div>
            <select
              value={payerFilter}
              onChange={(e) => setPayerFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Payers</option>
              <option value="Medicare">Medicare</option>
              <option value="Medicaid">Medicaid</option>
              <option value="Insurance">Insurance</option>
              <option value="Self-Pay">Self-Pay</option>
            </select>
          </div>
          <button 
            onClick={loadBillingRecords}
            className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
            style={{backgroundColor: 'rgb(30, 152, 156)'}}
          >
            <Filter className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Billing Records ({filteredRecords.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DME Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Responsibility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CreditCard className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.patient_intake.patient_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.member_id || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.enrollment_id || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.dme_item || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.payer || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(record.total_claim_amount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(record.insurance_paid || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(new Date(record.date_paid).toLocaleDateString() || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(record.patient_responsibility || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(record)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id!)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No billing records found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Billing Details - {selectedRecord.patient_name}
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Patient Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedRecord.patient_name || 'N/A'}</div>
                  <div><span className="font-medium">Enrollment ID:</span> {selectedRecord.enrollment_id || 'N/A'}</div>
                  <div><span className="font-medium">Member ID:</span> {selectedRecord.member_id || 'N/A'}</div>
                  <div><span className="font-medium">DME Item:</span> {selectedRecord.dme_item || 'N/A'}</div>
                  <div><span className="font-medium">HCPCS:</span> {selectedRecord.hcpcs || 'N/A'}</div>
                  <div><span className="font-medium">Payer:</span> {selectedRecord.payer || 'N/A'}</div>
                </div>
              </div>

              {/* Billing Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Billing Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Total Claim Amount:</span> ${parseFloat(selectedRecord.total_claim_amount || '0').toFixed(2)}</div>
                  <div><span className="font-medium">Allowed Amount:</span> ${parseFloat(selectedRecord.allowed_amount || '0').toFixed(2)}</div>
                  <div><span className="font-medium">Insurance Paid:</span> ${parseFloat(selectedRecord.insurance_paid || '0').toFixed(2)}</div>
                  <div><span className="font-medium">Patient Responsibility:</span> ${parseFloat(selectedRecord.patient_responsibility || '0').toFixed(2)}</div>
                  <div><span className="font-medium">Date Paid:</span> {selectedRecord.date_paid ? new Date(selectedRecord.date_paid).toLocaleDateString() : 'N/A'}</div>
                  <div><span className="font-medium">Payment Status:</span> {selectedRecord.is_paid || 'N/A'}</div>
                  <div><span className="font-medium">Billing Status:</span> {selectedRecord.billing_status || 'N/A'}</div>
                  <div><span className="font-medium">Claim Number:</span> {selectedRecord.claim_number || 'N/A'}</div>
                </div>
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};