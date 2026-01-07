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
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchAppointments();
  }, [user, router]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get<ServiceAppointment[]>('/appointments');
      
      if (response.success) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleCreateAppointment = () => {
    router.push('/appointments/new');
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
              <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user.user.firstName} {user.user.lastName}
              </p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={handleCreateAppointment}>
                New Appointment
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Appointments</h2>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first service appointment.</p>
              <div className="mt-6">
                <Button onClick={handleCreateAppointment}>
                  Create Appointment
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {appointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: ServiceAppointment }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{appointment.title}</h3>
          <p className="text-sm text-gray-600">Ref: {appointment.referenceNumber}</p>
        </div>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(appointment.status)}`}>
            {appointment.status.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeColor(appointment.priority)}`}>
            {appointment.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Service Details</p>
          <p className="text-sm text-gray-600 capitalize">{appointment.serviceType}</p>
          <p className="text-sm text-gray-600">{appointment.estimatedDuration} minutes</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Scheduled</p>
          <p className="text-sm text-gray-600">{formatDateTime(appointment.scheduledDateTime)}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">Address</p>
        <p className="text-sm text-gray-600">
          {appointment.address.street}, {appointment.address.city}, {appointment.address.state} {appointment.address.zipCode}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">Description</p>
        <p className="text-sm text-gray-600">{appointment.description}</p>
      </div>

      {appointment.technicianId && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">Assigned Technician</p>
          <p className="text-sm text-gray-600">
            {typeof appointment.technicianId === 'object' 
              ? `${appointment.technicianId.firstName} ${appointment.technicianId.lastName}` 
              : 'Technician assigned'}
          </p>
          {typeof appointment.technicianId === 'object' && appointment.technicianId.phoneNumber && (
            <p className="text-sm text-gray-600">{appointment.technicianId.phoneNumber}</p>
          )}
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">Required Skills</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {appointment.requiredSkills.map((skill) => (
            <span
              key={skill.id}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>

      {appointment.status === 'completed' && !appointment.customerFeedback && (
        <div className="bg-yellow-50 p-3 rounded-md">
          <p className="text-sm text-yellow-800 font-medium">Service Complete - Leave Feedback</p>
          <p className="text-sm text-yellow-700">How was your experience with this service?</p>
          <Button variant="outline" size="sm" className="mt-2">
            Leave Feedback
          </Button>
        </div>
      )}

      {appointment.status === 'completed' && appointment.completionNotes && (
        <div className="mt-4 p-3 bg-green-50 rounded-md">
          <p className="text-sm font-medium text-green-800">Completion Notes</p>
          <p className="text-sm text-green-700">{appointment.completionNotes}</p>
        </div>
      )}

      {appointment.customerFeedback && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm font-medium text-blue-800">
            Your Feedback ({appointment.customerFeedback.rating}/5 stars)
          </p>
          {appointment.customerFeedback.comment && (
            <p className="text-sm text-blue-700">{appointment.customerFeedback.comment}</p>
          )}
        </div>
      )}
    </div>
  );
}
