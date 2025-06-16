
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApiKeyFormProps {
  erpType: string;
  requiredFields: string[];
  onSave: (erpType: string, keys: Record<string, string>) => void;
  onCancel: () => void;
  currentKeys: Record<string, string>;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ 
  erpType, 
  requiredFields, 
  onSave, 
  onCancel, 
  currentKeys 
}) => {
  const [keys, setKeys] = useState(currentKeys);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasAllKeys = requiredFields.every(field => keys[field] && keys[field].trim());
    if (!hasAllKeys) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    onSave(erpType, keys);
  };

  const fieldLabels: Record<string, string> = {
    apiKey: 'API Key',
    token: 'Token',
    formato: 'Formato',
    appKey: 'App Key',
    appSecret: 'App Secret',
    clientId: 'Client ID',
    clientSecret: 'Client Secret',
    companyId: 'Company ID'
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {requiredFields.map(field => (
        <div key={field}>
          <Label htmlFor={field}>
            {fieldLabels[field] || field}
          </Label>
          <Input
            id={field}
            type={field.toLowerCase().includes('secret') ? 'password' : 'text'}
            value={keys[field] || ''}
            onChange={(e) => setKeys(prev => ({ ...prev, [field]: e.target.value }))}
            placeholder={`Digite ${fieldLabels[field] || field}`}
          />
        </div>
      ))}
      
      <div className="flex space-x-3 pt-4">
        <Button type="submit" className="flex-1">
          Salvar
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default ApiKeyForm;
