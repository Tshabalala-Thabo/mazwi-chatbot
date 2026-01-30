'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, Filter, Search, Eye, X, Plus } from 'lucide-react';

interface Risk {
  id: number;
  title: string;
  description: string;
  risk_number: string;
  category_name: string;
  sub_category_name: string;
  type_name: string;
  age_name: string;
  origin_name: string;
  approach_name: string;
  impact_level: string;
  impact_value: number;
  impact_color: string;
  likelihood_level: string;
  likelihood_value: number;
  likelihood_color: string;
  inherent_rating: string;
  inherent_color: string;
  inherit_risk_score: number;
  residual_score: number;
  department_name: string;
  owner_name: string;
  owner_email: string;
  priority_name: string;
  priority_color: string;
  causes: string;
  consequences: string;
  identification_date: string;
}

interface RiskStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface Category {
  id: number;
  name: string;
  risk_count: number;
}

interface RiskByAge {
  age_name: string;
  count: number;
}

interface FormOption {
  id: number;
  name: string;
  value?: number;
  color?: string;
  category_id?: number;
  email?: string;
}

interface RiskFormData {
  title: string;
  description: string;
  risk_type_id: string;
  department_id: string;
  owner_id: string;
  category_id: string;
  sub_category_id: string;
  origin_id: string;
  risk_age_id: string;
  impact_rating_id: string;
  likelihood_rating_id: string;
  priority_id: string;
  approach_id: string;
  monitoring_frequency_id: string;
  causes: string[];
  consequences: string[];
  identification_date: string;
}

export default function RiskManagementPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [risksByAge, setRisksByAge] = useState<RiskByAge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formOptions, setFormOptions] = useState<any>(null);
  const [formData, setFormData] = useState<RiskFormData>({
    title: '',
    description: '',
    risk_type_id: '',
    department_id: '',
    owner_id: '',
    category_id: '',
    sub_category_id: '',
    origin_id: '',
    risk_age_id: '',
    impact_rating_id: '',
    likelihood_rating_id: '',
    priority_id: '',
    approach_id: '',
    monitoring_frequency_id: '',
    causes: [''],
    consequences: [''],
    identification_date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    try {
      const res = await fetch('/api/risks');
      const data = await res.json();
      
      if (data.risks) {
        setRisks(data.risks);
        setStats(data.stats);
        setCategories(data.categories);
        setRisksByAge(data.risksByAge);
      }
    } catch (error) {
      console.error('Failed to fetch risks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risk.risk_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risk.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || risk.category_name === selectedCategory;
    
    let matchesSeverity = true;
    if (selectedSeverity !== 'all') {
      if (selectedSeverity === 'critical') matchesSeverity = risk.inherit_risk_score >= 20;
      else if (selectedSeverity === 'high') matchesSeverity = risk.inherit_risk_score >= 13 && risk.inherit_risk_score < 20;
      else if (selectedSeverity === 'medium') matchesSeverity = risk.inherit_risk_score >= 7 && risk.inherit_risk_score < 13;
      else if (selectedSeverity === 'low') matchesSeverity = risk.inherit_risk_score < 7;
    }
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const parseCauses = (causes: string): string[] => {
    try {
      return JSON.parse(causes);
    } catch {
      return [];
    }
  };

  const parseConsequences = (consequences: string): string[] => {
    try {
      return JSON.parse(consequences);
    } catch {
      return [];
    }
  };

  const handleViewRisk = (risk: Risk) => {
    setSelectedRisk(risk);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRisk(null);
  };

  const fetchFormOptions = async () => {
    try {
      const res = await fetch('/api/risks/options');
      const data = await res.json();
      setFormOptions(data);
    } catch (error) {
      console.error('Failed to fetch form options:', error);
    }
  };

  const handleCreateClick = () => {
    if (!formOptions) {
      fetchFormOptions();
    }
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      title: '',
      description: '',
      risk_type_id: '',
      department_id: '',
      owner_id: '',
      category_id: '',
      sub_category_id: '',
      origin_id: '',
      risk_age_id: '',
      impact_rating_id: '',
      likelihood_rating_id: '',
      priority_id: '',
      approach_id: '',
      monitoring_frequency_id: '',
      causes: [''],
      consequences: [''],
      identification_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleInputChange = (field: keyof RiskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'causes' | 'consequences', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: 'causes' | 'consequences') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'causes' | 'consequences', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const filteredCauses = formData.causes.filter(c => c.trim() !== '');
      const filteredConsequences = formData.consequences.filter(c => c.trim() !== '');

      const payload = {
        ...formData,
        risk_type_id: parseInt(formData.risk_type_id),
        department_id: parseInt(formData.department_id),
        owner_id: parseInt(formData.owner_id),
        category_id: parseInt(formData.category_id),
        sub_category_id: formData.sub_category_id ? parseInt(formData.sub_category_id) : null,
        origin_id: formData.origin_id ? parseInt(formData.origin_id) : null,
        risk_age_id: formData.risk_age_id ? parseInt(formData.risk_age_id) : null,
        impact_rating_id: parseInt(formData.impact_rating_id),
        likelihood_rating_id: parseInt(formData.likelihood_rating_id),
        priority_id: formData.priority_id ? parseInt(formData.priority_id) : null,
        approach_id: formData.approach_id ? parseInt(formData.approach_id) : null,
        monitoring_frequency_id: formData.monitoring_frequency_id ? parseInt(formData.monitoring_frequency_id) : null,
        causes: filteredCauses,
        consequences: filteredConsequences
      };

      const res = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        closeCreateModal();
        fetchRisks();
        
        // Calculate inherent score for the event
        const impactValue = formData.impact_rating_id ? parseInt(formData.impact_rating_id) : 1;
        const likelihoodValue = formData.likelihood_rating_id ? parseInt(formData.likelihood_rating_id) : 1;
        const inherentScore = impactValue * likelihoodValue;
        
        // Dispatch custom event for chatbot to show speech bubble
        const riskCreatedEvent = new CustomEvent('riskCreated', {
          detail: {
            risk_number: result.risk_number,
            title: formData.title,
            description: formData.description,
            category_name: categories.find(c => c.id === parseInt(formData.category_id))?.name,
            inherent_score: inherentScore,
            impact_value: impactValue,
            likelihood_value: likelihoodValue
          }
        });
        window.dispatchEvent(riskCreatedEvent);
        
        alert('Risk created successfully!');
      } else {
        const error = await res.json();
        alert(`Failed to create risk: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating risk:', error);
      alert('Failed to create risk');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#036DAD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading risks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="text-[#036DAD]" size={32} />
            Risk Management
          </h1>
          <p className="text-gray-600 mt-1">Monitor and manage organizational risks</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#036DAD] text-white rounded-lg hover:bg-[#025a8d] transition-colors font-medium"
        >
          <Plus size={20} />
          Create Risk
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Risks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Shield className="text-gray-400" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.critical}</p>
              </div>
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High</p>
                <p className="text-3xl font-bold text-orange-500 mt-1">{stats.high}</p>
              </div>
              <AlertTriangle className="text-orange-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medium</p>
                <p className="text-3xl font-bold text-yellow-500 mt-1">{stats.medium}</p>
              </div>
              <AlertTriangle className="text-yellow-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{stats.low}</p>
              </div>
              <Shield className="text-green-500" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Risk Categories Overview */}
      {categories.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.slice(0, 10).map(category => (
              <div key={category.id} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#036DAD]">{category.risk_count}</p>
                <p className="text-sm text-gray-600 mt-1">{category.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Age Distribution */}
      {risksByAge.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Status Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {risksByAge.map((item, idx) => (
              <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#036DAD]">{item.count}</p>
                <p className="text-sm text-gray-600 mt-1">{item.age_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search risks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Risk Register Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Risk Register ({filteredRisks.length} {filteredRisks.length === 1 ? 'risk' : 'risks'})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Likelihood
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inherent Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Residual Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRisks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                    No risks found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredRisks.map(risk => (
                  <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">{risk.risk_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{risk.title}</p>
                        <p className="text-xs text-gray-500 truncate mt-1">{risk.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{risk.category_name}</div>
                      {risk.sub_category_name && (
                        <div className="text-xs text-gray-500">{risk.sub_category_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {risk.department_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{risk.owner_name}</div>
                      <div className="text-xs text-gray-500">{risk.owner_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: risk.impact_color }}
                      >
                        {risk.impact_value}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: risk.likelihood_color }}
                      >
                        {risk.likelihood_value}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <span 
                          className="text-lg font-bold"
                          style={{ color: risk.inherent_color }}
                        >
                          {risk.inherit_risk_score}
                        </span>
                        <span 
                          className="text-xs px-2 py-0.5 rounded text-white mt-1"
                          style={{ backgroundColor: risk.inherent_color }}
                        >
                          {risk.inherent_rating}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-lg font-semibold text-gray-700">
                        {risk.residual_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {risk.age_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewRisk(risk)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#036DAD] text-white text-sm font-medium rounded-lg hover:bg-[#025a8d] transition-colors"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Details Modal */}
      {showModal && selectedRisk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Shield className="text-[#036DAD]" size={28} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Risk Details</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedRisk.risk_number}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Title and Badges */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{selectedRisk.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: selectedRisk.inherent_color }}
                  >
                    {selectedRisk.inherent_rating}
                  </span>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: selectedRisk.priority_color }}
                  >
                    {selectedRisk.priority_name} Priority
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {selectedRisk.age_name}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Description</h4>
                <p className="text-gray-900 leading-relaxed">{selectedRisk.description}</p>
              </div>

              {/* Risk Scores */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Inherent Risk Score</p>
                  <p className="text-4xl font-bold" style={{ color: selectedRisk.inherent_color }}>
                    {selectedRisk.inherit_risk_score}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Impact ({selectedRisk.impact_value}) × Likelihood ({selectedRisk.likelihood_value})
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Residual Risk Score</p>
                  <p className="text-4xl font-bold text-gray-700">
                    {selectedRisk.residual_score}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    After controls applied
                  </p>
                </div>
              </div>

              {/* Risk Ratings */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Impact Rating</h4>
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: selectedRisk.impact_color }}
                    >
                      {selectedRisk.impact_level}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">{selectedRisk.impact_value}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Likelihood Rating</h4>
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: selectedRisk.likelihood_color }}
                    >
                      {selectedRisk.likelihood_level}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">{selectedRisk.likelihood_value}</span>
                  </div>
                </div>
              </div>

              {/* Causes */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Root Causes</h4>
                <ul className="space-y-2">
                  {parseCauses(selectedRisk.causes).map((cause, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#036DAD] mt-1">•</span>
                      <span className="text-gray-900">{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Consequences */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Potential Consequences</h4>
                <ul className="space-y-2">
                  {parseConsequences(selectedRisk.consequences).map((consequence, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-gray-900">{consequence}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Category</h4>
                  <p className="text-gray-900">{selectedRisk.category_name}</p>
                  {selectedRisk.sub_category_name && (
                    <p className="text-sm text-gray-600">{selectedRisk.sub_category_name}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Type</h4>
                  <p className="text-gray-900">{selectedRisk.type_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Origin</h4>
                  <p className="text-gray-900">{selectedRisk.origin_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Department</h4>
                  <p className="text-gray-900">{selectedRisk.department_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Risk Owner</h4>
                  <p className="text-gray-900">{selectedRisk.owner_name}</p>
                  <p className="text-sm text-gray-600">{selectedRisk.owner_email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Approach</h4>
                  <p className="text-gray-900">{selectedRisk.approach_name}</p>
                </div>
              </div>

              {/* Identification Date */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Identification Date</h4>
                <p className="text-gray-900">{new Date(selectedRisk.identification_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Risk Modal */}
      {showCreateModal && formOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Shield className="text-[#036DAD]" size={28} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Risk</h2>
                  <p className="text-sm text-gray-500">Add a new risk to the register</p>
                </div>
              </div>
              <button
                onClick={closeCreateModal}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Risk Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                        placeholder="Enter risk title"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                        placeholder="Describe the risk in detail"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Risk Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.risk_type_id}
                        onChange={(e) => handleInputChange('risk_type_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select type</option>
                        {formOptions.types.map((type: FormOption) => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) => handleInputChange('category_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select category</option>
                        {formOptions.categories.map((cat: FormOption) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sub-Category
                      </label>
                      <select
                        value={formData.sub_category_id}
                        onChange={(e) => handleInputChange('sub_category_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select sub-category</option>
                        {formOptions.subCategories
                          .filter((sub: FormOption) => !formData.category_id || sub.category_id === parseInt(formData.category_id))
                          .map((sub: FormOption) => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Identification Date
                      </label>
                      <input
                        type="date"
                        value={formData.identification_date}
                        onChange={(e) => handleInputChange('identification_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Impact Rating <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.impact_rating_id}
                        onChange={(e) => handleInputChange('impact_rating_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select impact</option>
                        {formOptions.impactLevels.map((level: FormOption) => (
                          <option key={level.id} value={level.id}>
                            {level.name} ({level.value})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Likelihood Rating <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.likelihood_rating_id}
                        onChange={(e) => handleInputChange('likelihood_rating_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select likelihood</option>
                        {formOptions.likelihoodLevels.map((level: FormOption) => (
                          <option key={level.id} value={level.id}>
                            {level.name} ({level.value})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority_id}
                        onChange={(e) => handleInputChange('priority_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select priority</option>
                        {formOptions.priorities.map((priority: FormOption) => (
                          <option key={priority.id} value={priority.id}>{priority.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Risk Age
                      </label>
                      <select
                        value={formData.risk_age_id}
                        onChange={(e) => handleInputChange('risk_age_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select age</option>
                        {formOptions.ages.map((age: FormOption) => (
                          <option key={age.id} value={age.id}>{age.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Ownership & Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ownership & Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.department_id}
                        onChange={(e) => handleInputChange('department_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select department</option>
                        {formOptions.departments.map((dept: FormOption) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Risk Owner <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.owner_id}
                        onChange={(e) => handleInputChange('owner_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select owner</option>
                        {formOptions.users.map((user: FormOption) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Origin
                      </label>
                      <select
                        value={formData.origin_id}
                        onChange={(e) => handleInputChange('origin_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select origin</option>
                        {formOptions.origins.map((origin: FormOption) => (
                          <option key={origin.id} value={origin.id}>{origin.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Risk Approach
                      </label>
                      <select
                        value={formData.approach_id}
                        onChange={(e) => handleInputChange('approach_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select approach</option>
                        {formOptions.approaches.map((approach: FormOption) => (
                          <option key={approach.id} value={approach.id}>{approach.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monitoring Frequency
                      </label>
                      <select
                        value={formData.monitoring_frequency_id}
                        onChange={(e) => handleInputChange('monitoring_frequency_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                      >
                        <option value="">Select frequency</option>
                        {formOptions.monitoringFrequencies.map((freq: FormOption) => (
                          <option key={freq.id} value={freq.id}>{freq.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Causes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Root Causes</h3>
                  <div className="space-y-2">
                    {formData.causes.map((cause, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={cause}
                          onChange={(e) => handleArrayChange('causes', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                          placeholder="Enter a root cause"
                        />
                        {formData.causes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('causes', index)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('causes')}
                      className="text-sm text-[#036DAD] hover:underline"
                    >
                      + Add another cause
                    </button>
                  </div>
                </div>

                {/* Consequences */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Potential Consequences</h3>
                  <div className="space-y-2">
                    {formData.consequences.map((consequence, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={consequence}
                          onChange={(e) => handleArrayChange('consequences', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent"
                          placeholder="Enter a potential consequence"
                        />
                        {formData.consequences.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('consequences', index)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('consequences')}
                      className="text-sm text-[#036DAD] hover:underline"
                    >
                      + Add another consequence
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-[#036DAD] text-white rounded-lg hover:bg-[#025a8d] transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Create Risk
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
