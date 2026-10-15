import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { StatCard } from '../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  CheckSquare,
  Sparkles,
  ArrowRight,
  UserPlus,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge, getSegmentBadge } from '../lib/utils';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await api.getDashboardOverview();
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" title="Failed to load dashboard metrics">
        {error}
      </Alert>
    );
  }

  const { metrics, segmentDistribution, recentOrders, recentCommunications, syncStatus } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Merqanta Executive Dashboard</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Centralized customer intelligence, commerce operations, and autonomous retention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/agent')}
            className="text-xs text-brand-indigo border-indigo-200 hover:bg-indigo-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Action Recommendations</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/customers?action=new')}
            className="text-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Customer</span>
          </Button>
        </div>
      </div>

      {/* Honest Metrics Disclosure Notice (FR-RET-05) */}
      <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-indigo shrink-0" />
          <span>
            <strong>Honest Commerce Metrics:</strong> Order values represent recorded qualifying gross sales (status: completed/processing), not accounting profit.
          </span>
        </div>
        <Link to="/retention" className="font-semibold underline hover:text-indigo-700 shrink-0 ml-2">
          View Retention Analytics &rarr;
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={metrics.totalCustomers}
          subtext="Persisted in CRM Database"
          icon={Users}
          badge={`${segmentDistribution.New} New`}
          badgeType="info"
        />
        <StatCard
          title="Synced Orders"
          value={metrics.totalOrders}
          subtext={`${metrics.qualifyingOrdersCount} qualifying orders`}
          icon={ShoppingBag}
          badge="WooCommerce API v3"
          badgeType="success"
        />
        <StatCard
          title="Qualifying Gross Sales"
          value={formatCurrency(metrics.totalOrderValue)}
          subtext="Gross completed & processing"
          icon={DollarSign}
          badge="Recorded Orders"
          badgeType="info"
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(metrics.averageOrderValue)}
          subtext="Qualifying order average"
          icon={TrendingUp}
          badge="AOV Metric"
          badgeType="info"
        />
      </div>

      {/* Customer Segments Quick Navigation (FR-RET-01, FR-RET-04) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Customer Retention Segments</CardTitle>
            <CardDescription>Click a segment to inspect and act on those customers</CardDescription>
          </div>
          <Link to="/retention" className="text-xs font-semibold text-brand-indigo hover:underline flex items-center gap-1">
            Retention Details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => navigate('/customers?segment=New')}
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:shadow-sm text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">New</span>
                <span className="text-lg font-bold text-emerald-900">{segmentDistribution.New}</span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">1st purchase or newly added</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/customers?segment=Repeat')}
              className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:shadow-sm text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-800">Repeat</span>
                <span className="text-lg font-bold text-blue-900">{segmentDistribution.Repeat}</span>
              </div>
              <p className="text-[11px] text-blue-600 mt-1">2-4 completed orders</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/customers?segment=Loyal')}
              className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:shadow-sm text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-800">Loyal VIP</span>
                <span className="text-lg font-bold text-purple-900">{segmentDistribution.Loyal}</span>
              </div>
              <p className="text-[11px] text-purple-600 mt-1">5+ orders or $500+ spend</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/customers?segment=Inactive')}
              className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:shadow-sm text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800">Inactive</span>
                <span className="text-lg font-bold text-amber-900">{segmentDistribution.Inactive}</span>
              </div>
              <p className="text-[11px] text-amber-600 mt-1">60+ days without order</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Split Grid: Recent Orders & Recent Communications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent WooCommerce Orders</CardTitle>
                <CardDescription>Read-only synchronized commerce orders</CardDescription>
              </div>
              <Link to="/orders" className="text-xs font-semibold text-brand-indigo hover:underline flex items-center gap-1">
                All Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="border-none rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                        No orders synchronized yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentOrders.map((order) => {
                      const statusStyle = getStatusBadge(order.status);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-semibold text-slate-900 text-xs">
                            #{order.orderNumber}
                          </TableCell>
                          <TableCell className="text-xs">
                            {order.customer ? (
                              <Link
                                to={`/customers/${order.customer.id}`}
                                className="text-brand-indigo hover:underline font-medium"
                              >
                                {order.customer.firstName} {order.customer.lastName}
                              </Link>
                            ) : (
                              <span className="text-slate-500 italic">Guest Checkout</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatDate(order.dateCreated, 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusStyle.className}`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-900 text-xs">
                            {formatCurrency(order.total, order.currency)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Operational Column (Tasks & Communications) */}
        <div className="space-y-6">
          {/* Tasks & Follow-ups Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Follow-Up Tasks</CardTitle>
                <CardDescription>Customer reminders</CardDescription>
              </div>
              <Link to="/tasks" className="text-xs font-semibold text-brand-indigo hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 text-brand-indigo" />
                  <span className="text-xs font-medium text-slate-700">Pending Tasks</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{metrics.pendingTasks}</span>
              </div>
              {metrics.overdueTasks > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-semibold">Overdue Tasks</span>
                  </div>
                  <span className="text-sm font-bold text-rose-900">{metrics.overdueTasks}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">WooCommerce Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sync Status:</span>
                <Badge variant={syncStatus.status === 'SUCCESS' ? 'success' : 'default'}>
                  {syncStatus.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Last Synchronized:</span>
                <span className="font-medium text-slate-700">
                  {syncStatus.lastSyncCompletedAt ? formatDate(syncStatus.lastSyncCompletedAt, 'MMM d, h:mm a') : 'Not yet run'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="w-full text-xs mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Integration Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
