import React, { useState, useEffect } from 'react';
import { PatientIntakeData } from '../../types';
import { apiService } from '../../services/api';
import { Search, Filter, Eye, CreditCard as Edit, Trash2, Calendar, User, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface PatientIntakeListProps {
  status: 'complete' | 'all';
  title: string;
}

export const PatientIntakeList: React.FC<PatientIntakeListProps> = ({ status, title }) => {
  const [intakeRecords, setIntakeRecords] = useState<PatientIntakeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PatientIntakeData | null>(null);

  useEffect(() => {
    loadIntakeRecords();
  }, [status]);

  const loadIntakeRecords = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getPatientIntakes({ per_page: 100 });
      let records = response.data || [];
      
      // Filter based on status
      if (status === 'complete') {
        // Assuming complete means all required fields are filled
        records = records.filter(record => 
          record.patient_name && 
          record.dme_items && 
          record.date_of_service &&
          record.tracking_number
        );
      }
      
      setIntakeRecords(records);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load patient intake records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient intake record?')) {
      try {
        await apiService.deletePatientIntake(id);
        setIntakeRecords(records => records.filter(record => record.id !== id));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete record');
      }
    }
  };

  const getStatusBadge = (record: any) => {
    const hasAllRequired = record.patient_name && record.dme_items && record.date_of_service;
    const hasDelivery = record.tracking_number;
    
    if (hasAllRequired && hasDelivery) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Complete
        </span>
      );
    } else if (hasAllRequired) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          In Progress
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Incomplete
        </span>
      );
    }
  };

  const filteredRecords = intakeRecords.filter(record => {
    const matchesSearch = 
      (record.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.enrollment_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.member_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !dateFilter || (record.date_of_service && record.date_of_service >= dateFilter);
    const matchesInsurance = !insuranceFilter || record.insurance === insuranceFilter;

    return matchesSearch && matchesDate && matchesInsurance;
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
          <p className="text-white-600 mt-1">
            {status === 'complete' ? 'Completed patient intake records' : 'All patient intake records'}
          </p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients, enrollment ID..."
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
              value={insuranceFilter}
              onChange={(e) => setInsuranceFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Insurance</option>
              <option value="Medicare">Medicare</option>
              <option value="Medicaid">Medicaid</option>
              <option value="Insurance">Insurance</option>
              <option value="Self-Pay">Self-Pay</option>
            </select>
          </div>
          <button 
            onClick={loadIntakeRecords}
            className="flex items-center justify-center gap-2 px-4 py-2  text-white rounded-lg transition-colors" style={{backgroundColor: 'rgb(30, 152, 156)'}}
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
            Patient Intake Records ({filteredRecords.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DME Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.patient_name || 'N/A'}
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
                    {record.dme_items || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.insurance || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.date_of_service ? new Date(record.date_of_service).toLocaleDateString() : 'N/A'}
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
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No patient intake records found</p>
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
                Patient Intake Details - {selectedRecord.patient_name}
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
                  <div><span className="font-medium">DOB:</span> {new Date(selectedRecord.dob).toLocaleDateString() || 'N/A'}</div>
                  <div><span className="font-medium">Gender:</span> {selectedRecord.gender || 'N/A'}</div>
                  <div><span className="font-medium">Phone:</span> {selectedRecord.phone || 'N/A'}</div>
                  <div className="col-span-2"><span className="font-medium">Address:</span> {selectedRecord.address || 'N/A'}</div>
                </div>
              </div>

              {/* Clinical Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Clinical Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">DME Items:</span> {selectedRecord.dme_items || 'N/A'}</div>
                  <div><span className="font-medium">HCPCS Codes:</span> {
                    Array.isArray(selectedRecord.hcpcs_codes) 
                      ? selectedRecord.hcpcs_codes.join(', ') 
                      : selectedRecord.hcpcs_codes || 'N/A'
                  }</div>
                  <div><span className="font-medium">Diagnosis:</span> {selectedRecord.diagnosis_icd10 || 'N/A'}</div>
                  <div><span className="font-medium">Date of Service:</span> {new Date(selectedRecord.date_of_service).toLocaleDateString() || 'N/A'}</div>
                  <div><span className="font-medium">Insurance:</span> {selectedRecord.insurance || 'N/A'}</div>
                  <div><span className="font-medium">Vendor:</span> {selectedRecord.vendor || 'N/A'}</div>
                </div>
              </div>

              {/* Delivery Information */}
              {selectedRecord.tracking_number && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Delivery Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Tracking Number:</span> {selectedRecord.tracking_number}</div>
                    <div><span className="font-medium">Carrier:</span> {selectedRecord.carrier_service || 'N/A'}</div>
                    <div><span className="font-medium">Ship Date:</span> {new Date(selectedRecord.date_of_shipment).toLocaleDateString() || 'N/A'}</div>
                    <div><span className="font-medium">Delivery Date:</span> {new Date(selectedRecord.estimated_delivery_date).toLocaleDateString() || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};