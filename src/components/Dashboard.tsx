import React, { useState } from 'react';
import { Sidebar } from './Layout/Sidebar';
import { PatientIntakeForm } from './PatientIntake/PatientIntakeForm';
import { PatientIntakeList } from './PatientIntake/PatientIntakeList';
import { BillingPaymentsForm } from './BillingPayments/BillingPaymentsForm';
import { BillingPaymentsList } from './BillingPayments/BillingPaymentsList';
import { AuditTrailForm } from './AuditTrail/AuditTrailForm';

export const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('intake-new');

  const renderCurrentPage = () => {
    switch (currentPage) {
      // Patient Intake Pages
      case 'intake-new':
        return <PatientIntakeForm />;
      case 'intake-complete':
        return <PatientIntakeList status="complete" title="Complete Patient Intakes" />;
      case 'intake-all':
        return <PatientIntakeList status="all" title="All Patient Intakes" />;
      
      // Billing Pages
      case 'billing-new':
        return <BillingPaymentsForm />;
      case 'billing-all':
        return <BillingPaymentsList title="All Billing & Payment Records" />;
      
      // Audit Trail
      case 'audit':
        return <AuditTrailForm />;
      
      // Default fallback
      default:
        return <PatientIntakeForm />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50" style={{backgroundColor: 'rgb(30, 152, 156)'}}>
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderCurrentPage()}
        </div>
      </div>
    </div>
  );
};