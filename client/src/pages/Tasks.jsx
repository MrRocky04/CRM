import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Dialog, DialogFooter } from '../components/ui/Dialog';
import { EmptyState } from '../components/common/EmptyState';
import {
  CheckSquare,
  Plus,
  Calendar,
  AlertTriangle,
  User,
  Trash2,
  Check,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatDate } from '../lib/utils';

export function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get('status') || 'ALL';

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    customerId: '',
    dueDate: '',
    priority: 'MEDIUM'
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadTasks() {
    try {
      setLoading(true);
      const res = await api.getTasks({
        status: activeTab
      });
      setTasks(res.tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  useEffect(() => {
    // Load customers for task association selector
    api.getCustomers({ limit: 50 }).then((res) => {
      setCustomers(res.customers || []);
    }).catch(() => {});
  }, []);

  async function handleToggleStatus(task) {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError('');
    setModalLoading(true);

    try {
      await api.createTask(taskForm);
      setIsModalOpen(false);
      setTaskForm({ title: '', description: '', customerId: '', dueDate: '', priority: 'MEDIUM' });
      loadTasks();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  const tabs = [
    { id: 'ALL', label: 'All Tasks' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'OVERDUE', label: 'Overdue Reminders' },
    { id: 'COMPLETED', label: 'Completed' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Follow-Up Reminders & Tasks</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize customer check-ins, sales inquiries, and retention workflows.
          </p>
        </div>
        <Button
          variant="indigo"
          size="sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader className="p-0 border-b-0">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => {
              if (tabId === 'ALL') {
                searchParams.delete('status');
              } else {
                searchParams.set('status', tabId);
              }
              setSearchParams(searchParams);
            }}
          />
        </CardHeader>
        <CardContent className="p-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks in this view"
              description="You have completed all items or no tasks match this filter."
              actionText="Add New Task"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                const isOverdue = task.isOverdue;

                const priorityStyles = {
                  LOW: 'text-slate-600 bg-slate-100',
                  MEDIUM: 'text-blue-700 bg-blue-100',
                  HIGH: 'text-amber-700 bg-amber-100',
                  URGENT: 'text-rose-700 bg-rose-100'
                };

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                      isCompleted
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isOverdue
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-white border-slate-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(task)}
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-brand-indigo'
                        }`}
                        title={isCompleted ? 'Mark pending' : 'Mark completed'}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-xs sm:text-sm font-semibold ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {task.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityStyles[task.priority]}`}>
                            {task.priority}
                          </span>
                          {task.source === 'ACTION_AGENT' && (
                            <span className="text-[10px] bg-indigo-50 text-brand-indigo px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Agent Suggested
                            </span>
                          )}
                          {task.source === 'WORKFLOW' && (
                            <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                              Workflow
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                        )}

                        {task.customer && (
                          <div className="mt-1.5">
                            <Link
                              to={`/customers/${task.customer.id}`}
                              className="text-xs text-brand-indigo hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <User className="w-3 h-3" />
                              {task.customer.firstName} {task.customer.lastName}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {isOverdue && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(task.dueDate, 'MMM d, yyyy')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Follow-up Task"
        description="Schedule a reminder linked to a customer record"
      >
        <form onSubmit={handleFormSubmit} className="space-y-3">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {formError}
            </div>
          )}

          <Input
            label="Task Title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="e.g. Call regarding wholesale order inquiry"
            required
          />

          <Textarea
            label="Details (Optional)"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            placeholder="Key discussion points, customer context, or questions..."
            rows={3}
          />

          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link to Customer (Optional)
            </label>
            <select
              value={taskForm.customerId}
              onChange={(e) => setTaskForm({ ...taskForm, customerId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-brand-indigo"
            >
              <option value="">No customer association</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
            <div className="w-full">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-brand-indigo"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={modalLoading}>
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
