import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Copy, Check } from 'lucide-react';
import Button from '../../shared/Button';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';
import Input from '../../shared/Input';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { useDeductionTypes, useCreateDeductionType, useUpdateDeductionType, useDeleteDeductionType } from '../../../hooks/useDeductionTypes';
import type { DeductionType, CreateDeductionTypeRequest, UpdateDeductionTypeRequest } from '../../../types';

interface DeductionTypeManagementProps {
  className?: string;
}

const DeductionTypeManagement: React.FC<DeductionTypeManagementProps> = ({ className }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeductionType, setSelectedDeductionType] = useState<DeductionType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateDeductionTypeRequest>({
    name: '',
    description: '',
    percentage: undefined,
    fixedAmount: undefined,
    isActive: true
  });

  // Fetch data
  const { data: deductionTypesData, isLoading, error } = useDeductionTypes({
    search: searchTerm || undefined,
    isActive: filterActive
  });

  const createMutation = useCreateDeductionType();
  const updateMutation = useUpdateDeductionType();
  const deleteMutation = useDeleteDeductionType();

  const deductionTypes = deductionTypesData?.records || [];

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      percentage: undefined,
      fixedAmount: undefined,
      isActive: true
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (deductionType: DeductionType) => {
    setSelectedDeductionType(deductionType);
    setFormData({
      name: deductionType.name,
      description: deductionType.description,
      percentage: deductionType.percentage,
      fixedAmount: deductionType.fixedAmount,
      isActive: deductionType.isActive
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this deduction type?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting deduction type:', error);
      }
    }
  };

  const handleCreateSubmit = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        percentage: undefined,
        fixedAmount: undefined,
        isActive: true
      });
    } catch (error) {
      console.error('Error creating deduction type:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedDeductionType) return;
    
    try {
      const updateData: UpdateDeductionTypeRequest = {
        name: formData.name,
        description: formData.description,
        percentage: formData.percentage,
        fixedAmount: formData.fixedAmount,
        isActive: formData.isActive
      };
      
      await updateMutation.mutateAsync({
        id: selectedDeductionType.id,
        data: updateData
      });
      
      setIsEditModalOpen(false);
      setSelectedDeductionType(null);
    } catch (error) {
      console.error('Error updating deduction type:', error);
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy ID:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading deduction types: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Deduction Types</h2>
          <p className="text-sm text-gray-500">Manage employee deduction types</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Deduction Type
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search deduction types..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterActive === undefined ? 'all' : filterActive.toString()}
            onChange={(e) => setFilterActive(e.target.value === 'all' ? undefined : e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Deduction Types List */}
      <div className="grid gap-4">
        {deductionTypes.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No deduction types found</p>
          </Card>
        ) : (
          deductionTypes.map((deductionType) => (
            <Card key={deductionType.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">{deductionType.name}</h3>
                    <Badge variant={deductionType.isActive ? 'success' : 'default'}>
                      {deductionType.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {deductionType.description && (
                    <p className="text-sm text-gray-500 mt-1">{deductionType.description}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    {deductionType.percentage ? 
                      `Percentage: ${deductionType.percentage}%` : 
                      `Fixed Amount: ₱${deductionType.fixedAmount?.toLocaleString() || '0'}`
                    }
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 font-mono">ID: {deductionType.id}</span>
                    <button
                      onClick={() => handleCopyId(deductionType.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy ID"
                    >
                      {copiedId === deductionType.id ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(deductionType)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(deductionType.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Deduction Type"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="Enter deduction type name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Percentage (%)
              </label>
              <Input
                type="number"
                value={formData.percentage?.toString() || ''}
                onChange={(value) => setFormData({ 
                  ...formData, 
                  percentage: value ? parseFloat(value) : undefined,
                  fixedAmount: undefined // Clear fixed amount when percentage is set
                })}
                placeholder="Enter percentage"
                disabled={formData.fixedAmount !== undefined}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed Amount (₱)
              </label>
              <Input
                type="number"
                value={formData.fixedAmount?.toString() || ''}
                onChange={(value) => setFormData({ 
                  ...formData, 
                  fixedAmount: value ? parseFloat(value) : undefined,
                  percentage: undefined // Clear percentage when fixed amount is set
                })}
                placeholder="Enter fixed amount"
                disabled={formData.percentage !== undefined}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            * Either percentage or fixed amount must be provided, but not both
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateSubmit}
            disabled={!formData.name || (!formData.percentage && !formData.fixedAmount) || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Deduction Type"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="Enter deduction type name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Percentage (%)
              </label>
              <Input
                type="number"
                value={formData.percentage?.toString() || ''}
                onChange={(value) => setFormData({ 
                  ...formData, 
                  percentage: value ? parseFloat(value) : undefined,
                  fixedAmount: undefined // Clear fixed amount when percentage is set
                })}
                placeholder="Enter percentage"
                disabled={formData.fixedAmount !== undefined}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed Amount (₱)
              </label>
              <Input
                type="number"
                value={formData.fixedAmount?.toString() || ''}
                onChange={(value) => setFormData({ 
                  ...formData, 
                  fixedAmount: value ? parseFloat(value) : undefined,
                  percentage: undefined // Clear percentage when fixed amount is set
                })}
                placeholder="Enter fixed amount"
                disabled={formData.percentage !== undefined}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            * Either percentage or fixed amount must be provided, but not both
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            disabled={!formData.name || (!formData.percentage && !formData.fixedAmount) || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DeductionTypeManagement;
