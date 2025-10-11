import React, { useState } from 'react';
import { PaymentsBillingData } from '../../types';
import { apiService } from '../../services/api';
import { Plus, Edit, Trash2, Save, Search } from 'lucide-react';

const initialBilling: PaymentsBillingData = {
  patientName: '',
  dmeItem: '',
  hcpcs: '',
  payer: '',
  totalCharge: 0,
  insurancePaid: 0,
  patientPaid: 0,
  datePaid: '',
  isPaid: false,
  remainingBalance: 0,
  totalPaid: 0,
  notes: '',
  authorizationYN: false,
  billingStatus: 'Pending',
  dateOfService: '',
  dateClaimSubmission: '',
  claimNumber: ''
};

export const PaymentsBillingForm: React.FC = () => {
  const [billingRecords, setBillingRecords] = useState<PaymentsBillingData[]>([]);
  const [currentRecord, setCurrentRecord] = useState<PaymentsBillingData>(initialBilling);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTotals = (record: PaymentsBillingData) => {
    const totalPaid = record.insurancePaid + record.patientPaid;
    const remainingBalance = record.totalCharge - totalPaid;
    return {
      ...record,
      totalPaid,
      remainingBalance,
      isPaid: remainingBalance <= 0
    };
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    
    const calculatedRecord = calculateTotals(currentRecord);
    
    try {
      if (isEditing) {
        // Update existing record
        await apiService.updatePaymentsBilling(calculatedRecord.id || '', calculatedRecord);
        const updatedRecords = [...billingRecords];
        updatedRecords[editIndex] = calculatedRecord;
        setBillingRecords(updatedRecords);
      } else {
        // Create new record
        const newRecord = await apiService.createPaymentsBilling(calculatedRecord);
        setBillingRecords([...billingRecords, newRecord]);
      }

      setCurrentRecord(initialBilling);
      setIsEditing(false);
      setEditIndex(-1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save billing record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (index: number) => {
    setCurrentRecord(billingRecords[index]);
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDelete = (index: number) => {
    const record = billingRecords[index];
    if (record.id && window.confirm('Are you sure you want to delete this record?')) {
      apiService.deletePaymentsBilling(record.id)
        .then(() => {
          setBillingRecords(billingRecords.filter((_, i) => i !== index));
        })
        .catch((error) => {
          setError(error instanceof Error ? error.message : 'Failed to delete record');
        });
    }
  };

  const filteredRecords = billingRecords.filter(record =>
    record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.dmeItem.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payments & Billing</h2>
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
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {isEditing ? 'Edit Billing Record' : 'Add New Billing Record'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
            <input
              type="text"
              value={currentRecord.patientName}
              onChange={(e) => setCurrentRecord({...currentRecord, patientName: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">DME Item</label>
            <input
              type="text"
              value={currentRecord.dmeItem}
              onChange={(e) => setCurrentRecord({...currentRecord, dmeItem: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">HCPCS Code</label>
            <input
              type="text"
              value={currentRecord.hcpcs}
              onChange={(e) => setCurrentRecord({...currentRecord, hcpcs: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payer</label>
            <input
              type="text"
              value={currentRecord.payer}
              onChange={(e) => setCurrentRecord({...currentRecord, payer: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Charge ($)</label>
            <input
              type="number"
              step="0.01"
              value={currentRecord.totalCharge}
              onChange={(e) => setCurrentRecord({...currentRecord, totalCharge: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Paid ($)</label>
            <input
              type="number"
              step="0.01"
              value={currentRecord.insurancePaid}
              onChange={(e) => setCurrentRecord({...currentRecord, insurancePaid: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient Paid ($)</label>
            <input
              type="number"
              step="0.01"
              value={currentRecord.patientPaid}
              onChange={(e) => setCurrentRecord({...currentRecord, patientPaid: parseFloat(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Paid Balance ($)</label>
            <input
              type="number"
              step="0.01"
              value={currentRecord.insurancePaid + currentRecord.patientPaid}
              readOnly
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-calculated: Insurance Paid + Patient Paid</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remaining Balance ($)</label>
            <input
              type="number"
              step="0.01"
              value={currentRecord.totalCharge - (currentRecord.insurancePaid + currentRecord.patientPaid)}
              readOnly
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-calculated: Total Charge - Total Paid Balance</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Paid</label>
            <input
              type="date"
              value={currentRecord.datePaid}
              onChange={(e) => setCurrentRecord({...currentRecord, datePaid: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Billing Status</label>
            <select
              value={currentRecord.billingStatus}
              onChange={(e) => setCurrentRecord({...currentRecord, billingStatus: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Pending">Pending</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Denied">Denied</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Service</label>
            <input
              type="date"
              value={currentRecord.dateOfService}
              onChange={(e) => setCurrentRecord({...currentRecord, dateOfService: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Claim Submitted</label>
            <input
              type="date"
              value={currentRecord.dateClaimSubmission}
              onChange={(e) => setCurrentRecord({...currentRecord, dateClaimSubmission: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Claim Number</label>
            <input
              type="text"
              value={currentRecord.claimNumber}
              onChange={(e) => setCurrentRecord({...currentRecord, claimNumber: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={currentRecord.authorizationYN}
              onChange={(e) => setCurrentRecord({...currentRecord, authorizationYN: e.target.checked})}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Authorization Required</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={currentRecord.notes}
              onChange={(e) => setCurrentRecord({...currentRecord, notes: e.target.value})}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : (isEditing ? 'Update Record' : 'Add Record')}
        </button>
      </div>

      {/* Records Table */}
      {filteredRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Billing Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DME Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Charge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
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
                      {record.dmeItem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${record.totalCharge.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${record.totalPaid.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${record.remainingBalance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.isPaid
                          ? 'bg-green-100 text-green-800'
                          : record.remainingBalance > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.isPaid ? 'Paid' : 'Outstanding'}
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