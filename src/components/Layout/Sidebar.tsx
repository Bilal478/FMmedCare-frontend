import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  FileText, 
  LogOut,
  ChevronRight,
  Plus,
  List,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['intake', 'billing']);

  const ACTIVE_BG = 'rgb(30, 152, 156)';
  const ACTIVE_TEXT = 'white';

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [menuId]
    );
  };

  const menuItems = [
    {
      id: 'intake',
      label: 'Patient Intake & Prescription',
      icon: Users,
      description: 'Manage patient information and prescriptions',
      subItems: [
        { id: 'intake-new', label: 'New Enrollment', icon: Plus, description: 'Create new patient intake' },
        { id: 'intake-complete', label: 'Complete', icon: CheckCircle, description: 'View completed intakes' },
        { id: 'intake-all', label: 'All', icon: List, description: 'View all patient intakes' }
      ]
    },
    {
      id: 'billing',
      label: 'Billing & Payments',
      icon: CreditCard,
      description: 'Handle billing and payment processing',
      subItems: [
        { id: 'billing-new', label: 'New Billing', icon: Plus, description: 'Create new billing record' },
        { id: 'billing-all', label: 'All', icon: List, description: 'View all billing records' }
      ]
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: FileText,
      description: 'View audit logs and compliance data'
    }
  ];

  const isSubItemActive = (subItemId: string) => currentPage === subItemId;

  const isParentActive = (parentId: string, subItems?: any[]) => {
    if (!subItems) return currentPage === parentId;
    return subItems.some(sub => currentPage === sub.id);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen flex flex-col">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-center items-center mb-4">
          <img 
            src={logo} 
            alt="FM-MedCare Logo"
            className="w-32 h-16 object-contain"
          />
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="font-medium text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-600">{user?.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const hasSubs = item.subItems?.length > 0;
            const isExpanded = expandedMenus.includes(item.id);
            const isActive = isParentActive(item.id, item.subItems);

            return (
              <li key={item.id}>
                
                {/* Main Menu Button */}
                <button
                  onClick={() => hasSubs ? toggleMenu(item.id) : onPageChange(item.id)}
                  className="w-full text-left p-4 rounded-xl transition-all duration-200 group"
                  style={
                    isActive
                      ? { backgroundColor: ACTIVE_BG, color: ACTIVE_TEXT }
                      : {}
                  }
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className="w-5 h-5 mt-0.5"
                      style={{ color: isActive ? ACTIVE_TEXT : '#6b7280' }}
                    />

                    <div className="flex-1">
                      <h3
                        className="font-semibold text-sm mb-1"
                        style={{ color: isActive ? ACTIVE_TEXT : '#111827' }}
                      >
                        {item.label}
                      </h3>

                      <p
                        className="text-xs"
                        style={{ color: isActive ? '#d1f7f7' : '#6b7280' }}
                      >
                        {item.description}
                      </p>
                    </div>

                    {hasSubs && (
                      <div
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        <ChevronRight
                          className="w-4 h-4"
                          style={{ color: isActive ? ACTIVE_TEXT : '#9ca3af' }}
                        />
                      </div>
                    )}
                  </div>
                </button>

                {/* Sub Menu Items */}
                {hasSubs && isExpanded && (
                  <ul className="mt-2 ml-4 space-y-1">
                    {item.subItems!.map(sub => {
                      const SubIcon = sub.icon;
                      const isSubActive = isSubItemActive(sub.id);

                      return (
                        <li key={sub.id}>
                          <button
                            onClick={() => onPageChange(sub.id)}
                            className="w-full text-left p-3 rounded-lg transition-all duration-200 group"
                            style={
                              isSubActive
                                ? { backgroundColor: ACTIVE_BG, color: ACTIVE_TEXT }
                                : {}
                            }
                          >
                            <div className="flex items-center gap-3">
                              <SubIcon
                                className="w-4 h-4"
                                style={{ color: isSubActive ? ACTIVE_TEXT : '#9ca3af' }}
                              />

                              <div className="flex-1">
                                <h4
                                  className="font-medium text-sm"
                                  style={{ color: isSubActive ? ACTIVE_TEXT : '#1f2937' }}
                                >
                                  {sub.label}
                                </h4>

                                <p
                                  className="text-xs"
                                  style={{ color: isSubActive ? '#d1f7f7' : '#6b7280' }}
                                >
                                  {sub.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>

    </div>
  );
};
