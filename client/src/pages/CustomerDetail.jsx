import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Dialog, DialogFooter } from '../components/ui/Dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/common/EmptyState';
import {
  User,
  ShoppingBag,
  FileText,
  CheckSquare,
  Mail,
  Bot,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Send,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { formatCurrency, formatDate, getSegmentBadge, getStatusBadge } from '../lib/utils';

export function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');

  // Note state
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Task state
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
  const [taskLoading, setTaskLoading] = useState(false);

  // Edit contact state (FR-CUS-03, FR-CUS-04)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', billingAddress: '', shippingAddress: '' });
  const [editLoading, setEditLoading] = useState(false);

  // Action agent state for customer
  const [agentRec, setAgentRec] = useState(null);

  async function loadCustomer() {
    try {
      setLoading(true);
      const data = await api.getCustomer(id);
      setCustomer(data);
      setEditForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        billingAddress: data.billingAddress || '',
        shippingAddress: data.shippingAddress || ''
      });

      // Load action agent recommendations
      api.getCustomerRecommendations(id).then(setAgentRec).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomer();
  }, [id]);

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setNoteLoading(true);
    try {
      await api.createNote(id, noteContent);
      setNoteContent('');
      setIsNoteOpen(false);
      loadCustomer();
    } catch (err) {
      alert(err.message);
    } finally {
      setNoteLoading(false);
    }
  }

  async function handleDeleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this customer note?')) return;
    try {
      await api.deleteNote(noteId);
      loadCustomer();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!taskData.title.trim()) return;
    setTaskLoading(true);
    try {
      await api.createTask({
        ...taskData,
        customerId: id
      });
      setTaskData({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
      setIsTaskOpen(false);
      loadCustomer();
    } catch (err) {
      alert(err.message);
    } finally {
      setTaskLoading(false);
    }
  }

  async function handleToggleTaskStatus(task) {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      loadCustomer();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSaveContact(e) {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.updateCustomer(id, editForm);
      setIsEditOpen(false);
      loadCustomer();
    } catch (err) {
      alert(err.message);
    } finally {
      setEditLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading customer profile...</div>;
  }

  if (error || !customer) {
    return (
      <Alert variant="destructive" title="Customer Not Found">
        {error || 'Unable to retrieve the requested customer.'}
      </Alert>
    );
  }

  const segBadge = getSegmentBadge(customer.segment);

  const tabs = [
    { id: 'orders', label: 'Order History', icon: <ShoppingBag className="w-4 h-4" />, count: customer.orders?.length || 0 },
    { id: 'notes', label: 'Customer Notes', icon: <FileText className="w-4 h-4" />, count: customer.notes?.length || 0 },
    { id: 'tasks', label: 'Follow-Up Tasks', icon: <CheckSquare className="w-4 h-4" />, count: customer.tasks?.length || 0 },
    { id: 'communications', label: 'Communications', icon: <Mail className="w-4 h-4" />, count: customer.communications?.length || 0 },
    { id: 'agent', label: 'Action Agent', icon: <Sparkles className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-indigo transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
        </Link>
      </div>

      {/* Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-indigo to-indigo-400 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-brand-indigo/20">
              {customer.firstName[0]}{customer.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">
                  {customer.firstName} {customer.lastName}
                </h2>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${segBadge.className}`}>
                  {segBadge.label}
                </span>
                <Badge variant={customer.source === 'WOOCOMMERCE' ? 'info' : 'default'}>
                  {customer.source === 'WOOCOMMERCE' ? 'WooCommerce Store' : 'CRM Managed'}
                </Badge>
              </div>

              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>{customer.email}</span>
                {customer.phone && <span>&bull; {customer.phone}</span>}
                {customer.woocommerceId && (
                  <span className="font-mono text-slate-400">&bull; Woo ID: #{customer.woocommerceId}</span>
                )}
              </p>

              {/* Source protection disclosure (FR-CUS-04) */}
              {customer.source === 'WOOCOMMERCE' && (
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-indigo" />
                  <span>Commerce identity sourced from WooCommerce. CRM-only contact fields can be updated below.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="text-right px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Spend</span>
              <span className="text-base font-bold text-slate-900">{formatCurrency(customer.totalSpent)}</span>
            </div>
            <div className="text-right px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Orders</span>
              <span className="text-base font-bold text-slate-900">{customer.orderCount}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="text-xs"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader className="p-0 border-b-0">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </CardHeader>
        <CardContent className="p-6">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Synchronized Commerce Orders</h3>
                <span className="text-xs text-slate-400">Read-only WooCommerce data</span>
              </div>
              {customer.orders?.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No orders recorded for this customer"
                  description="When this customer completes an order in WooCommerce, it will synchronize here automatically."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.orders.map((order) => {
                      const st = getStatusBadge(order.status);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-semibold text-slate-900 text-xs">
                            <Link to={`/orders?search=${order.orderNumber}`} className="text-brand-indigo hover:underline">
                              #{order.orderNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatDate(order.dateCreated, 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${st.className}`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {order.items?.map((it) => `${it.name} (x${it.quantity})`).join(', ') || 'No line items'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900 text-xs">
                            {formatCurrency(order.total, order.currency)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* TAB 2: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Customer Interaction Notes</h3>
                  <p className="text-xs text-slate-500">Private CRM notes visible to authenticated staff</p>
                </div>
                <Button size="sm" variant="indigo" onClick={() => setIsNoteOpen(true)} className="text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Note
                </Button>
              </div>

              {customer.notes?.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No notes recorded"
                  description="Keep track of phone calls, preferences, or special agreements by adding a note."
                  actionText="Add First Note"
                  onAction={() => setIsNoteOpen(true)}
                />
              ) : (
                <div className="space-y-3">
                  {customer.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-800">{note.authorName}</span>
                          <span className="text-[11px] text-slate-400">
                            &bull; {formatDate(note.createdAt, 'MMM d, yyyy, h:mm a')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{note.content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Follow-Up Reminders & Tasks</h3>
                  <p className="text-xs text-slate-500">Scheduled actions linked to this customer profile</p>
                </div>
                <Button size="sm" variant="indigo" onClick={() => setIsTaskOpen(true)} className="text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </Button>
              </div>

              {customer.tasks?.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title="No follow-up tasks"
                  description="Schedule a check-in call, email reminder, or review task."
                  actionText="Create Task"
                  onAction={() => setIsTaskOpen(true)}
                />
              ) : (
                <div className="space-y-2.5">
                  {customer.tasks.map((task) => {
                    const isCompleted = task.status === 'COMPLETED';
                    const isOverdue = !isCompleted && task.dueDate && new Date(task.dueDate) < new Date();
                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          isCompleted
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : isOverdue
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 hover:border-brand-indigo'
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <p className={`text-xs font-semibold ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              Overdue
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formatDate(task.dueDate, 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMMUNICATIONS */}
          {activeTab === 'communications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Email Communication History</h3>
                  <p className="text-xs text-slate-500">Logged transactional messages with delivery evidence</p>
                </div>
                <Link to={`/communications?customerId=${customer.id}&action=compose`}>
                  <Button size="sm" variant="indigo" className="text-xs">
                    <Send className="w-3.5 h-3.5" /> Compose Email
                  </Button>
                </Link>
              </div>

              {customer.communications?.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No communications logged"
                  description="Use email templates to send personalized approved messages."
                />
              ) : (
                <div className="space-y-3">
                  {customer.communications.map((comm) => {
                    const st = getStatusBadge(comm.status);
                    return (
                      <div
                        key={comm.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-xs transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-900">{comm.subject}</span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${st.className}`}>
                            {comm.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                          {comm.body}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                          <span>To: {comm.recipientEmail}</span>
                          <span>{formatDate(comm.createdAt, 'MMM d, yyyy, h:mm a')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACTION AGENT */}
          {activeTab === 'agent' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-brand-indigo">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Deterministic Action Recommendations</h3>
                    <p className="text-xs text-slate-500">Rules-based customer insights grounded in stored records</p>
                  </div>
                </div>
              </div>

              {agentRec ? (
                <Card className="border-indigo-100 bg-indigo-50/20 p-5 space-y-4">
                  {/* Facts Citation (FR-AGT-01) */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Recorded CRM & Commerce Facts:
                    </h5>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {agentRec.facts.map((fact, idx) => (
                        <li key={idx} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2 text-slate-700">
                          <CheckCircle className="w-3.5 h-3.5 text-brand-indigo shrink-0" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Inference (FR-AGT-01) */}
                  <div className="p-3 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[11px] font-bold text-brand-indigo uppercase block mb-1">
                      Rule-Based Inference:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{agentRec.inference}</p>
                  </div>

                  {/* Suggested Action */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Recommended Strategy:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{agentRec.suggestedAction}</p>
                  </div>

                  {/* Action Buttons (FR-AGT-02, FR-AGT-03) */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      size="sm"
                      variant="indigo"
                      onClick={() => {
                        setTaskData({
                          title: agentRec.prefillTask.title,
                          description: agentRec.prefillTask.description,
                          priority: agentRec.prefillTask.priority,
                          dueDate: ''
                        });
                        setIsTaskOpen(true);
                      }}
                      className="text-xs"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> Prefill Task Action
                    </Button>
                    <Link
                      to={`/communications?customerId=${customer.id}&subject=${encodeURIComponent(agentRec.prefillEmail.subject)}&body=${encodeURIComponent(agentRec.prefillEmail.body)}&action=compose`}
                    >
                      <Button size="sm" variant="outline" className="text-xs">
                        <Mail className="w-3.5 h-3.5" /> Draft Email Action
                      </Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                <p className="text-xs text-slate-500">Calculating recommendations...</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note Modal */}
      <Dialog
        isOpen={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        title="Add Customer Note"
        description={`Record notes or feedback for ${customer.firstName} ${customer.lastName}`}
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <Textarea
            label="Note Details"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Document interaction, customer preferences, or key points..."
            rows={4}
            required
          />
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNoteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={noteLoading}>
              Save Note
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Task Modal */}
      <Dialog
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        title="Schedule Follow-up Task"
        description={`Create a task linked to ${customer.firstName} ${customer.lastName}`}
      >
        <form onSubmit={handleCreateTask} className="space-y-3">
          <Input
            label="Task Title"
            value={taskData.title}
            onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
            placeholder="e.g. Follow up on quote"
            required
          />
          <Textarea
            label="Task Description (Optional)"
            value={taskData.description}
            onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
            placeholder="Additional context or checklist..."
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={taskData.dueDate}
              onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
            />
            <div className="w-full">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={taskData.priority}
                onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
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
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTaskOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={taskLoading}>
              Save Task
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Profile Modal (FR-CUS-03, FR-CUS-04) */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Customer Profile"
        description="Update CRM contact details. WooCommerce-sourced IDs remain protected."
      >
        <form onSubmit={handleSaveContact} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            placeholder="+1 555-0000"
          />
          <Input
            label="Billing Address"
            value={editForm.billingAddress}
            onChange={(e) => setEditForm({ ...editForm, billingAddress: e.target.value })}
            placeholder="Street address..."
          />
          <Input
            label="Shipping Address"
            value={editForm.shippingAddress}
            onChange={(e) => setEditForm({ ...editForm, shippingAddress: e.target.value })}
            placeholder="Delivery address..."
          />
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={editLoading}>
              Update Profile
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
