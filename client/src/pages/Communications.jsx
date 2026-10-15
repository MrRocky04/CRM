import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Dialog, DialogFooter } from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/common/EmptyState';
import {
  Mail,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  User,
  Plus
} from 'lucide-react';
import { formatDate, getStatusBadge } from '../lib/utils';

export function Communications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [communications, setCommunications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Compose Modal & Approval Workflow (FR-COM-04)
  const [isComposeOpen, setIsComposeOpen] = useState(searchParams.get('action') === 'compose');
  const [selectedCustomerId, setSelectedCustomerId] = useState(searchParams.get('customerId') || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [body, setBody] = useState(searchParams.get('body') || '');

  // Preview state (Explicit Approval step)
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [commRes, custRes, tmplRes] = await Promise.all([
        api.getCommunications(),
        api.getCustomers({ limit: 100 }),
        api.getTemplates()
      ]);
      setCommunications(commRes.communications || []);
      setCustomers(custRes.customers || []);
      setTemplates(tmplRes.templates || []);
    } catch (err) {
      console.error('Failed to load communications:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    const custId = searchParams.get('customerId');
    const subj = searchParams.get('subject');
    const bdy = searchParams.get('body');
    if (action === 'compose') setIsComposeOpen(true);
    if (custId) setSelectedCustomerId(custId);
    if (subj) setSubject(subj);
    if (bdy) setBody(bdy);
  }, [searchParams]);

  // Update subject and body when template changes
  function handleTemplateSelect(e) {
    const tmplId = e.target.value;
    setSelectedTemplateId(tmplId);
    if (!tmplId) return;

    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl) {
      setSubject(tmpl.subject);
      setBody(tmpl.body);
    }
  }

  // Step 1: Render Preview with Customer Context
  async function handleGeneratePreview() {
    if (!selectedCustomerId) {
      setSendError('Please select a recipient customer.');
      return;
    }
    setSendError('');
    setPreviewLoading(true);

    try {
      const res = await api.previewEmail({
        customerId: selectedCustomerId,
        templateId: selectedTemplateId || undefined,
        subject,
        body
      });
      setPreview(res);
    } catch (err) {
      setSendError(err.message || 'Failed to generate email preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  // Step 2: Explicit Confirmation and Dispatch
  async function handleConfirmSend() {
    if (!preview) return;
    setSendLoading(true);
    setSendError('');

    try {
      await api.sendEmail({
        customerId: preview.customer.id,
        recipientEmail: preview.recipientEmail,
        recipientName: preview.customer.name,
        subject: preview.subject,
        body: preview.body,
        templateId: selectedTemplateId || null
      });

      setSendSuccess(`Email successfully dispatched for delivery to ${preview.recipientEmail}!`);
      setIsComposeOpen(false);
      setPreview(null);
      setSelectedTemplateId('');
      setSubject('');
      setBody('');
      loadData();
    } catch (err) {
      setSendError(err.message || 'Failed to send communication');
    } finally {
      setSendLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Transactional Communications</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Traceable email communications, delivery event tracking, and explicit approval sending.
          </p>
        </div>
        <Button
          variant="indigo"
          size="sm"
          onClick={() => {
            setIsComposeOpen(true);
            setSendSuccess('');
            setSendError('');
          }}
          className="shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span>Compose Email</span>
        </Button>
      </div>

      {sendSuccess && (
        <Alert variant="success" title="Email Dispatched">
          {sendSuccess}
        </Alert>
      )}

      {/* Safety Policy Banner (FR-COM-04) */}
      <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-indigo shrink-0" />
          <span>
            <strong>Explicit Approval Policy:</strong> Outbound emails require explicit user review and confirmation before dispatch. Provider acceptance is labeled as ACCEPTED and updated to DELIVERED upon verified webhook.
          </span>
        </div>
        <Link to="/templates" className="font-semibold text-brand-indigo hover:underline shrink-0 ml-2">
          Manage Templates &rarr;
        </Link>
      </div>

      {/* Communications Log Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Sent Communication Timeline</CardTitle>
          <CardDescription>All outbound transactional emails recorded in Supabase</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Sent Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="py-4 text-center">
                      <div className="h-5 bg-slate-100 rounded animate-pulse max-w-sm mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : communications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8">
                    <EmptyState
                      icon={Mail}
                      title="No communications logged yet"
                      description="Compose a message using approved templates to start tracking customer communications."
                      actionText="Compose First Email"
                      onAction={() => setIsComposeOpen(true)}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                communications.map((comm) => {
                  const st = getStatusBadge(comm.status);
                  return (
                    <TableRow key={comm.id}>
                      <TableCell className="text-xs">
                        {comm.customer ? (
                          <Link
                            to={`/customers/${comm.customer.id}`}
                            className="font-semibold text-slate-900 hover:text-brand-indigo block"
                          >
                            {comm.recipientName || `${comm.customer.firstName} ${comm.customer.lastName}`}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-900 block">{comm.recipientName || 'Customer'}</span>
                        )}
                        <span className="text-[11px] text-slate-500 font-mono">{comm.recipientEmail}</span>
                      </TableCell>

                      <TableCell className="text-xs font-medium text-slate-800 max-w-xs truncate">
                        {comm.subject}
                      </TableCell>

                      <TableCell>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${st.className}`}>
                          {comm.status}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-slate-500 font-mono">
                        {comm.provider}
                        {comm.providerMessageId && (
                          <span className="block text-[10px] text-slate-400 truncate max-w-[120px]">
                            {comm.providerMessageId}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-500">
                        {formatDate(comm.sentAt || comm.createdAt, 'MMM d, yyyy, h:mm a')}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Two-Step Approved Compose & Preview Modal (FR-COM-04) */}
      <Dialog
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setPreview(null);
        }}
        title="Compose & Approve Customer Email"
        description="Preview with real customer placeholder replacement before explicit sending."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {sendError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {sendError}
            </div>
          )}

          {!preview ? (
            /* STEP 1: COMPOSER */
            <div className="space-y-3">
              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-brand-indigo"
                  required
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.email}) - [{c.segment}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Load Saved Template (Optional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={handleTemplateSelect}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-brand-indigo"
                >
                  <option value="">Write custom message...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Email Subject *"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line... e.g. Special offer for {{name}}"
                required
              />

              <div>
                <Textarea
                  label="Email Body *"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write message... Use {{name}} and {{email}} as placeholders."
                  rows={5}
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported placeholders: <code className="text-brand-indigo font-bold">{"{{name}}"}</code> and <code className="text-brand-indigo font-bold">{"{{email}}"}</code>
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsComposeOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="indigo"
                  size="sm"
                  onClick={handleGeneratePreview}
                  isLoading={previewLoading}
                  disabled={!selectedCustomerId || !subject.trim() || !body.trim()}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Rendered Email
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* STEP 2: PREVIEW & EXPLICIT CONFIRMATION */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Please review the rendered message below. Confirming will dispatch the email via the transactional email provider.
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-500">To: </span>
                  <span className="font-semibold text-slate-900">{preview.customer.name} &lt;{preview.recipientEmail}&gt;</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Subject: </span>
                  <span className="font-semibold text-slate-900">{preview.subject}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 mt-2">
                  <span className="font-bold text-slate-500 block mb-1">Message Body:</span>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg font-sans whitespace-pre-line text-slate-800 leading-relaxed shadow-xs">
                    {preview.body}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreview(null)}
                >
                  Back to Edit
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirmSend}
                  isLoading={sendLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Send className="w-3.5 h-3.5" /> Confirm & Send Email
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
