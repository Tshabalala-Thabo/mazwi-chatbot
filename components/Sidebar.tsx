'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  Package,
  FileCheck,
  Scale,
  AlertTriangle,
  FileSearch,
  TrendingUp,
  Menu,
  X,
  LogOut,
  Building2
} from 'lucide-react';

interface Module {
  id: number;
  slug: string;
  name: string;
  alias_name: string;
  is_disable: number;
}

const moduleIcons: Record<string, any> = {
  risk: Shield,
  asset: Package,
  compliance: FileCheck,
  governance: Scale,
  incident: AlertTriangle,
  audit: FileSearch,
  performance: TrendingUp
};

export default function Sidebar() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetchModules();
    fetchTenant();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await fetch('/api/modules');
      const data = await res.json();
      if (data.modules) {
        setModules(data.modules);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

  const fetchTenant = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data.tenant) {
        setTenant(data.tenant);
      }
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear Mazwi last login timestamp so speech bubble shows on next login
      localStorage.removeItem('mazwi_last_login');
      
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#036DAD] text-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#036DAD] flex items-center justify-center">
                <Building2 className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ProSuite</h1>
                <p className="text-xs text-gray-500">GRC Platform</p>
              </div>
            </div>
          </div>

          {/* Tenant Info */}
          {tenant && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Organization</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{tenant.tenant_name}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-colors
                  ${pathname === '/dashboard'
                    ? 'bg-[#036DAD] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                <TrendingUp size={20} />
                Dashboard
              </Link>

              {modules.length > 0 && (
                <>
                  <div className="px-4 py-2 mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Modules
                    </p>
                  </div>
                  {modules.map((module) => {
                    const Icon = moduleIcons[module.slug] || Shield;
                    const modulePath = `/dashboard/${module.slug}`;
                    const isActive = pathname === modulePath;

                    return (
                      <Link
                        key={module.id}
                        href={modulePath}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                          transition-colors
                          ${isActive
                            ? 'bg-[#036DAD] text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon size={20} />
                        {module.alias_name}
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
