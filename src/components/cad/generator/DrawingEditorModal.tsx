'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface DrawingEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editParameters: Record<string, string>;
  onParameterChange: (key: string, value: string) => void;
  onSave: () => void;
}

const DrawingEditorModal: React.FC<DrawingEditorModalProps> = React.memo(({
  isOpen,
  onClose,
  editParameters,
  onParameterChange,
  onSave,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Drawing">
      <div className="space-y-4">
        <p className="text-gray-600 mb-4">Modify the drawing parameters below:</p>
        {Object.entries(editParameters).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </label>
            <Input
              type={key.includes('holes') || key.includes('count') ? 'number' : 'text'}
              value={value}
              onChange={(newValue) => onParameterChange(key, newValue)}
              className="w-full"
            />
          </div>
        ))}
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
});

DrawingEditorModal.displayName = 'DrawingEditorModal';

export default DrawingEditorModal;
