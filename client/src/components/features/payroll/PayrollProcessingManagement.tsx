import React, { useState } from 'react';
import { Zap, Play, CheckCircle, AlertCircle, Clock, Users, DollarSign, Eye } from 'lucide-react';
import Button from '../../shared/Button';
import Card from '../../shared/Card';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { usePayrollPeriods, usePayrollStats } from '../../../hooks/usePayroll';
import { PayrollService } from '../../../services/payrollService';
import type { PayrollPeriod } from '../../../types';

interface PayrollProcessingManagementProps {
  className?: string;
}

const PayrollProcessingManagement: React.FC<PayrollProcessingManagementProps> = ({ className }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [processedPeriods, setProcessedPeriods] = useState<Set<string>>(new Set());

  // Fetch data
  const { data: periodsData, isLoading, error, refetch } = usePayrollPeriods({
    page: 1,
    limit: 50
  });
  const { data: statsData } = usePayrollStats();

  const periods = periodsData?.periods || [];
  const stats = statsData || { totalEmployees: 0, totalPayroll: 0, processedPeriods: 0, pendingPeriods: 0 };
  
  // Debug logging
  console.log('PayrollProcessingManagement - statsData:', statsData);
  console.log('PayrollProcessingManagement - stats:', stats);

  const handleProcessPayroll = async (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    setIsProcessingModalOpen(true);
  };

  const confirmProcessPayroll = async () => {
    if (!selectedPeriod) return;

    console.log('Starting payroll processing for period:', selectedPeriod.periodName, 'Status:', selectedPeriod.status);
    
    setIsProcessing(true);
    setProcessingResult(null); // Clear previous results
    try {
      // Step 1: Generate payroll records
      console.log('Calling generatePayrollRecords for period:', selectedPeriod.id);
      const result = await PayrollService.generatePayrollRecords(selectedPeriod.id);
      console.log('Generate payroll result:', result);
      
      // Step 2: Automatically send to departments for approval
      if (result.success) {
        console.log('Sending payroll to departments...');
        await PayrollService.sendPayrollToDepartments(selectedPeriod.id);
        setProcessingResult({
          success: true,
          message: 'Payroll processed successfully and sent to departments for approval'
        });
        
        // Mark this period as processed
        setProcessedPeriods(prev => new Set([...prev, selectedPeriod.id]));
        
        // Auto-close modal after successful processing (with a small delay to show the success message)
        setTimeout(() => {
          handleCloseProcessingModal();
        }, 2000);
      } else {
        setProcessingResult(result);
      }
      
      console.log('Refreshing periods data...');
      await refetch(); // Refresh periods data
      
      // Force a second refresh after a short delay to ensure we get the latest status
      setTimeout(async () => {
        console.log('Second refresh to get updated status...');
        await refetch();
        
        // Debug: Log the updated period status
        const updatedPeriod = periods.find(p => p.id === selectedPeriod.id);
        console.log('After processing - Original period status:', selectedPeriod.status);
        console.log('After processing - Updated period status:', updatedPeriod?.status);
        console.log('After processing - All periods:', periods.map(p => ({ id: p.id, name: p.periodName, status: p.status })));
      }, 1500);
      
    } catch (error) {
      console.error('Error processing payroll:', error);
      setProcessingResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process payroll' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewResults = (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    setIsViewModalOpen(true);
  };

  const handleCloseProcessingModal = () => {
    setIsProcessingModalOpen(false);
    setProcessingResult(null);
    setSelectedPeriod(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'processing': return 'Processing';
      case 'draft': return 'Draft';
      default: return status;
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
      <Card className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : 'An error occurred'}</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Processing</h2>
          <p className="text-gray-600">Generate and process payroll records for each period</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Periods:</span> {periods.length}
          </div>
        </div>
      </div>

      {/* Processing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalEmployees || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Processed Periods</h3>
              <p className="text-2xl font-bold text-green-600">
                {periods.filter(p => p.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Pending Processing</h3>
              <p className="text-2xl font-bold text-orange-600">
                {periods.filter(p => p.status === 'draft').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Payroll</h3>
              <p className="text-2xl font-bold text-purple-600">₱{stats.totalPayroll || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payroll Periods List */}
      <div className="space-y-4">
        {periods.length === 0 ? (
          <Card className="p-8 text-center">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payroll Periods</h3>
            <p className="text-gray-600 mb-4">
              Create payroll periods first before processing payroll records.
            </p>
          </Card>
        ) : (
          periods.map((period) => (
            <Card key={period.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{period.periodName}</h3>
                    <p className="text-sm text-gray-600">
                      {period.startDate ? new Date(period.startDate).toLocaleDateString() : 'Invalid Date'} - {period.endDate ? new Date(period.endDate).toLocaleDateString() : 'Invalid Date'}
                    </p>
                    {period.workingDays && period.expectedHours && (
                      <p className="text-xs text-gray-500 mt-1">
                        {period.workingDays} working days • {period.expectedHours} expected hours
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant={getStatusColor(period.status)}>
                    {getStatusLabel(period.status)}
                  </Badge>
                  
                  <div className="flex space-x-2">
                    {period.status === 'draft' && !processedPeriods.has(period.id) && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Play className="h-4 w-4" />}
                        onClick={() => handleProcessPayroll(period)}
                      >
                        Process Payroll
                      </Button>
                    )}
                    
                    {(period.status === 'processing' || processedPeriods.has(period.id)) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="h-4 w-4" />}
                          onClick={() => handleViewResults(period)}
                        >
                          {period.status === 'processing' ? 'View Progress' : 'View Results'}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Play className="h-4 w-4" />}
                          onClick={() => handleProcessPayroll(period)}
                        >
                          Reprocess Payroll
                        </Button>
                      </>
                    )}
                    
                    {period.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="h-4 w-4" />}
                          onClick={() => handleViewResults(period)}
                        >
                          View Results
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Play className="h-4 w-4" />}
                          onClick={() => handleProcessPayroll(period)}
                        >
                          Reprocess Payroll
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Processing Confirmation Modal */}
      <Modal
        isOpen={isProcessingModalOpen}
        onClose={handleCloseProcessingModal}
        title={selectedPeriod?.status === 'draft' ? 'Process Payroll' : 'Reprocess Payroll'}
        size="lg"
      >
        <div className="space-y-4">
          {selectedPeriod && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  {selectedPeriod.status === 'draft' ? 'Processing Payroll Period' : 'Reprocessing Payroll Period'}
                </h4>
                <p className="text-blue-800">
                  <strong>{selectedPeriod.periodName}</strong>
                </p>
                <p className="text-sm text-blue-700">
                  {selectedPeriod.startDate ? new Date(selectedPeriod.startDate).toLocaleDateString() : 'Invalid Date'} - {selectedPeriod.endDate ? new Date(selectedPeriod.endDate).toLocaleDateString() : 'Invalid Date'}
                </p>
                {selectedPeriod.status !== 'draft' && (
                  <p className="text-sm text-orange-700 mt-2">
                    ⚠️ This will regenerate all payroll records for this period
                  </p>
                )}
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">What will happen:</h4>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  <li>Calculate payroll for all active employees</li>
                  <li>Apply deductions from employee balances</li>
                  <li>Add benefits to net pay</li>
                  <li>Calculate late deductions based on attendance</li>
                  <li>Generate individual payroll records</li>
                  <li><strong>Automatically send to departments for approval</strong></li>
                </ul>
              </div>

              {processingResult && (
                <div className={`p-4 rounded-lg ${
                  processingResult.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center">
                    {processingResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <p className={`font-medium ${
                      processingResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {processingResult.message}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                {!processingResult ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCloseProcessingModal}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={confirmProcessPayroll}
                      disabled={isProcessing}
                      icon={isProcessing ? <LoadingSpinner size="sm" /> : <Play className="h-4 w-4" />}
                    >
                      {isProcessing 
                        ? (selectedPeriod.status === 'draft' ? 'Processing...' : 'Reprocessing...') 
                        : (selectedPeriod.status === 'draft' ? 'Confirm Process' : 'Confirm Reprocess')
                      }
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleCloseProcessingModal}
                  >
                    Close
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* View Results Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Payroll Processing Results"
        size="lg"
      >
        <div className="space-y-4">
          {selectedPeriod && (
            <>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Processing Complete</h4>
                <p className="text-green-800">
                  Payroll has been successfully processed for <strong>{selectedPeriod.periodName}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Records Generated</h5>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalEmployees || 0}</p>
                  <p className="text-sm text-gray-600">Employee records</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Total Amount</h5>
                  <p className="text-2xl font-bold text-green-600">₱{stats.totalPayroll || 0}</p>
                  <p className="text-sm text-gray-600">Gross payroll</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    // Navigate to payroll records tab
                  }}
                >
                  View Records
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PayrollProcessingManagement;
