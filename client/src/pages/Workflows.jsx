import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogFooter } from '../components/ui/Dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/common/EmptyState';
import {
  Workflow,
  Play,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  History,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatDate } from '../lib/utils';

export function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Workflow run drawer/dialog
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [historyRuns, setHistoryRuns] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Run execution feedback
  const [runningId, setRunningId] = useState(null);
  const [runMessage, setRunMessage] = useState('');

  // Create workflow modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    triggerType: 'INACTIVE_CUSTOMER',
    triggerDays: '60',
    actionType: 'CREATE_TASK',
    taskTitle: 'Reach out to inactive client: {{name}}',
    enabled: true
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadWorkflows() {
    try {
      setLoading(true);
      const res = await api.getWorkflows();
      setWorkflows(res.workflows || []);
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function handleToggleEnabled(wf) {
    try {
      await api.updateWorkflow(wf.id, { enabled: !wf.enabled });
      loadWorkflows();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRunWorkflow(id) {
    setRunningId(id);
    setRunMessage('');
    try {
      const res = await api.runWorkflow(id);
      const out = res.outcome;
      setRunMessage(`✓ Execution complete! Processed: ${out.processedCount}, Skipped: ${out.skippedCount} (Duplicate prevention lock), Errors: ${out.errorsCount}`);
      loadWorkflows();
    } catch (err) {
      setRunMessage(`✗ Execution error: ${err.message}`);
    } finally {
      setRunningId(null);
    }
  }

  async function handleViewHistory(wf) {
    try {
      const res = await api.getWorkflow(wf.id);
      setSelectedWorkflow(res);
      setHistoryRuns(res.runs || []);
      setIsHistoryOpen(true);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this workflow rule?')) return;
    try {
      await api.deleteWorkflow(id);
      loadWorkflows();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError('');
    setModalLoading(true);

    try {
      await api.createWorkflow({
        name: form.name,
        description: form.description,
        triggerType: form.triggerType,
        triggerConfig: { daysInactive: parseInt(form.triggerDays, 10) },
        actionType: form.actionType,
        actionConfig: { taskTitle: form.taskTitle, priority: 'HIGH' },
        enabled: form.enabled
      });
      setIsModalOpen(false);
      loadWorkflows();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Workflow Automation Engine</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rule-based triggers, task dispatchers, and duplicate-safe execution runs (FR-WF-01 to FR-WF-05).
          </p>
        </div>
        <Button variant="indigo" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>New Workflow Rule</span>
        </Button>
      </div>

      {runMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-mono shadow-md flex items-center justify-between">
          <span>{runMessage}</span>
          <button
            type="button"
            onClick={() => setRunMessage('')}
            className="text-slate-400 hover:text-white text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Safety Policy Notice (FR-WF-04, FR-WF-05) */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
        <p className="font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-brand-indigo" />
          Idempotency & Outbound Messaging Policy:
        </p>
        <p>
          &bull; <strong>Duplicate Action Prevention:</strong> Workflows record a unique composite idempotency key per target. Repeated scheduler triggers or manual runs will never generate duplicate tasks for the same trigger event.
        </p>
        <p>
          &bull; <strong>Outbound Safety:</strong> Automated email sending remains disabled by default (<code className="text-brand-indigo">ENABLE_AUTO_EMAIL=false</code>) to safeguard recipient trust.
        </p>
      </div>

      {/* Workflows List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={Workflow}
            title="No workflow rules configured"
            description="Create automated retention rules to proactively follow up with inactive customers."
            actionText="Create Rule"
            onAction={() => setIsModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {workflows.map((wf) => {
            const isRunning = runningId === wf.id;
            return (
              <Card key={wf.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base text-slate-900">{wf.name}</CardTitle>
                        <Badge variant={wf.enabled ? 'success' : 'default'}>
                          {wf.enabled ? 'Active Rule' : 'Disabled'}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        {wf.description || 'Automated trigger rule'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 py-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Trigger Condition:</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-brand-indigo">
                        {wf.triggerType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Action Dispatcher:</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-emerald-700">
                        {wf.actionType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Last Run: {wf.lastRunAt ? formatDate(wf.lastRunAt, 'MMM d, h:mm a') : 'Never run'}</span>
                    <span>Total Runs: {wf._count?.runs || 0}</span>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between py-3">
                  <Button
                    variant={wf.enabled ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={() => handleToggleEnabled(wf)}
                    className="text-xs h-8"
                  >
                    {wf.enabled ? 'Disable' : 'Enable'}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewHistory(wf)}
                      className="text-xs text-slate-600 hover:text-brand-indigo h-8 px-2.5"
                    >
                      <History className="w-3.5 h-3.5" /> Runs
                    </Button>

                    <Button
                      variant="indigo"
                      size="sm"
                      onClick={() => handleRunWorkflow(wf.id)}
                      isLoading={isRunning}
                      className="text-xs h-8"
                    >
                      <Play className="w-3.5 h-3.5" /> Run Now
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleDelete(wf.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 rounded transition-colors cursor-pointer"
                      title="Delete workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Execution History Modal (FR-WF-03, FR-WF-04) */}
      <Dialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Execution Run History: ${selectedWorkflow?.name}`}
        description="Persistent audit log of workflow trigger outcomes and idempotency checks"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {historyRuns.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No execution runs recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {historyRuns.map((run) => (
                <div
                  key={run.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Action: {run.actionTaken || 'Evaluated'}
                    </span>
                    <Badge variant={run.status === 'SUCCESS' ? 'success' : run.status === 'SKIPPED' ? 'warning' : 'danger'}>
                      {run.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Idempotency Key: {run.idempotencyKey}
                  </p>
                  {run.details && (
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 font-mono">
                      {run.details}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 text-right">
                    Executed {formatDate(run.executedAt, 'MMM d, yyyy, h:mm:ss a')}
                  </p>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Create Workflow Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Workflow Rule"
        description="Configure rule conditions and target action"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-3">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {formError}
            </div>
          )}

          <Input
            label="Workflow Rule Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. 60-Day Inactive Customer Follow-up"
            required
          />

          <Input
            label="Description (Optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What this workflow accomplishes..."
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Trigger Event"
              value={form.triggerType}
              onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
              options={[
                { value: 'INACTIVE_CUSTOMER', label: 'Inactive Customer (Days)' },
                { value: 'NEW_ORDER', label: 'New Order Placed' },
                { value: 'HIGH_VALUE_ORDER', label: 'High Value Order ($)' },
                { value: 'ORDER_STATUS_CHANGED', label: 'Order Status Changed' }
              ]}
            />
            <Input
              label="Days Inactive Threshold"
              type="number"
              value={form.triggerDays}
              onChange={(e) => setForm({ ...form, triggerDays: e.target.value })}
              min="1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Action to Dispatch"
              value={form.actionType}
              onChange={(e) => setForm({ ...form, actionType: e.target.value })}
              options={[
                { value: 'CREATE_TASK', label: 'Create Follow-up Task' },
                { value: 'DRAFT_EMAIL', label: 'Create Draft Email (Review)' },
                { value: 'SEND_EMAIL', label: 'Send Email (If Authorized)' }
              ]}
            />
            <Input
              label="Generated Task Title"
              value={form.taskTitle}
              onChange={(e) => setForm({ ...form, taskTitle: e.target.value })}
              placeholder="Reach out to {{name}}"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={modalLoading}>
              Save Rule
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
