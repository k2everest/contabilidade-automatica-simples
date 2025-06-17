import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, Save, X, Download } from 'lucide-react';
import { generateBookFile } from '../utils/fileGenerator';
import { toast } from '@/hooks/use-toast';
import type { Book } from '../types';

interface BookDetailsModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBook: Book) => void;
  onDownload: (book: Book) => void;
}

const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  isOpen,
  onClose,
  onSave,
  onDownload
}) => {
  const [editedBook, setEditedBook] = useState<Book>({ ...book });
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(editedBook);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedBook({ ...book });
    setIsEditing(false);
  };

  const handleDownload = () => {
    try {
      generateBookFile(editedBook, editedBook.format || 'pdf');
      toast({
        title: "Download iniciado",
        description: `Baixando: ${editedBook.fileName || editedBook.name}`,
      });
      onDownload(editedBook);
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Falha ao baixar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Detalhes do Livro</span>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e informações básicas */}
          <div className="flex items-center justify-between">
            <Badge variant={editedBook.status === 'completed' ? 'default' : 'secondary'}>
              {editedBook.status === 'completed' ? 'Concluído' : 'Pendente'}
            </Badge>
            {editedBook.generatedAt && (
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                Gerado em: {new Date(editedBook.generatedAt).toLocaleString('pt-BR')}
              </div>
            )}
          </div>

          {/* Nome do livro */}
          <div className="space-y-2">
            <Label htmlFor="book-name">Nome do Livro</Label>
            {isEditing ? (
              <Input
                id="book-name"
                value={editedBook.name}
                onChange={(e) => setEditedBook({ ...editedBook, name: e.target.value })}
              />
            ) : (
              <p className="text-gray-900 font-medium">{editedBook.name}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="book-description">Descrição</Label>
            {isEditing ? (
              <Textarea
                id="book-description"
                value={editedBook.description}
                onChange={(e) => setEditedBook({ ...editedBook, description: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-gray-700">{editedBook.description}</p>
            )}
          </div>

          {/* Obrigatório */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="book-required"
              checked={editedBook.required}
              onCheckedChange={(checked) => 
                setEditedBook({ ...editedBook, required: checked as boolean })
              }
              disabled={!isEditing}
            />
            <Label htmlFor="book-required">Livro obrigatório</Label>
          </div>

          {/* Informações do arquivo gerado */}
          {editedBook.status === 'completed' && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900">Informações do Arquivo</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="file-name">Nome do Arquivo</Label>
                  {isEditing ? (
                    <Input
                      id="file-name"
                      value={editedBook.fileName || ''}
                      onChange={(e) => setEditedBook({ ...editedBook, fileName: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{editedBook.fileName}</p>
                  )}
                </div>

                <div>
                  <Label>Número de Registros</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedBook.recordCount || 0}
                      onChange={(e) => setEditedBook({ 
                        ...editedBook, 
                        recordCount: parseInt(e.target.value) || 0 
                      })}
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{editedBook.recordCount} registros</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Configurações adicionais */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Configurações</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="format">Formato do Arquivo</Label>
                {isEditing ? (
                  <Select 
                    value={editedBook.format || 'pdf'} 
                    onValueChange={(value) => setEditedBook({ ...editedBook, format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-600">{editedBook.format || 'PDF'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="period">Período</Label>
                {isEditing ? (
                  <Input
                    id="period"
                    type="month"
                    value={editedBook.period || ''}
                    onChange={(e) => setEditedBook({ ...editedBook, period: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-gray-600">{editedBook.period || 'Não definido'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-between pt-6 border-t">
          {isEditing ? (
            <div className="flex space-x-2">
              <Button onClick={handleSave} className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button 
                onClick={handleDownload}
                disabled={editedBook.status !== 'completed'}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Fazer Download
              </Button>
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookDetailsModal;
