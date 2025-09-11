import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Copy, Check } from 'lucide-react';
import Button from '../../shared/Button';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';
import Input from '../../shared/Input';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { useBenefitTypes, useCreateBenefitType, useUpdateBenefitType, useDeleteBenefitType } from '../../../hooks/useBenefitTypes';
import type { BenefitType, CreateBenefitTypeRequest, UpdateBenefitTypeRequest } from '../../../types';

interface BenefitTypeManagementProps {
  className?: string;
}

const BenefitTypeManagement: React.FC<BenefitTypeManagementProps> = ({ className }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBenefitType, setSelectedBenefitType] = useState<BenefitType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateBenefitTypeRequest>({
    name: '',
    description: '',
    amount: 0,
    isActive: true
  });

  // Fetch data
  const { data: benefitTypesData, isLoading, error } = useBenefitTypes({
    search: searchTerm || undefined,
    isActive: filterActive
  });

  const createMutation = useCreateBenefitType();
  const updateMutation = useUpdateBenefitType();
  const deleteMutation = useDeleteBenefitType();

  const benefitTypes = benefitTypesData?.records || [];

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      amount: 0,
      isActive: true
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (benefitType: BenefitType) => {
    setSelectedBenefitType(benefitType);
    setFormData({
      name: benefitType.name,
      description: benefitType.description,
      amount: benefitType.amount,
      isActive: benefitType.isActive
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this benefit type?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting benefit type:', error);
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
        amount: 0,
        isActive: true
      });
    } catch (error) {
      console.error('Error creating benefit type:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedBenefitType) return;
    
    try {
      const updateData: UpdateBenefitTypeRequest = {
        name: formData.name,
        description: formData.description,
        amount: formData.amount,
        isActive: formData.isActive
      };
      
      await updateMutation.mutateAsync({
        id: selectedBenefitType.id,
        data: updateData
      });
      
      setIsEditModalOpen(false);
      setSelectedBenefitType(null);
    } catch (error) {
      console.error('Error updating benefit type:', error);
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
        <p className="text-red-600">Error loading benefit types: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Benefit Types</h2>
          <p className="text-sm text-gray-500">Manage employee benefit types</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Benefit Type
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search benefit types..."
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

      {/* Benefit Types List */}
      <div className="grid gap-4">
        {benefitTypes.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No benefit types found</p>
          </Card>
        ) : (
          benefitTypes.map((benefitType) => (
            <Card key={benefitType.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">{benefitType.name}</h3>
                    <Badge variant={benefitType.isActive ? 'success' : 'default'}>
                      {benefitType.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {benefitType.description && (
                    <p className="text-sm text-gray-500 mt-1">{benefitType.description}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Amount: ₱{benefitType.amount?.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 font-mono">ID: {benefitType.id}</span>
                    <button
                      onClick={() => handleCopyId(benefitType.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy ID"
                    >
                      {copiedId === benefitType.id ? (
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
                    onClick={() => handleEdit(benefitType)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(benefitType.id)}
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
        title="Create Benefit Type"
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
              placeholder="Enter benefit type name"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <Input
              type="number"
              value={formData.amount?.toString() || ''}
              onChange={(value) => setFormData({ ...formData, amount: parseFloat(value) || 0 })}
              placeholder="Enter amount"
            />
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
            disabled={!formData.name || !formData.amount || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Benefit Type"
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
              placeholder="Enter benefit type name"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <Input
              type="number"
              value={formData.amount?.toString() || ''}
              onChange={(value) => setFormData({ ...formData, amount: parseFloat(value) || 0 })}
              placeholder="Enter amount"
            />
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
            disabled={!formData.name || !formData.amount || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default BenefitTypeManagement;
