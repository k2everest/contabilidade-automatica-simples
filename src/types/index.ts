
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
