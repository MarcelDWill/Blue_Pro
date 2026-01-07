'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import api from '@/lib/api';
import { Skill } from '@/types';

interface CreateAppointmentData {
  title: string;
  description: string;
  serviceType: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  scheduledDateTime: string;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high';
  requiredSkills: string[];
}

const serviceTypes = [
  'plumbing',
  'electrical', 
  'hvac',
  'roofing',
  'carpentry',
  'painting',
  'landscaping',
  'general_repair'
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

export default function NewAppointmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [formData, setFormData] = useState<CreateAppointmentData>({
    title: '',
    description: '',
    serviceType: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    scheduledDateTime: '',
    estimatedDuration: 60,
    priority: 'medium',
    requiredSkills: []
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Pre-fill address from user profile if available
    if (user.user.address) {
      setFormData(prev => ({
        ...prev,
        address: {
          street: user.user.address.street || '',
          city: user.user.address.city || '',
          state: user.user.address.state || '',
          zipCode: user.user.address.zipCode || ''
        }
      }));
    }
    
    fetchSkills();
  }, [user, router]);

  const fetchSkills = async () => {
    try {
      const response = await api.get<Skill[]>('/skills');
      if (response.success) {
        setSkills(response.data);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'estimatedDuration' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skillId)
        ? prev.requiredSkills.filter(id => id !== skillId)
        : [...prev.requiredSkills, skillId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.serviceType || !formData.scheduledDateTime || formData.requiredSkills.length === 0) {
      alert('Please fill in all required fields and select at least one skill');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/appointments', formData);
      
      if (response.success) {
        router.push('/dashboard');
      } else {
        alert('Error creating appointment. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      alert(error.response?.data?.error?.message || 'Error creating appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60); // Minimum 1 hour from now
    return now.toISOString().slice(0, 16);
  };

  const getSkillsByService = () => {
    if (!formData.serviceType) return skills;
    
    const serviceSkillMap: Record<string, string[]> = {
      plumbing: ['Basic Plumbing', 'Advanced Plumbing'],
      electrical: ['Residential Electrical', 'Commercial Electrical'],
      hvac: ['HVAC Maintenance', 'HVAC Installation'],
      roofing: ['Roof Repair', 'Roof Installation'],
      carpentry: ['Basic Carpentry', 'Advanced Carpentry'],
      painting: ['Interior Painting', 'Exterior Painting'],
      landscaping: ['Lawn Care', 'Landscape Design'],
      general_maintenance: ['General Handyman']
    };

    const relevantSkillNames = serviceSkillMap[formData.serviceType] || [];
    const filteredSkills = skills.filter(skill => relevantSkillNames.includes(skill.name));
    
    // If no skills match the service type, show all skills as fallback
    return filteredSkills.length > 0 ? filteredSkills : skills;
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
              <h1 className="text-2xl font-bold text-gray-900">Create New Appointment</h1>
              <p className="text-sm text-gray-600">Schedule a service appointment</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Service Details</h3>
              
              <div>
                <Label htmlFor="title">Service Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Kitchen Faucet Repair"
                  required
                />
              </div>

              <div>
                <Label htmlFor="serviceType">Service Type *</Label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a service type</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe the issue or work needed..."
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledDateTime">Preferred Date & Time *</Label>
                  <Input
                    id="scheduledDateTime"
                    name="scheduledDateTime"
                    type="datetime-local"
                    value={formData.scheduledDateTime}
                    onChange={handleInputChange}
                    min={getMinDateTime()}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                  <Input
                    id="estimatedDuration"
                    name="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={handleInputChange}
                    min="30"
                    max="480"
                    step="30"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Service Address</h3>
              
              <div>
                <Label htmlFor="address.street">Street Address *</Label>
                <Input
                  id="address.street"
                  name="address.street"
                  type="text"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="address.city">City *</Label>
                  <Input
                    id="address.city"
                    name="address.city"
                    type="text"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="Austin"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address.state">State *</Label>
                  <Input
                    id="address.state"
                    name="address.state"
                    type="text"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="TX"
                    maxLength={2}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address.zipCode">ZIP Code *</Label>
                  <Input
                    id="address.zipCode"
                    name="address.zipCode"
                    type="text"
                    value={formData.address.zipCode}
                    onChange={handleInputChange}
                    placeholder="78701"
                    maxLength={5}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Required Skills */}
            {formData.serviceType && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Required Skills *</h3>
                <p className="text-sm text-gray-600">Select the skills needed for this job</p>
                
                <div className="grid md:grid-cols-2 gap-3">
                  {getSkillsByService().map(skill => (
                    <label
                      key={skill.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.requiredSkills.includes(skill.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.requiredSkills.includes(skill.id)}
                        onChange={() => handleSkillToggle(skill.id)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{skill.name}</div>
                        <div className="text-sm text-gray-600">{skill.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Appointment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}