import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Database,
  Mail,
  Store,
  Key,
  ShieldCheck,
  Copy,
  ExternalLink
} from 'lucide-react';
import { formatDate } from '../lib/utils';

export function IntegrationSettings() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  async function loadStatus() {
    try {
      setLoading(true);
      const res = await api.getSyncStatus();
      setSyncStatus(res);
    } catch (err) {
      console.error('Failed to load sync status:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleTriggerSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await api.triggerSync();
      setMessage({ type: 'success', text: `Sync finished! Processed: ${res.result.customersProcessed} customers, ${res.result.ordersProcessed} orders.` });
      loadStatus();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Sync failed.' });
      loadStatus();
    } finally {
      setSyncing(false);
    }
  }

  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Integrations & System Configuration</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage WooCommerce REST API v3 sync, signed webhooks, transactional email provider, and Supabase Database.
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>
          {message.text}
        </Alert>
      )}

      {/* Security boundary banner (FR-CONF-01, NFR-SEC-01) */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-indigo shrink-0" />
          <span>
            <strong>Server-Side Secret Isolation (FR-CONF-01):</strong> Consumer secrets, Resend API keys, and database passwords are stored exclusively on the server and are never returned to or bundled in the browser.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WooCommerce Integration Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>WooCommerce REST API v3</CardTitle>
                  <CardDescription>Customer & Order Synchronization</CardDescription>
                </div>
              </div>
              <Badge variant={syncStatus?.isConfigured ? 'success' : 'warning'}>
                {syncStatus?.isConfigured ? 'Connected' : 'Using Demo / Offline'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3.5 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Store URL:</span>
                <span className="font-mono text-slate-900">{syncStatus?.storeUrl || 'https://example.com'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Last Sync Completed:</span>
                <span className="text-slate-800">
                  {syncStatus?.lastSyncCompletedAt ? formatDate(syncStatus.lastSyncCompletedAt, 'MMM d, yyyy, h:mm a') : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Total Records Processed:</span>
                <span className="font-semibold text-slate-900">{syncStatus?.recordsProcessed || 0}</span>
              </div>
              {syncStatus?.lastError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
                  <strong>Last Error:</strong> {syncStatus.lastError}
                </div>
              )}
            </div>

            {/* Inbound Webhook Instructions (FR-SYNC-03) */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">WooCommerce Webhook Endpoint:</span>
              <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800">
                <span className="truncate flex-1">POST /api/webhooks/woocommerce</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('/api/webhooks/woocommerce', 'webhook')}
                  className="p-1 hover:text-brand-indigo cursor-pointer text-slate-500"
                  title="Copy path"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              {copiedText === 'webhook' && <p className="text-[10px] text-emerald-600 font-medium">Copied endpoint to clipboard!</p>}
              <p className="text-[11px] text-slate-500">
                Configure in WooCommerce &gt; Settings &gt; Advanced &gt; Webhooks. Set Secret to match <code className="text-brand-indigo font-bold">WOOCOMMERCE_WEBHOOK_SECRET</code>. Raw HMAC SHA-256 signatures are verified automatically.
              </p>
            </div>
          </CardContent>

          <CardFooter className="pt-3 border-t border-slate-100">
            <Button
              variant="indigo"
              size="sm"
              onClick={handleTriggerSync}
              isLoading={syncing}
              className="w-full text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Trigger Manual Sync Now
            </Button>
          </CardFooter>
        </Card>

        {/* Database Platform: Supabase (managed PostgreSQL) */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Supabase Database (PostgreSQL)</CardTitle>
                  <CardDescription>Managed Database & Prisma ORM</CardDescription>
                </div>
              </div>
              <Badge variant="success">Active Store</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3.5 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Database Engine:</span>
                <span className="font-semibold text-slate-900">PostgreSQL (Supabase Managed)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">ORM Layer:</span>
                <span className="font-semibold text-slate-900">Prisma Client v6</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Schema Migrations:</span>
                <span className="text-emerald-700 font-semibold">Committed Reproducible Migrations</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">Connecting Live Supabase Project:</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                To connect your Supabase PostgreSQL instance:
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                <li>Copy the pooled transaction connection string into <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-brand-indigo">DATABASE_URL</code>.</li>
                <li>Copy direct connection string into <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-brand-indigo">DIRECT_URL</code>.</li>
                <li>Execute <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">npm run db:switch:supabase</code> to apply the PostgreSQL schema.</li>
                <li>Run <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">npm run prisma:migrate</code> to synchronize tables.</li>
              </ol>
            </div>
          </CardContent>

          <CardFooter className="pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-400 w-full text-center">
              Current runtime mode: Local Zero-Config &bull; Ready for Supabase Cloud
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Resend Email Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Resend Transactional Email</CardTitle>
              <CardDescription>Verified provider dispatch and delivery status tracking</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="font-bold text-slate-800 block">Delivery Endpoint:</span>
              <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200 font-mono text-[11px]">
                <span className="truncate flex-1">POST /api/webhooks/resend</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('/api/webhooks/resend', 'resend')}
                  className="p-1 hover:text-brand-indigo cursor-pointer text-slate-500"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              {copiedText === 'resend' && <p className="text-[10px] text-emerald-600">Copied to clipboard!</p>}
              <p className="text-[11px] text-slate-500">
                In Resend Dashboard, add this webhook endpoint for events: <code className="font-mono text-slate-800">email.delivered</code>, <code className="font-mono text-slate-800">email.bounced</code>, <code className="font-mono text-slate-800">email.complained</code>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="font-bold text-slate-800 block">Server Variables:</span>
              <ul className="space-y-1 text-[11px] font-mono text-slate-600">
                <li>RESEND_API_KEY=re_***</li>
                <li>EMAIL_FROM=Merqanta &lt;notifications@yourstore.com&gt;</li>
                <li>RESEND_WEBHOOK_SECRET=whsec_***</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
