
export interface Company {
  id: number;
  name: string;
  cnpj: string;
  status: string;
}

export interface Book {
  name: string;
  description: string;
  required: boolean;
  status: 'pending' | 'completed';
  generatedAt?: string;
  fileName?: string;
  recordCount?: number;
  format?: string;
  period?: string;
}

export interface ERPOption {
  value: string;
  label: string;
  color: string;
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  apiEndpoint: string;
  requiredFields: string[];
  description: string;
}

export interface SyncHistoryEntry {
  id: number;
  message: string;
  timestamp: string;
}

export interface ERPData {
  sales: any[];
  purchases: any[];
  inventory: any[];
  financial: any[];
  lastSync: string;
}

export interface APIResponse {
  success: boolean;
  error?: string;
}

export interface ConnectionStatus {
  [key: string]: 'connected' | 'disconnected' | 'error' | 'testing';
}

export interface ApiKeys {
  [key: string]: Record<string, string>;
}

export interface IntegrationData {
  [key: string]: ERPData;
}

export interface BookGenerationConfig {
  erps: string[];
  period: {
    start: string;
    end: string;
  };
  bookTypes: string[];
  format: string;
  includeAnalytics: boolean;
  autoValidation: boolean;
  digitalSignature: boolean;
}

export interface DashboardMetrics {
  totalSales: number;
  totalPurchases: number;
  totalProducts: number;
  totalCustomers: number;
  salesTrend: number;
  profit: number;
  profitMargin: number;
}

export interface NotificationSettings {
  email: boolean;
  browser: boolean;
  sms: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'pt-BR' | 'en-US';
  timezone: string;
  dateFormat: string;
  notifications: NotificationSettings;
}
