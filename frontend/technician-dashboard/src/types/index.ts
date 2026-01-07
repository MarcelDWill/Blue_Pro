export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
}

export interface WorkArea {
  id: string;
  name: string;
  city: string;
  county?: string;
  state: string;
  zipCodes: string[];
  coordinates: {
    center: {
      lat: number;
      lng: number;
    };
    radius: number;
  };
  isActive: boolean;
}

export interface Technician {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  employeeId: string;
  hourlyRate?: number;
  isActive: boolean;
  skills: Skill[];
  workAreas: WorkArea[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceAppointment {
  id: string;
  customerId: Customer;
  technicianId?: Technician;
  title: string;
  description: string;
  serviceType: 'plumbing' | 'electrical' | 'roofing' | 'hvac' | 'general_repair' | 'carpentry' | 'painting' | 'landscaping';
  requiredSkills: Skill[];
  workAreaId: WorkArea;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  scheduledDateTime: string;
  estimatedDuration: number;
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerFeedback?: {
    rating: number;
    comment?: string;
    submittedAt: string;
  };
  assignedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  completionNotes?: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  user: Technician;
  role: 'technician';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface JobStatusUpdate {
  status: 'in_progress' | 'completed';
  completionNotes?: string;
}