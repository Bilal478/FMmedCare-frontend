import React, { useState, useEffect } from 'react';
import { PatientIntakeData } from '../../types';
import { apiService } from '../../services/api';
import { 
  User, 
  Shield, 
  Stethoscope, 
  FileText, 
  Truck, 
  CheckCircle,
  Save,
  ChevronRight,
  ChevronLeft,
  Hash,
  X,
  AlertCircle
} from 'lucide-react';

const initialData: PatientIntakeData = {
  enrollmentId: '',
  patientInfo: {
    patientName: '',
    dob: '',
    gender: '',
    memberID: '',
    phone: '',
    address: '',
    dateOfService: ''
  },
  selectionInfo: {
    insurance: '',
    vendor: ''
  },
  physicianInfo: {
    primaryPhysician: '',
    physicianNPI: '',
    prescribingProvider: ''
  },
  clinicalInfo: {
    diagnosisICD10: '',
    dateOfPrescription: '',
    dmeItems: '',
    numberOfItems: 1,
    hcpcsCodes: [],
    medicalNecessityYN: false,
    priorAuthYN: false,
    authNumber: ''
  },
  deliveryTracking: {
    dateOfShipment: '',
    estimatedDeliveryDate: '',
    carrierService: '',
    trackingNumber: '',
    proofOfDelivery: '',
    additionalNotes: ''
  }
};

const insuranceOptions = [
  'Medicare',
  'Medicaid',
  'Insurance',
  'Self-Pay'
];

const vendorOptions = [
  'Vendor A - Medical Supplies',
  'Vendor B - DME Equipment',
  'Vendor C - Orthotic Devices',
  'Vendor D - Mobility Aids',
  'Vendor E - Respiratory Equipment'
];

const dmeItemOptions = [
  'Wrist Brace',
  'Knee Brace',
  'Ankle Brace',
  'Back Brace',
  'Lower Back Support',
  'Shoulder Brace',
  'Hip Support',
  'Neck Brace',
  'CGM (Continuous Glucose Monitor)',
  'CPAP Machine',
  'Wheelchair',
  'Walker',
  'Oxygen Concentrator'
];

const carrierOptions = [
  'FedEx',
  'USPS',
  'DHL'
];

const commonHCPCSCodes = [
  'L0457', 'L1852', 'L2397', 'L3916', 'L1971', 
  'L3761', 'L3960', 'L0651', 'L1833', 'E0607',
  'K0001', 'E1390', 'E0424', 'A4253'
];

export const PatientIntakeForm: React.FC = () => {
  const [data, setData] = useState<PatientIntakeData>(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hcpcsInput, setHcpcsInput] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoadingEnrollmentId, setIsLoadingEnrollmentId] = useState(false);

  const fetchEnrollmentId = async () => {
    setIsLoadingEnrollmentId(true);
    try {
      const response = await apiService.getNextEnrollmentId();
      setData(prev => ({
        ...prev,
        enrollmentId: response.enrollment_id
      }));
    } catch (error) {
      console.error('Failed to fetch enrollment ID from API:', error);
      // Fallback to local generation if API fails
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      const fallbackId = `FM${randomNum.toString().padStart(4, '0')}`;
      setData(prev => ({
        ...prev,
        enrollmentId: fallbackId
      }));
    } finally {
      setIsLoadingEnrollmentId(false);
    }
  };

  // Validation functions for each step
  const validateStep1 = () => {
    const { patientInfo, selectionInfo } = data;
    return (
      selectionInfo.insurance &&
      selectionInfo.vendor &&
      patientInfo.patientName &&
      patientInfo.dob &&
      patientInfo.gender &&
      patientInfo.memberID &&
      patientInfo.phone &&
      patientInfo.address &&
      patientInfo.dateOfService
    );
  };

  const validateStep2 = () => {
    const { clinicalInfo } = data;
    return (
      clinicalInfo.dmeItems &&
      clinicalInfo.numberOfItems > 0 &&
      clinicalInfo.hcpcsCodes.length > 0
    );
  };

  const validateStep3 = () => {
    const { deliveryTracking } = data;
    return (
      deliveryTracking.dateOfShipment &&
      deliveryTracking.estimatedDeliveryDate &&
      deliveryTracking.carrierService &&
      deliveryTracking.trackingNumber
    );
  };

  const steps = [
    { id: 'patient', title: 'Patient Information', icon: User },
    { id: 'clinical', title: 'Physician & Clinical Information', icon: Stethoscope },
    { id: 'delivery', title: 'Delivery & Tracking', icon: Truck }
  ];

  // Generate enrollment ID on component mount
  useEffect(() => {
    fetchEnrollmentId();
  }, []);

  const updateData = (section: keyof PatientIntakeData, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && prev[section] !== null
        ? { ...prev[section] as any, [field]: value }
        : value
    }));
  };

  const addHCPCSCode = () => {
    if (hcpcsInput.trim() && !data.clinicalInfo.hcpcsCodes.includes(hcpcsInput.trim())) {
      updateData('clinicalInfo', 'hcpcsCodes', [...data.clinicalInfo.hcpcsCodes, hcpcsInput.trim()]);
      setHcpcsInput('');
    }
  };

  const removeHCPCSCode = (codeToRemove: string) => {
    updateData('clinicalInfo', 'hcpcsCodes', 
      data.clinicalInfo.hcpcsCodes.filter(code => code !== codeToRemove)
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setValidationErrors([]);
    
    try {
      // Transform data to match Laravel API structure
      const apiData = {
        enrollment_id: data.enrollmentId,
        patient_info: {
          patient_name: data.patientInfo.patientName,
          dob: data.patientInfo.dob,
          gender: data.patientInfo.gender,
          member_id: data.patientInfo.memberID,
          phone: data.patientInfo.phone,
          address: data.patientInfo.address,
          date_of_service: data.patientInfo.dateOfService
        },
        selection_info: {
          insurance: data.selectionInfo.insurance,
          vendor: data.selectionInfo.vendor
        },
        physician_info: {
          primary_physician: data.physicianInfo.primaryPhysician,
          physician_npi: data.physicianInfo.physicianNPI,
          prescribing_provider: data.physicianInfo.prescribingProvider
        },
        clinical_info: {
          diagnosis_icd10: data.clinicalInfo.diagnosisICD10,
          date_of_prescription: data.clinicalInfo.dateOfPrescription,
          dme_items: data.clinicalInfo.dmeItems,
          number_of_items: data.clinicalInfo.numberOfItems,
          hcpcs_codes: data.clinicalInfo.hcpcsCodes,
          medical_necessity_yn: data.clinicalInfo.medicalNecessityYN,
          prior_auth_yn: data.clinicalInfo.priorAuthYN,
          auth_number: data.clinicalInfo.authNumber
        },
        delivery_tracking: {
          date_of_shipment: data.deliveryTracking.dateOfShipment,
          estimated_delivery_date: data.deliveryTracking.estimatedDeliveryDate,
          carrier_service: data.deliveryTracking.carrierService,
          tracking_number: data.deliveryTracking.trackingNumber,
          proof_of_delivery: data.deliveryTracking.proofOfDelivery,
          additional_notes: data.deliveryTracking.additionalNotes
        }
      };
      
      await apiService.createPatientIntake(apiData);
      setSuccessMessage('Patient intake data saved successfully!');
      // Reset form and fetch new enrollment ID
      setData(initialData);
      await fetchEnrollmentId();
      setCurrentStep(0);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save patient intake data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {/* Header with Enrollment ID */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-600" />
                {isLoadingEnrollmentId ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-lg font-semibold text-gray-500">Loading Enrollment ID...</span>
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-gray-900">
                    Enrollment ID: {data.enrollmentId || 'Not assigned'}
                  </span>
                )}
              </div>
            </div>

            {/* Top Selection Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Selection *
                </label>
                <select
                  value={data.selectionInfo.insurance}
                  onChange={(e) => updateData('selectionInfo', 'insurance', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Insurance</option>
                  {insuranceOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Selection *
                </label>
                <select
                  value={data.selectionInfo.vendor}
                  onChange={(e) => updateData('selectionInfo', 'vendor', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendorOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {!validateStep1() && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    Complete all required fields to continue
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                <input
                  type="text"
                  value={data.patientInfo.patientName}
                  onChange={(e) => updateData('patientInfo', 'patientName', e.target.value)}
                  disabled={!data.selectionInfo.insurance || !data.selectionInfo.vendor}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={data.patientInfo.dob}
                  onChange={(e) => updateData('patientInfo', 'dob', e.target.value)}
                  disabled={!data.selectionInfo.insurance || !data.selectionInfo.vendor}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <select
                  value={data.patientInfo.gender}
                  onChange={(e) => updateData('patientInfo', 'gender', e.target.value)}
                  disabled={!data.selectionInfo.insurance || !data.selectionInfo.vendor}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient ID / Member ID *</label>
                <input
                  type="text"
                  value={data.patientInfo.memberID}
                  onChange={(e) => updateData('patientInfo', 'memberID', e.target.value)}
                  disabled={!data.selectionInfo.insurance || !data.selectionInfo.vendor}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  pattern="[0-9]*"
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.replace(/[^0-9]/g, '');
                  }}
                  value={data.patientInfo.phone}
                  onChange={(e) => updateData('patientInfo', 'phone', e.target.value)}
                  disabled={!data.selectionInfo.insurance || !data.selectionInfo.vendor}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter phone number (numbers only)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Service (DOS) *</label>
                <input
                  type="date"
                  value={data.patientInfo.dateOfService}
                  onChange={(e) => updateData('patientInfo', 'dateOfService', e.target.value)}
                  disabled={!data.selectionInfo.insurance || !data.selectionInfo.vendor}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <textarea
                  value={data.patientInfo.address}
                  onChange={(e) => updateData('patientInfo', 'address', e.target.value)}
                  disabled={!data.selectionInfo.insurance || !data.selectionInfo.vendor}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Physician & Clinical Information</h3>
            
            {/* Physician Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Physician Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Physician</label>
                  <input
                    type="text"
                    value={data.physicianInfo.primaryPhysician}
                    onChange={(e) => updateData('physicianInfo', 'primaryPhysician', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Physician NPI</label>
                  <input
                    type="text"
                    value={data.physicianInfo.physicianNPI}
                    onChange={(e) => updateData('physicianInfo', 'physicianNPI', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prescribing Provider</label>
                  <input
                    type="text"
                    value={data.physicianInfo.prescribingProvider}
                    onChange={(e) => updateData('physicianInfo', 'prescribingProvider', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Clinical Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Clinical Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis (ICD-10 Code)</label>
                  <input
                    type="text"
                    value={data.clinicalInfo.diagnosisICD10}
                    onChange={(e) => updateData('clinicalInfo', 'diagnosisICD10', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., E11.9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Prescription</label>
                  <input
                    type="date"
                    value={data.clinicalInfo.dateOfPrescription}
                    onChange={(e) => updateData('clinicalInfo', 'dateOfPrescription', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">DME Item(s) Prescribed *</label>
                  <select
                    value={data.clinicalInfo.dmeItems}
                    onChange={(e) => updateData('clinicalInfo', 'dmeItems', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select DME Item</option>
                    {dmeItemOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No. of Items / Braces *</label>
                  <input
                    type="number"
                    min="1"
                    value={data.clinicalInfo.numberOfItems}
                    onChange={(e) => updateData('clinicalInfo', 'numberOfItems', parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">HCPCS/CPT Code(s) *</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={hcpcsInput}
                        onChange={(e) => setHcpcsInput(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHCPCSCode())}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter HCPCS code (e.g., L0457)"
                      />
                      <button
                        type="button"
                        onClick={addHCPCSCode}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {commonHCPCSCodes.map(code => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            if (!data.clinicalInfo.hcpcsCodes.includes(code)) {
                              updateData('clinicalInfo', 'hcpcsCodes', [...data.clinicalInfo.hcpcsCodes, code]);
                            }
                          }}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.clinicalInfo.hcpcsCodes.map(code => (
                        <span
                          key={code}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {code}
                          <button
                            type="button"
                            onClick={() => removeHCPCSCode(code)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.clinicalInfo.medicalNecessityYN}
                        onChange={(e) => updateData('clinicalInfo', 'medicalNecessityYN', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Medical Necessity Documentation</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.clinicalInfo.priorAuthYN}
                        onChange={(e) => updateData('clinicalInfo', 'priorAuthYN', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Prior Authorization Required</span>
                    </label>
                  </div>
                </div>
                {data.clinicalInfo.priorAuthYN && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Authorization Number</label>
                    <input
                      type="text"
                      value={data.clinicalInfo.authNumber}
                      onChange={(e) => updateData('clinicalInfo', 'authNumber', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Delivery & Tracking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Shipment *</label>
                <input
                  type="date"
                  value={data.deliveryTracking.dateOfShipment}
                  onChange={(e) => updateData('deliveryTracking', 'dateOfShipment', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date (Estimated) *</label>
                <input
                  type="date"
                  value={data.deliveryTracking.estimatedDeliveryDate}
                  onChange={(e) => updateData('deliveryTracking', 'estimatedDeliveryDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose Carrier Service *</label>
                <select
                  value={data.deliveryTracking.carrierService}
                  onChange={(e) => updateData('deliveryTracking', 'carrierService', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Carrier</option>
                  {carrierOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number *</label>
                <input
                  type="text"
                  value={data.deliveryTracking.trackingNumber}
                  onChange={(e) => updateData('deliveryTracking', 'trackingNumber', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Delivery (POD)</label>
                <input
                  type="text"
                  value={data.deliveryTracking.proofOfDelivery}
                  onChange={(e) => updateData('deliveryTracking', 'proofOfDelivery', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add link or file path for proof of delivery"
                />
                <p className="text-xs text-gray-500 mt-1">You can add a link or file path for proof of delivery documentation</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={data.deliveryTracking.additionalNotes}
                  onChange={(e) => updateData('deliveryTracking', 'additionalNotes', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter any additional notes about delivery or tracking..."
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  isActive ? 'bg-blue-100 text-blue-700' : 
                  isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium hidden md:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-3">
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={
                  (currentStep === 0 && !validateStep1()) ||
                  (currentStep === 1 && !validateStep2())
                }
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isLoading || !validateStep1() || !validateStep2() || !validateStep3()}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Complete Intake'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};