'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  BarChart3,
  UserCheck,
  Users,
  Dumbbell,
  Calendar,
  Activity,
  CreditCard,
  Package,
  UserCog,
  TrendingUp,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Shield,
  Settings,
  Heart,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  adminUser: string;
  adminRole: 'receptionist' | 'manager';
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminSidebar({
  adminUser,
  adminRole,
  onLogout,
  activeTab,
  onTabChange,
}: AdminSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isManager = adminRole === 'manager';

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, show: true },
    { id: 'checkin', label: 'Check-In', icon: UserCheck, show: true },
    { id: 'members', label: 'Members', icon: Users, show: true },
    { id: 'classes', label: 'Classes', icon: Dumbbell, show: true },
    { id: 'events', label: 'Events', icon: Calendar, show: true },
    { id: 'attendance', label: 'Attendance', icon: Activity, show: true },
    { id: 'parq', label: 'PAR-Q & Safety', icon: Heart, show: true },
    { id: 'payments', label: 'Payments', icon: CreditCard, show: isManager },
    { id: 'plans', label: 'Plans', icon: Package, show: isManager },
    { id: 'staff', label: 'Staff', icon: UserCog, show: isManager },
    { id: 'reports', label: 'Reports', icon: FileText, show: isManager },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, show: isManager },
    { id: 'audit', label: 'Audit Logs', icon: Shield, show: isManager },
    { id: 'settings', label: 'Settings', icon: Settings, show: isManager },
  ].filter(item => item.show);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/gemfitness.svg"
              alt="GemFitness"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">GemFitness</h1>
              <p className="text-xs text-gray-500 capitalize">{adminRole}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 top-[57px]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/gemfitness.svg"
                  alt="GemFitness"
                  width={40}
                  height={40}
                  className="w-10 h-10 flex-shrink-0"
                />
                {!isCollapsed && (
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold text-gray-900 truncate">GemFitness</h1>
                    <p className="text-xs text-gray-500">Admin Portal</p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex"
              >
                <ChevronLeft className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* User Info */}
          {!isCollapsed && (
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-b border-orange-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {adminUser.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{adminUser}</p>
                  <p className="text-sm text-orange-700 capitalize">{adminRole}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    {!isCollapsed && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={() => {
                console.log('🔘 Logout button clicked in AdminSidebar');
                onLogout();
              }}
              variant="outline"
              className={`w-full border-2 border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 ${
                isCollapsed ? 'px-2' : ''
              }`}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
