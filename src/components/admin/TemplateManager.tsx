'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Trash2,
  Download,
  Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ClassTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  instructor: string;
  duration: number;
  maxCapacity: number;
  schedule: string;
  color?: string;
  createdAt: string;
}

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect?: (template: ClassTemplate) => void;
}

export default function TemplateManager({
  isOpen,
  onClose,
  onTemplateSelect,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/classes/templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template: ClassTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
      onClose();
    } else {
      // Create class directly from template
      const className = prompt('Enter class name:', template.name);
      if (!className) return;

      const schedule = prompt('Enter schedule:', template.schedule);
      if (!schedule) return;

      try {
        setCreating(true);
        const response = await fetch(`/api/classes/templates/${template.id}/use`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: className,
            schedule,
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert('Class created successfully from template!');
          onClose();
          window.location.reload(); // Refresh to show new class
        } else {
          alert(data.error || 'Failed to create class from template');
        }
      } catch (error) {
        console.error('Error using template:', error);
        alert('Failed to create class from template');
      } finally {
        setCreating(false);
      }
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/classes/templates/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Template deleted successfully');
        fetchTemplates(); // Refresh list
      } else {
        alert(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">Class Templates</h2>
                  <p className="text-white/90">
                    Save and reuse class configurations
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Templates List */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No templates yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Create a class and save it as a template for quick reuse
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-lg ${
                          template.color || 'bg-gradient-to-br from-indigo-400 to-purple-400'
                        } flex items-center justify-center`}
                      >
                        <FileText className="h-6 w-6 text-white" />
                      </div>

                      {/* Template Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {template.description}
                          </p>
                        )}
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Type:</span>{' '}
                            {template.type}
                          </p>
                          <p>
                            <span className="font-medium">Instructor:</span>{' '}
                            {template.instructor}
                          </p>
                          <p>
                            <span className="font-medium">Duration:</span>{' '}
                            {template.duration} mins
                          </p>
                          <p>
                            <span className="font-medium">Capacity:</span>{' '}
                            {template.maxCapacity}
                          </p>
                          <p>
                            <span className="font-medium">Schedule:</span>{' '}
                            {template.schedule}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                          <Button
                            onClick={() => handleUseTemplate(template)}
                            disabled={creating}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            {creating ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            Use Template
                          </Button>
                          <Button
                            onClick={() => handleDeleteTemplate(template.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <strong>Tip:</strong> Templates help you quickly create similar
              classes with consistent settings.
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
