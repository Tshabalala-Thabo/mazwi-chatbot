'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  Package,
  AlertTriangle,
  FileSearch,
  FileCheck,
  Scale,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface DashboardStats {
  totalRisks: number;
  totalAssets: number;
  totalIncidents: number;
  activeAudits: number;
  compliancePackages: number;
  activePolicies: number;
}

interface Risk {
  id: number;
  title: string;
  risk_number: string;
  inherit_risk_score: number;
  residual_score: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRisks, setRecentRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.recentRisks) {
        setRecentRisks(data.recentRisks);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 20) return 'text-red-600 bg-red-50';
    if (score >= 13) return 'text-orange-600 bg-orange-50';
    if (score >= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 20) return 'Critical';
    if (score >= 13) return 'High';
    if (score >= 7) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#036DAD] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your ProSuite GRC platform overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Shield}
          title="Total Risks"
          value={stats?.totalRisks || 0}
          color="bg-red-500"
          iconColor="text-red-500"
        />
        <StatCard
          icon={Package}
          title="Total Assets"
          value={stats?.totalAssets || 0}
          color="bg-blue-500"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={AlertTriangle}
          title="Total Incidents"
          value={stats?.totalIncidents || 0}
          color="bg-orange-500"
          iconColor="text-orange-500"
        />
        <StatCard
          icon={FileSearch}
          title="Active Audits"
          value={stats?.activeAudits || 0}
          color="bg-purple-500"
          iconColor="text-purple-500"
        />
        <StatCard
          icon={FileCheck}
          title="Compliance Packages"
          value={stats?.compliancePackages || 0}
          color="bg-green-500"
          iconColor="text-green-500"
        />
        <StatCard
          icon={Scale}
          title="Active Policies"
          value={stats?.activePolicies || 0}
          color="bg-indigo-500"
          iconColor="text-indigo-500"
        />
      </div>

      {/* Recent Risks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Risks</h2>
          <button className="text-sm font-medium text-[#036DAD] hover:text-[#025a8f] transition-colors">
            View All →
          </button>
        </div>

        {recentRisks.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600">No risks found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentRisks.map((risk) => (
              <div
                key={risk.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#036DAD] transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-gray-500">{risk.risk_number}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(risk.inherit_risk_score)}`}>
                      {getRiskLabel(risk.inherit_risk_score)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900">{risk.title}</h3>
                </div>
                <div className="flex items-center gap-6 ml-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Inherent</p>
                    <p className={`text-lg font-bold ${getRiskColor(risk.inherit_risk_score).split(' ')[0]}`}>
                      {risk.inherit_risk_score}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Residual</p>
                    <p className={`text-lg font-bold ${getRiskColor(risk.residual_score).split(' ')[0]}`}>
                      {risk.residual_score}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  title: string;
  value: number;
  color: string;
  iconColor: string;
}

function StatCard({ icon: Icon, title, value, color, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-10 flex items-center justify-center`}>
          <Icon className={iconColor} size={24} />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
