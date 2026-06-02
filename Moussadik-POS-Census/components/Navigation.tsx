
import React from 'react';
import { UserRole } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, userRole }) => {
  const tabs = [
    { id: 'map', icon: 'fa-map-location-dot', label: 'Carte' },
    { id: 'list', icon: 'fa-list-ul', label: 'Liste' },
    ...(userRole === UserRole.CONSUMER ? [{ id: 'rewards', icon: 'fa-gift', label: 'Cadeaux' }] : []),
    ...(userRole === UserRole.OWNER ? [{ id: 'my-shop', icon: 'fa-store', label: 'Mon Commerce' }] : []),
    { id: 'profile', icon: 'fa-user', label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-lg mb-1`}></i>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
