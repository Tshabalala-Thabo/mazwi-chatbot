'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, X, Eye, Search, Filter, Sparkles, HelpCircle } from 'lucide-react';

interface Asset {
  id: number;
  description: string;
  assetTag: string;
  serialNumber: string | null;
  brand: string | null;
  cost: number | null;
  purchaseDate: string | null;
  condition: string | null;
  category_name: string | null;
  department_name: string | null;
  site_name: string | null;
  location_name: string | null;
  assetStatus_name: string | null;
  warrantyExpiration: string | null;
  entity_model: string | null;
  isDepreciable: boolean;
  depreciationMethod_name: string | null;
  [key: string]: any;
}

interface Stats {
  total: number;
  active: number;
  inRepair: number;
  retired: number;
  totalValue: number;
}

interface FormOption {
  id: number;
  name: string;
  color?: string;
  site_id?: number;
}

interface FormOptions {
  categories: FormOption[];
  statuses: FormOption[];
  depreciationMethods: FormOption[];
  departments: FormOption[];
  sites: FormOption[];
  locations: FormOption[];
  vehicleMakes: FormOption[];
}

export default function AssetPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptions | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [aiAssistMode, setAiAssistMode] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    assetTag: '',
    serialNumber: '',
    purchaseOrderNumber: '',
    invoiceNumber: '',
    serviceProvider: '',
    brand: '',
    cost: '',
    purchaseDate: '',
    condition: 'Excellent',
    depreciationRate: '',
    assetLife: '',
    residualValue: '',
    entity_model: '',
    warrantyPeriod: '',
    warrantyExpiration: '',
    category_id: '',
    department_id: '',
    site_id: '',
    location_id: '',
    assetStatus_id: '1',
    isDepreciable: true,
    depreciationMethod_id: '',
    licenseType: '',
    supplier: '',
    licenseKey: '',
    numberOfSeats: '',
    renewalDate: '',
    supportContact: '',
    vehicle_make_id: '',
    vin: '',
    licensePlate: '',
    servicePlanPeriod: '',
    dueForService: '',
    servicePlanExpiration: '',
    discExpiration: '',
    lastMaintenanceDate: ''
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      setAssets(data.assets || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const res = await fetch('/api/assets/options');
      const data = await res.json();
      setFormOptions(data);
    } catch (error) {
      console.error('Error fetching form options:', error);
    }
  };

  const handleCreateClick = () => {
    setShowCreateModal(true);
    if (!formOptions) {
      fetchFormOptions();
    }
    
    // Dispatch event to notify chatbot
    const formOpenEvent = new CustomEvent('formOpened', {
      detail: { formType: 'asset' }
    });
    window.dispatchEvent(formOpenEvent);
  };

  const handleAiFieldAssist = (fieldName: string, action: 'explain' | 'suggest' | 'review') => {
    const fieldLabels: Record<string, string> = {
      description: 'Asset Description',
      assetTag: 'Asset Tag',
      serialNumber: 'Serial Number',
      brand: 'Brand',
      entity_model: 'Model',
      category_id: 'Asset Category',
      department_id: 'Department',
      assetStatus_id: 'Status',
      cost: 'Cost',
      purchaseDate: 'Purchase Date',
      condition: 'Condition',
      depreciationRate: 'Depreciation Rate',
      warrantyPeriod: 'Warranty Period'
    };

    const fieldLabel = fieldLabels[fieldName] || fieldName;
    const currentValue = (formData as any)[fieldName];

    // Build context from filled fields
    const filledFields: string[] = [];
    if (formData.description) filledFields.push(`Description: "${formData.description}"`);
    if (formData.assetTag) filledFields.push(`Asset Tag: "${formData.assetTag}"`);
    if (formData.brand) filledFields.push(`Brand: "${formData.brand}"`);
    if (formData.category_id && formOptions) {
      const cat = formOptions.categories.find((c: any) => c.id === parseInt(formData.category_id));
      if (cat) filledFields.push(`Category: ${cat.name}`);
    }
    if (formData.department_id && formOptions) {
      const dept = formOptions.departments.find((d: any) => d.id === parseInt(formData.department_id));
      if (dept) filledFields.push(`Department: ${dept.name}`);
    }
    if (formData.cost) filledFields.push(`Cost: R${formData.cost}`);

    const contextInfo = filledFields.length > 0 
      ? `\n\nContext - Here's what I've filled so far:\n${filledFields.join('\n')}` 
      : '';

    let query = '';
    if (action === 'explain') {
      query = `Explain what the "${fieldLabel}" field means in an asset register and what kind of information should I provide?${contextInfo}`;
    } else if (action === 'suggest') {
      query = `I'm filling out the "${fieldLabel}" field for an asset. ${currentValue ? `My current input is: "${currentValue}". ` : ''}Can you suggest appropriate values or provide examples based on the context?${contextInfo}`;
    } else if (action === 'review') {
      query = `Review my input for the "${fieldLabel}" field: "${currentValue}". Is this appropriate given the context? Any suggestions for improvement?${contextInfo}`;
    }

    // Dispatch event to open chatbot with query
    const aiAssistEvent = new CustomEvent('aiFieldAssist', {
      detail: { query, fieldName, fieldLabel }
    });
    window.dispatchEvent(aiAssistEvent);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      description: '',
      assetTag: '',
      serialNumber: '',
      purchaseOrderNumber: '',
      invoiceNumber: '',
      serviceProvider: '',
      brand: '',
      cost: '',
      purchaseDate: '',
      condition: 'Excellent',
      depreciationRate: '',
      assetLife: '',
      residualValue: '',
      entity_model: '',
      warrantyPeriod: '',
      warrantyExpiration: '',
      category_id: '',
      department_id: '',
      site_id: '',
      location_id: '',
      assetStatus_id: '1',
      isDepreciable: true,
      depreciationMethod_id: '',
      licenseType: '',
      supplier: '',
      licenseKey: '',
      numberOfSeats: '',
      renewalDate: '',
      supportContact: '',
      vehicle_make_id: '',
      vin: '',
      licensePlate: '',
      servicePlanPeriod: '',
      dueForService: '',
      servicePlanExpiration: '',
      discExpiration: '',
      lastMaintenanceDate: ''
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        depreciationRate: formData.depreciationRate ? parseFloat(formData.depreciationRate) : null,
        assetLife: formData.assetLife ? parseInt(formData.assetLife) : null,
        residualValue: formData.residualValue ? parseFloat(formData.residualValue) : null,
        warrantyPeriod: formData.warrantyPeriod ? parseInt(formData.warrantyPeriod) : null,
        numberOfSeats: formData.numberOfSeats ? parseInt(formData.numberOfSeats) : null,
        servicePlanPeriod: formData.servicePlanPeriod ? parseInt(formData.servicePlanPeriod) : null,
        category_id: parseInt(formData.category_id),
        department_id: parseInt(formData.department_id),
        site_id: formData.site_id ? parseInt(formData.site_id) : null,
        location_id: formData.location_id ? parseInt(formData.location_id) : null,
        assetStatus_id: parseInt(formData.assetStatus_id),
        depreciationMethod_id: formData.depreciationMethod_id ? parseInt(formData.depreciationMethod_id) : null,
        vehicle_make_id: formData.vehicle_make_id ? parseInt(formData.vehicle_make_id) : null
      };

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        closeCreateModal();
        fetchAssets();
        
        const riskCreatedEvent = new CustomEvent('riskCreated', {
          detail: {
            risk_number: result.asset_tag,
            title: formData.description,
            description: `Asset created: ${formData.assetTag}`,
            category_name: formOptions?.categories.find(c => c.id === parseInt(formData.category_id))?.name,
            inherent_score: 0
          }
        });
        window.dispatchEvent(riskCreatedEvent);
        
        alert('Asset created successfully!');
      } else {
        const error = await res.json();
        alert(`Failed to create asset: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedAsset(null);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchTerm || 
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || asset.category_name === categoryFilter;
    const matchesStatus = !statusFilter || asset.assetStatus_name === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(assets.map(a => a.category_name).filter(Boolean))];
  const statuses = [...new Set(assets.map(a => a.assetStatus_name).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#036DAD]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="text-[#036DAD]" size={32} />
            Asset Management
          </h1>
          <p className="text-gray-600 mt-1">Track and manage organizational assets</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#036DAD] text-white rounded-lg hover:bg-[#025a8d] transition-colors font-medium"
        >
          <Plus size={20} />
          Add Asset
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assets</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Package className="text-gray-400" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <Package className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Repair</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.inRepair}</p>
              </div>
              <Package className="text-orange-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Retired</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">{stats.retired}</p>
              </div>
              <Package className="text-gray-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  R{stats.totalValue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Package className="text-blue-500" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{asset.assetTag}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{asset.description}</div>
                    {asset.brand && <div className="text-xs text-gray-500">{asset.brand} {asset.entity_model}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{asset.category_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{asset.department_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {asset.assetStatus_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {asset.cost ? `R${asset.cost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedAsset(asset)}
                      className="text-[#036DAD] hover:text-[#025a8d] transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No assets found</p>
          </div>
        )}
      </div>

      {/* View Asset Details Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Package className="text-[#036DAD]" size={28} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedAsset.description}</h2>
                  <p className="text-sm text-gray-500">{selectedAsset.assetTag}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Asset Information</h4>
                  <dl className="space-y-2">
                    <div><dt className="text-xs text-gray-500">Asset Tag:</dt><dd className="text-sm font-medium text-gray-900">{selectedAsset.assetTag}</dd></div>
                    <div><dt className="text-xs text-gray-500">Serial Number:</dt><dd className="text-sm text-gray-900">{selectedAsset.serialNumber || '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Brand:</dt><dd className="text-sm text-gray-900">{selectedAsset.brand || '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Model:</dt><dd className="text-sm text-gray-900">{selectedAsset.entity_model || '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Condition:</dt><dd className="text-sm text-gray-900">{selectedAsset.condition || '-'}</dd></div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Financial Information</h4>
                  <dl className="space-y-2">
                    <div><dt className="text-xs text-gray-500">Cost:</dt><dd className="text-sm font-medium text-gray-900">{selectedAsset.cost ? `R${selectedAsset.cost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Purchase Date:</dt><dd className="text-sm text-gray-900">{selectedAsset.purchaseDate ? new Date(selectedAsset.purchaseDate).toLocaleDateString() : '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Depreciable:</dt><dd className="text-sm text-gray-900">{selectedAsset.isDepreciable ? 'Yes' : 'No'}</dd></div>
                    {selectedAsset.isDepreciable && (
                      <>
                        <div><dt className="text-xs text-gray-500">Depreciation Method:</dt><dd className="text-sm text-gray-900">{selectedAsset.depreciationMethod_name || '-'}</dd></div>
                        <div><dt className="text-xs text-gray-500">Depreciation Rate:</dt><dd className="text-sm text-gray-900">{selectedAsset.depreciationRate ? `${selectedAsset.depreciationRate}%` : '-'}</dd></div>
                      </>
                    )}
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Location</h4>
                  <dl className="space-y-2">
                    <div><dt className="text-xs text-gray-500">Category:</dt><dd className="text-sm text-gray-900">{selectedAsset.category_name || '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Department:</dt><dd className="text-sm text-gray-900">{selectedAsset.department_name || '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Site:</dt><dd className="text-sm text-gray-900">{selectedAsset.site_name || '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Location:</dt><dd className="text-sm text-gray-900">{selectedAsset.location_name || '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Status:</dt><dd className="text-sm font-medium text-gray-900">{selectedAsset.assetStatus_name || '-'}</dd></div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Warranty & Service</h4>
                  <dl className="space-y-2">
                    <div><dt className="text-xs text-gray-500">Warranty Period:</dt><dd className="text-sm text-gray-900">{selectedAsset.warrantyPeriod ? `${selectedAsset.warrantyPeriod} months` : '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Warranty Expiration:</dt><dd className="text-sm text-gray-900">{selectedAsset.warrantyExpiration ? new Date(selectedAsset.warrantyExpiration).toLocaleDateString() : '-'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Service Provider:</dt><dd className="text-sm text-gray-900">{selectedAsset.serviceProvider || '-'}</dd></div>
                  </dl>
                </div>
              </div>
            </div>

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

      {/* Create Asset Modal */}
      {showCreateModal && formOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Package className="text-[#036DAD]" size={28} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Asset</h2>
                  <p className="text-sm text-gray-500">Register a new asset in the system</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAiAssistMode(!aiAssistMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    aiAssistMode 
                      ? 'bg-gradient-to-r from-[#036DAD] to-[#0284c7] text-white shadow-md' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Sparkles size={18} />
                  <span className="text-sm font-medium">AI Assist</span>
                </button>
                <button
                  onClick={closeCreateModal}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Description <span className="text-red-500">*</span>
                        </label>
                        {aiAssistMode && (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleAiFieldAssist('description', 'explain')} className="p-1 text-gray-500 hover:text-[#036DAD] hover:bg-blue-50 rounded transition-colors" title="What's this?"><HelpCircle size={16} /></button>
                            <button type="button" onClick={() => handleAiFieldAssist('description', 'suggest')} className="p-1 text-gray-500 hover:text-[#036DAD] hover:bg-blue-50 rounded transition-colors" title="Get suggestions"><Sparkles size={16} /></button>
                            {formData.description && <button type="button" onClick={() => handleAiFieldAssist('description', 'review')} className="p-1 text-gray-500 hover:text-[#036DAD] hover:bg-blue-50 rounded transition-colors" title="Review my input"><Eye size={16} /></button>}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Enter asset description"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Asset Tag <span className="text-red-500">*</span>
                        </label>
                        {aiAssistMode && (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleAiFieldAssist('assetTag', 'explain')} className="p-1 text-gray-500 hover:text-[#036DAD] hover:bg-blue-50 rounded transition-colors" title="What's this?"><HelpCircle size={16} /></button>
                            <button type="button" onClick={() => handleAiFieldAssist('assetTag', 'suggest')} className="p-1 text-gray-500 hover:text-[#036DAD] hover:bg-blue-50 rounded transition-colors" title="Get suggestions"><Sparkles size={16} /></button>
                            {formData.assetTag && <button type="button" onClick={() => handleAiFieldAssist('assetTag', 'review')} className="p-1 text-gray-500 hover:text-[#036DAD] hover:bg-blue-50 rounded transition-colors" title="Review my input"><Eye size={16} /></button>}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.assetTag}
                        onChange={(e) => handleInputChange('assetTag', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="e.g., IT-LAP-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        value={formData.serialNumber}
                        onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Serial number"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Brand
                        </label>
                        {aiAssistMode && (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleAiFieldAssist('brand', 'explain')} className="p-1 text-gray-500 hover:text-[#036DAD] hover:bg-blue-50 rounded transition-colors" title="What's this?"><HelpCircle size={16} /></button>
                            <button type="button" onClick={() => handleAiFieldAssist('brand', 'suggest')} className="p-1 text-gray-500 hover:text-[#036DAD] hover:bg-blue-50 rounded transition-colors" title="Get suggestions"><Sparkles size={16} /></button>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Brand name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        value={formData.entity_model}
                        onChange={(e) => handleInputChange('entity_model', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Model name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) => handleInputChange('category_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
                      >
                        <option value="">Select category</option>
                        {formOptions.categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.department_id}
                        onChange={(e) => handleInputChange('department_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
                      >
                        <option value="">Select department</option>
                        {formOptions.departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.assetStatus_id}
                        onChange={(e) => handleInputChange('assetStatus_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
                      >
                        {formOptions.statuses.map((status) => (
                          <option key={status.id} value={status.id}>{status.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condition
                      </label>
                      <select
                        value={formData.condition}
                        onChange={(e) => handleInputChange('condition', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
                      >
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost (ZAR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => handleInputChange('cost', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purchase Order Number
                      </label>
                      <input
                        type="text"
                        value={formData.purchaseOrderNumber}
                        onChange={(e) => handleInputChange('purchaseOrderNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="PO number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice Number
                      </label>
                      <input
                        type="text"
                        value={formData.invoiceNumber}
                        onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Invoice number"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDepreciable"
                        checked={formData.isDepreciable}
                        onChange={(e) => handleInputChange('isDepreciable', e.target.checked)}
                        className="w-4 h-4 text-[#036DAD] border-gray-300 rounded focus:ring-[#036DAD]"
                      />
                      <label htmlFor="isDepreciable" className="text-sm font-medium text-gray-700">
                        Asset is depreciable
                      </label>
                    </div>

                    {formData.isDepreciable && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Depreciation Method
                          </label>
                          <select
                            value={formData.depreciationMethod_id}
                            onChange={(e) => handleInputChange('depreciationMethod_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
                          >
                            <option value="">Select method</option>
                            {formOptions.depreciationMethods.map((method) => (
                              <option key={method.id} value={method.id}>{method.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Depreciation Rate (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.depreciationRate}
                            onChange={(e) => handleInputChange('depreciationRate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Asset Life (years)
                          </label>
                          <input
                            type="number"
                            value={formData.assetLife}
                            onChange={(e) => handleInputChange('assetLife', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            placeholder="Years"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Residual Value (ZAR)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.residualValue}
                            onChange={(e) => handleInputChange('residualValue', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            placeholder="0.00"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site
                      </label>
                      <select
                        value={formData.site_id}
                        onChange={(e) => handleInputChange('site_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
                      >
                        <option value="">Select site</option>
                        {formOptions.sites.map((site) => (
                          <option key={site.id} value={site.id}>{site.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <select
                        value={formData.location_id}
                        onChange={(e) => handleInputChange('location_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
                      >
                        <option value="">Select location</option>
                        {formOptions.locations
                          .filter((loc) => !formData.site_id || loc.site_id === parseInt(formData.site_id))
                          .map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Warranty & Service */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Warranty & Service</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Provider
                      </label>
                      <input
                        type="text"
                        value={formData.serviceProvider}
                        onChange={(e) => handleInputChange('serviceProvider', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Service provider name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Warranty Period (months)
                      </label>
                      <input
                        type="number"
                        value={formData.warrantyPeriod}
                        onChange={(e) => handleInputChange('warrantyPeriod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Months"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Warranty Expiration
                      </label>
                      <input
                        type="date"
                        value={formData.warrantyExpiration}
                        onChange={(e) => handleInputChange('warrantyExpiration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036DAD] focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>

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
                    Add Asset
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
