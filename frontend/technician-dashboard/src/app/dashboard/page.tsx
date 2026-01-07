'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { ServiceAppointment } from '@/types';
import { formatDateTime, getStatusBadgeColor, getPriorityBadgeColor } from '@/lib/utils';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'available' | 'my-jobs'>('available');
  const [availableJobs, setAvailableJobs] = useState<ServiceAppointment[]>([]);
  const [myJobs, setMyJobs] = useState<ServiceAppointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [availableResponse, myJobsResponse] = await Promise.all([
        api.get<ServiceAppointment[]>('/technician/jobs/available'),
        api.get<ServiceAppointment[]>('/technician/jobs/my')
      ]);

      if (availableResponse.success) {
        setAvailableJobs(availableResponse.data);
      }

      if (myJobsResponse.success) {
        setMyJobs(myJobsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      const response = await api.post(`/technician/jobs/${jobId}/accept`);
      
      if (response.success) {
        await fetchData(); // Refresh data
      } else {
        alert('Failed to accept job: ' + response.error.message);
      }
    } catch (error) {
      console.error('Error accepting job:', error);
      alert('Failed to accept job');
    }
  };

  const handleUpdateStatus = async (jobId: string, status: 'in_progress' | 'completed') => {
    const completionNotes = status === 'completed' ? prompt('Enter completion notes (optional):') : undefined;
    
    try {
      const response = await api.patch(`/technician/jobs/${jobId}/status`, {
        status,
        completionNotes: completionNotes || undefined
      });
      
      if (response.success) {
        await fetchData(); // Refresh data
      } else {
        alert('Failed to update job status: ' + response.error.message);
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user.user.firstName} {user.user.lastName} ({user.user.employeeId})
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available Jobs ({availableJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('my-jobs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Jobs ({myJobs.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="py-6">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeTab === 'available' ? (
                availableJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No available jobs matching your skills and location.</p>
                  </div>
                ) : (
                  availableJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      showAcceptButton
                      onAccept={() => handleAcceptJob(job.id)}
                    />
                  ))
                )
              ) : (
                myJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">You have no assigned jobs.</p>
                  </div>
                ) : (
                  myJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      showStatusButtons
                      onUpdateStatus={handleUpdateStatus}
                    />
                  ))
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobCard({ 
  job, 
  showAcceptButton, 
  showStatusButtons, 
  onAccept, 
  onUpdateStatus 
}: {
  job: ServiceAppointment;
  showAcceptButton?: boolean;
  showStatusButtons?: boolean;
  onAccept?: () => void;
  onUpdateStatus?: (jobId: string, status: 'in_progress' | 'completed') => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-600">Ref: {job.referenceNumber}</p>
        </div>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(job.status)}`}>
            {job.status.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeColor(job.priority)}`}>
            {job.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Customer</p>
          <p className="text-sm text-gray-600">
            {job.customerId.firstName} {job.customerId.lastName}
          </p>
          <p className="text-sm text-gray-600">{job.customerId.phoneNumber}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Service Details</p>
          <p className="text-sm text-gray-600 capitalize">{job.serviceType}</p>
          <p className="text-sm text-gray-600">{job.estimatedDuration} minutes</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">Address</p>
        <p className="text-sm text-gray-600">
          {job.address.street}, {job.address.city}, {job.address.state} {job.address.zipCode}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">Scheduled</p>
        <p className="text-sm text-gray-600">{formatDateTime(job.scheduledDateTime)}</p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">Description</p>
        <p className="text-sm text-gray-600">{job.description}</p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">Required Skills</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {job.requiredSkills.map((skill) => (
            <span
              key={skill.id}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>

      {showAcceptButton && (
        <div className="flex justify-end">
          <Button onClick={onAccept}>
            Accept Job
          </Button>
        </div>
      )}

      {showStatusButtons && job.status !== 'completed' && (
        <div className="flex justify-end space-x-2">
          {job.status === 'accepted' && (
            <Button onClick={() => onUpdateStatus?.(job.id, 'in_progress')}>
              Start Job
            </Button>
          )}
          {job.status === 'in_progress' && (
            <Button onClick={() => onUpdateStatus?.(job.id, 'completed')}>
              Complete Job
            </Button>
          )}
        </div>
      )}

      {job.status === 'completed' && job.completionNotes && (
        <div className="mt-4 p-3 bg-green-50 rounded-md">
          <p className="text-sm font-medium text-green-800">Completion Notes</p>
          <p className="text-sm text-green-700">{job.completionNotes}</p>
        </div>
      )}

      {job.customerFeedback && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm font-medium text-blue-800">
            Customer Feedback ({job.customerFeedback.rating}/5 stars)
          </p>
          {job.customerFeedback.comment && (
            <p className="text-sm text-blue-700">{job.customerFeedback.comment}</p>
          )}
        </div>
      )}
    </div>
  );
}
