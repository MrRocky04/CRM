import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogFooter } from '../components/ui/Dialog';
import { EmptyState } from '../components/common/EmptyState';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Send,
  Sparkles
} from 'lucide-react';
import { formatDate } from '../lib/utils';

export function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Template Modal (Create/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'GENERAL',
    subject: '',
    body: '',
    description: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Preview Drawer/Modal
  const [previewTemplate, setPreviewTemplate] = useState(null);

  async function loadTemplates() {
    try {
      setLoading(true);
      const res = await api.getTemplates();
      setTemplates(res.templates || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    setForm({
      name: '',
      category: 'GENERAL',
      subject: '',
      body: '',
      description: ''
    });
    setFormError('');
    setIsModalOpen(true);
  }

  function handleOpenEdit(t) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      category: t.category,
      subject: t.subject,
      body: t.body,
      description: t.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.deleteTemplate(id);
      loadTemplates();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setModalLoading(true);

    try {
      if (editingId) {
        await api.updateTemplate(editingId, form);
      } else {
        await api.createTemplate(form);
      }
      setIsModalOpen(false);
      loadTemplates();
    } catch (err) {
      setFormError(err.message || 'Validation error');
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Email Template Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage reusable customer messages with strict placeholder validation (FR-COM-02, FR-COM-03).
          </p>
        </div>
        <Button variant="indigo" size="sm" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </Button>
      </div>

      {/* Placeholder Reference Banner */}
      <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
        <div>
          <span className="font-bold">Permitted Placeholders: </span>
          Only <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-brand-indigo font-bold">{"{{name}}"}</code> and <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-brand-indigo font-bold">{"{{email}}"}</code> are supported. Any unsupported placeholders are rejected by server Zod validation.
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={FileText}
            title="No templates created yet"
            description="Create your first email template with validated placeholders."
            actionText="Create Template"
            onAction={handleOpenCreate}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {templates.map((tmpl) => (
            <Card key={tmpl.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">{tmpl.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{tmpl.description || 'No description provided'}</CardDescription>
                  </div>
                  <Badge variant="primary">{tmpl.category}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5 py-3">
                <div className="text-xs">
                  <span className="font-semibold text-slate-500 block mb-0.5">Subject:</span>
                  <p className="font-medium text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 font-mono">
                    {tmpl.subject}
                  </p>
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-500 block mb-0.5">Body Preview:</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 font-mono text-[11px] line-clamp-3 whitespace-pre-line">
                    {tmpl.body}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between text-xs py-2.5">
                <span className="text-[11px] text-slate-400">
                  Updated {formatDate(tmpl.updatedAt, 'MMM d, yyyy')}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewTemplate(tmpl)}
                    className="text-xs text-slate-600 hover:text-brand-indigo h-7 px-2"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(tmpl)}
                    className="text-xs text-slate-600 hover:text-slate-900 h-7 px-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tmpl.id)}
                    className="text-xs text-slate-400 hover:text-rose-600 h-7 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Email Template' : 'Create Email Template'}
        description="Supported placeholders: {{name}} and {{email}}."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Template Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. VIP Customer Appreciation"
              required
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={[
                { value: 'GENERAL', label: 'General' },
                { value: 'WELCOME', label: 'Welcome Onboarding' },
                { value: 'RETENTION', label: 'Retention & Win-Back' },
                { value: 'FOLLOW_UP', label: 'Order Follow-Up' },
                { value: 'PROMOTION', label: 'Special Promotion' }
              ]}
            />
          </div>

          <Input
            label="Template Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description for staff..."
          />

          <Input
            label="Subject Line *"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="e.g. A special thank you, {{name}}!"
            required
          />

          <div>
            <Textarea
              label="Message Body *"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Dear {{name}},&#10;&#10;Thank you for being part of our community at {{email}}...&#10;&#10;Best regards,&#10;Store Team"
              rows={6}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Do not use unsupported placeholders like {"{{phone}}"} or {"{{code}}"}.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={modalLoading}>
              {editingId ? 'Update Template' : 'Save Template'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        isOpen={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        title={`Preview: ${previewTemplate?.name}`}
        description="Simulated rendered appearance using sample recipient (Jane Doe <jane.doe@example.com>)"
        maxWidth="max-w-lg"
      >
        {previewTemplate && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div>
                <span className="font-bold text-slate-500">Subject: </span>
                <span className="font-semibold text-slate-900">
                  {previewTemplate.subject.replace(/\{\{name\}\}/g, 'Jane Doe').replace(/\{\{email\}\}/g, 'jane.doe@example.com')}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl whitespace-pre-line text-slate-800 leading-relaxed font-sans shadow-xs">
              {previewTemplate.body.replace(/\{\{name\}\}/g, 'Jane Doe').replace(/\{\{email\}\}/g, 'jane.doe@example.com')}
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)}>
                Close Preview
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
