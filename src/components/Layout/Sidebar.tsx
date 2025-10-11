import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  FileText, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Plus,
  List,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['intake', 'billing']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      if (prev.includes(menuId)) {
        // If clicking on already expanded menu, collapse it
        return prev.filter(id => id !== menuId);
      } else {
        // If clicking on collapsed menu, expand it and collapse others
        return [menuId];
      }
    });
  };

  const menuItems = [
    {
      id: 'intake',
      label: 'Patient Intake & Prescription',
      icon: Users,
      description: 'Manage patient information and prescriptions',
      subItems: [
        {
          id: 'intake-new',
          label: 'New Enrollment',
          icon: Plus,
          description: 'Create new patient intake'
        },
        {
          id: 'intake-complete',
          label: 'Complete',
          icon: CheckCircle,
          description: 'View completed intakes'
        },
        {
          id: 'intake-all',
          label: 'All',
          icon: List,
          description: 'View all patient intakes'
        }
      ]
    },
    {
      id: 'billing',
      label: 'Billing & Payments',
      icon: CreditCard,
      description: 'Handle billing and payment processing',
      subItems: [
        {
          id: 'billing-new',
          label: 'New Billing',
          icon: Plus,
          description: 'Create new billing record'
        },
        {
          id: 'billing-all',
          label: 'All',
          icon: List,
          description: 'View all billing records'
        }
      ]
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: FileText,
      description: 'View audit logs and compliance data'
    }
  ];

  const isSubItemActive = (parentId: string, subItemId: string) => {
    return currentPage === subItemId;
  };

  const isParentActive = (parentId: string, subItems?: any[]) => {
    if (!subItems) return currentPage === parentId;
    return subItems.some(subItem => currentPage === subItem.id);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">FMmedCare</h1>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="font-medium text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-600">{user?.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus.includes(item.id);
            const isActive = isParentActive(item.id, item.subItems);
            
            return (
              <li key={item.id}>
                {/* Main Menu Item */}
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleMenu(item.id);
                    } else {
                      onPageChange(item.id);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                    isActive && !hasSubItems
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      isActive && !hasSubItems ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <h3 className={`font-semibold text-sm mb-1 ${
                        isActive && !hasSubItems ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.label}
                      </h3>
                      <p className={`text-xs ${
                        isActive && !hasSubItems ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                    {hasSubItems && (
                      <div className={`transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}>
                        <ChevronRight className={`w-4 h-4 ${
                          isActive && !hasSubItems ? 'text-white' : 'text-gray-400'
                        }`} />
                      </div>
                    )}
                  </div>
                </button>

                {/* Sub Menu Items */}
                {hasSubItems && isExpanded && (
                  <ul className="mt-2 ml-4 space-y-1">
                    {item.subItems!.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = isSubItemActive(item.id, subItem.id);
                      
                      return (
                        <li key={subItem.id}>
                          <button
                            onClick={() => onPageChange(subItem.id)}
                            className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                              isSubActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'hover:bg-blue-50 text-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <SubIcon className={`w-4 h-4 flex-shrink-0 ${
                                isSubActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                              }`} />
                              <div className="flex-1">
                                <h4 className={`font-medium text-sm ${
                                  isSubActive ? 'text-white' : 'text-gray-800'
                                }`}>
                                  {subItem.label}
                                </h4>
                                <p className={`text-xs ${
                                  isSubActive ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {subItem.description}
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