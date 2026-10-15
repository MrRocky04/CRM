import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Users,
  Repeat,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function RetentionAnalytics() {
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('90d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRetention() {
      try {
        setLoading(true);
        const res = await api.getRetentionAnalytics(timeRange);
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadRetention();
  }, [timeRange]);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Calculating retention metrics and charts...</div>;
  }

  if (error) {
    return <Alert variant="destructive" title="Analytics Error">{error}</Alert>;
  }

  const {
    trendData = [],
    segmentBreakdown = {},
    repeatPurchaseRate = 0,
    averageOrderValue = 0,
    revenueInRange = 0,
    qualifyingOrdersInRange = 0
  } = data || {};

  const segmentChartData = [
    { segment: 'New', count: segmentBreakdown.New || 0, fill: '#10B981' },
    { segment: 'Repeat', count: segmentBreakdown.Repeat || 0, fill: '#3B82F6' },
    { segment: 'Loyal VIP', count: segmentBreakdown.Loyal || 0, fill: '#8B5CF6' },
    { segment: 'Inactive (60d+)', count: segmentBreakdown.Inactive || 0, fill: '#F59E0B' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Customer Retention & Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cohort retention trends, customer lifecycle distributions, and repeat purchase frequencies.
          </p>
        </div>

        {/* Time range buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {[
            { id: '30d', label: 'Last 30 Days' },
            { id: '90d', label: 'Last 90 Days' },
            { id: '1y', label: 'Past Year' },
            { id: 'all', label: 'All-Time' }
          ].map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => setTimeRange(range.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === range.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Honest Metrics Disclosure Notice (FR-RET-05) */}
      <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-indigo shrink-0" />
          <span>
            <strong>Honest Commerce Metric Standards (FR-RET-05):</strong> Charts aggregate actual recorded WooCommerce orders with qualifying statuses (completed and processing). Gross sales totals are not misrepresented as profit or net accounting revenue.
          </span>
        </div>
      </div>

      {/* Retention KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Repeat Purchase Rate</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{repeatPurchaseRate}%</h3>
          <p className="text-xs text-slate-500 mt-1">Customers with 2+ qualifying purchases</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Average Order Value (AOV)</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(averageOrderValue)}</h3>
          <p className="text-xs text-slate-500 mt-1">In selected period ({timeRange})</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Qualifying Orders</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{qualifyingOrdersInRange}</h3>
          <p className="text-xs text-slate-500 mt-1">Completed & processing orders</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Recorded Gross Sales</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(revenueInRange)}</h3>
          <p className="text-xs text-slate-500 mt-1">Sum of order totals</p>
        </Card>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Volume Trend (2 Columns) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Qualifying Sales & Order Trend</CardTitle>
            <CardDescription>Order values aggregated across selected time horizon</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {trendData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No orders recorded in this time range.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4B5694" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4B5694" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'Gross Sales']}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4B5694"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Segment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segment Balance</CardTitle>
            <CardDescription>Distribution across lifecycle stages</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="segment" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigable Insights & Action Recommendations (FR-RET-04) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-indigo" />
            <CardTitle>Navigable Retention Opportunities</CardTitle>
          </div>
          <CardDescription>Click any actionable opportunity to inspect customers or execute targeted workflows</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                {segmentBreakdown.Inactive || 0} Inactive Customers
              </span>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                Customers who have not purchased in over 60 days. Immediate win-back potential.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/customers?segment=Inactive')}
              className="mt-4 border-amber-300 text-amber-900 bg-white hover:bg-amber-100 text-xs w-full"
            >
              Filter Inactive Customers <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
                {segmentBreakdown.Loyal || 0} Loyal VIP Customers
              </span>
              <p className="text-xs text-purple-900 mt-1 leading-relaxed">
                Top tier purchasers (5+ orders or $500+ spend). Prime candidates for early access perks.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/customers?segment=Loyal')}
              className="mt-4 border-purple-300 text-purple-900 bg-white hover:bg-purple-100 text-xs w-full"
            >
              View Loyal Customers <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                {segmentBreakdown.Repeat || 0} Repeat Buyers
              </span>
              <p className="text-xs text-blue-900 mt-1 leading-relaxed">
                Buyers building repeat purchasing habits. High cross-sell response rates.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/customers?segment=Repeat')}
              className="mt-4 border-blue-300 text-blue-900 bg-white hover:bg-blue-100 text-xs w-full"
            >
              View Repeat Buyers <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
