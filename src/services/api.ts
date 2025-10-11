const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  private useMockData = false;

  constructor() {
    // Check if we should use mock data (when API is not available)
    this.checkApiAvailability();
  }

  private async checkApiAvailability() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      this.useMockData = !response.ok;
    } catch (error) {
      this.useMockData = true;
    }
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email, password })
    });
    return this.handleResponse(response);
  }

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getCurrentUser() {
    if (this.useMockData) {
      const user = localStorage.getItem('user');
      if (user) {
        return { user: JSON.parse(user) };
      }
      throw new Error('No user found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Patient Intake
  async getPatientIntakes(params?: { page?: number; per_page?: number; search?: string }) {
    const queryString = params ? '?' + new URLSearchParams({
      page: params.page?.toString() || '1',
      per_page: params.per_page?.toString() || '10',
      ...(params.search && { search: params.search })
    }).toString() : '';
    const response = await fetch(`${API_BASE_URL}/patient-intake${queryString}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Get next enrollment ID
  async getNextEnrollmentId() {
    if (this.useMockData) {
      // Generate mock enrollment ID
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      return { enrollment_id: `FM${randomNum.toString().padStart(4, '0')}` };
    }

    const response = await fetch(`${API_BASE_URL}/patient-intake/next-enrollment-id`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async createPatientIntake(data: any) {
    if (this.useMockData) {
      return {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString()
      };
    }

    const response = await fetch(`${API_BASE_URL}/patient-intake`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getPatientIntake(id: string) {
    const response = await fetch(`${API_BASE_URL}/patient-intake/${id}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updatePatientIntake(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/patient-intake/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async deletePatientIntake(id: string) {
    const response = await fetch(`${API_BASE_URL}/patient-intake/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Payments & Billing
  async getPaymentsBilling(params?: { 
    page?: number; 
    per_page?: number; 
    search?: string; 
    status?: string;
    date_from?: string;
    date_to?: string;
  }) {
    if (this.useMockData) {
      return { data: [], pagination: { current_page: 1, per_page: 10, total: 0, last_page: 1 } };
    }

    const queryString = params ? '?' + new URLSearchParams({
      page: params.page?.toString() || '1',
      per_page: params.per_page?.toString() || '10',
      ...(params.search && { search: params.search }),
      ...(params.status && { status: params.status }),
      ...(params.date_from && { date_from: params.date_from }),
      ...(params.date_to && { date_to: params.date_to })
    }).toString() : '';
    const response = await fetch(`${API_BASE_URL}/billing-payments${queryString}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async createPaymentsBilling(data: any) {
    if (this.useMockData) {
      return {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString()
      };
    }

    const response = await fetch(`${API_BASE_URL}/billing-payments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getPaymentBilling(id: string) {
    const response = await fetch(`${API_BASE_URL}/billing-payments/${id}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updatePaymentsBilling(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/billing-payments/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async deletePaymentsBilling(id: string) {
    const response = await fetch(`${API_BASE_URL}/billing-payments/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Audit Trail
  async getAuditTrail(params?: { 
    page?: number; 
    per_page?: number; 
    search?: string; 
    status?: string;
    date_from?: string;
    date_to?: string;
    patient_name?: string;
    claim_number?: string;
  }) {
    const queryString = params ? '?' + new URLSearchParams({
      page: params.page?.toString() || '1',
      per_page: params.per_page?.toString() || '10',
      ...(params.search && { search: params.search }),
      ...(params.status && { status: params.status }),
      ...(params.date_from && { date_from: params.date_from }),
      ...(params.date_to && { date_to: params.date_to }),
      ...(params.patient_name && { patient_name: params.patient_name }),
      ...(params.claim_number && { claim_number: params.claim_number })
    }).toString() : '';
    const response = await fetch(`${API_BASE_URL}/audit-trail${queryString}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getAuditRecord(id: string) {
    if (this.useMockData) {
      return { id, patientName: 'Mock Patient' };
    }

    const response = await fetch(`${API_BASE_URL}/audit-trail/${id}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateAuditRecord(id: string, data: any) {
    if (this.useMockData) {
      return { id, ...data, updated_at: new Date().toISOString() };
    }

    const response = await fetch(`${API_BASE_URL}/audit-trail/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async exportAuditTrail(params?: {
    format?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
  }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetch(`${API_BASE_URL}/audit-trail/export${queryString}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  }

  // Dashboard
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getRecentActivity(limit?: number) {
    if (this.useMockData) {
      return [];
    }

    const queryString = limit ? `?limit=${limit}` : '';
    const response = await fetch(`${API_BASE_URL}/dashboard/recent-activity${queryString}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();