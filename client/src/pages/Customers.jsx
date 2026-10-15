import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogFooter } from '../components/ui/Dialog';
import { EmptyState } from '../components/common/EmptyState';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatDate, getSegmentBadge } from '../lib/utils';

export function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters state from URL params
  const search = searchParams.get('search') || '';
  const segment = searchParams.get('segment') || 'ALL';
  const source = searchParams.get('source') || 'ALL';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Debounced local search input for instantaneous typing
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateQuery({ search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Modal for creating CRM-only contact (FR-CUS-03)
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('action') === 'new');
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    billingAddress: '',
    shippingAddress: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  async function loadCustomers() {
    try {
      setLoading(true);
      const res = await api.getCustomers({
        search,
        segment,
        source,
        page,
        limit: 10,
        sortBy,
        sortOrder
      });
      setCustomers(res.customers);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [search, segment, source, page, sortBy, sortOrder]);

  function updateQuery(newParams) {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '' || v === 'ALL') {
        updated.delete(k);
      } else {
        updated.set(k, v);
      }
    });
    // Reset to page 1 on filter changes unless changing page directly
    if (!newParams.page) {
      updated.set('page', '1');
    }
    setSearchParams(updated);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      await api.createCustomer(newCustomer);
      setIsCreateOpen(false);
      setNewCustomer({ firstName: '', lastName: '', email: '', phone: '', billingAddress: '', shippingAddress: '' });
      loadCustomers();
    } catch (err) {
      setCreateError(err.message || 'Failed to create customer');
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Customer Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Discover, segment, and maintain synchronized commerce profiles and CRM records.
          </p>
        </div>
        <Button
          variant="indigo"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add CRM Contact</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Segment Filter */}
          <Select
            value={segment}
            onChange={(e) => updateQuery({ segment: e.target.value })}
            options={[
              { value: 'ALL', label: 'All Segments' },
              { value: 'New', label: 'Segment: New' },
              { value: 'Repeat', label: 'Segment: Repeat' },
              { value: 'Loyal', label: 'Segment: Loyal VIP' },
              { value: 'Inactive', label: 'Segment: Inactive (60d+)' }
            ]}
          />

          {/* Source Filter */}
          <Select
            value={source}
            onChange={(e) => updateQuery({ source: e.target.value })}
            options={[
              { value: 'ALL', label: 'All Sources' },
              { value: 'WOOCOMMERCE', label: 'Source: WooCommerce Store' },
              { value: 'CRM', label: 'Source: CRM Direct' }
            ]}
          />

          {/* Sort By */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-');
              updateQuery({ sortBy: sb, sortOrder: so });
            }}
            options={[
              { value: 'createdAt-desc', label: 'Newest Added' },
              { value: 'totalSpent-desc', label: 'Highest Spend' },
              { value: 'orderCount-desc', label: 'Most Orders' },
              { value: 'lastOrderDate-desc', label: 'Recent Purchase' }
            ]}
          />
        </div>
      </Card>

      {/* Customer Data Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-4 text-center">
                    <div className="h-5 bg-slate-100 rounded animate-pulse max-w-md mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8">
                  <EmptyState
                    icon={Users}
                    title="No customers match your filters"
                    description="Try clearing your search terms or selecting 'All Segments'."
                    actionText="Clear Filters"
                    onAction={() => setSearchParams({})}
                  />
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => {
                const seg = getSegmentBadge(c.segment);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        to={`/customers/${c.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-indigo transition-colors flex items-center gap-1.5"
                      >
                        <span>{c.firstName} {c.lastName}</span>
                        {c.woocommerceId && (
                          <span className="text-[10px] text-slate-400 font-mono" title={`WooCommerce ID: ${c.woocommerceId}`}>
                            #{c.woocommerceId}
                          </span>
                        )}
                      </Link>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        Added {formatDate(c.createdAt, 'MMM d, yyyy')}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs">
                      <p className="font-medium text-slate-700">{c.email}</p>
                      {c.phone && <p className="text-slate-400 mt-0.5">{c.phone}</p>}
                    </TableCell>

                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${seg.className}`}>
                        {seg.label}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge variant={c.source === 'WOOCOMMERCE' ? 'info' : 'default'}>
                        {c.source === 'WOOCOMMERCE' ? 'Store Sync' : 'CRM Contact'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center font-semibold text-slate-900 text-xs">
                      {c.orderCount}
                    </TableCell>

                    <TableCell className="text-right font-bold text-slate-900 text-xs">
                      {formatCurrency(c.totalSpent)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        to={`/customers/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-indigo hover:text-indigo-800 transition-colors"
                      >
                        Profile <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
          <div>
            Showing <strong>{customers.length}</strong> of <strong>{pagination.total}</strong> customers
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateQuery({ page: page - 1 })}
              className="text-xs h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <span className="px-2 font-medium">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => updateQuery({ page: page + 1 })}
              className="text-xs h-8 px-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Dialog for Creating CRM Contact (FR-CUS-03) */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New CRM Customer"
        description="Create a CRM-managed contact profile. This contact will be stored in your Supabase CRM database."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={newCustomer.firstName}
              onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
              placeholder="e.g. Eleanor"
              required
            />
            <Input
              label="Last Name"
              value={newCustomer.lastName}
              onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
              placeholder="e.g. Vance"
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            placeholder="eleanor@example.com"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />

          <Input
            label="Billing Address"
            value={newCustomer.billingAddress}
            onChange={(e) => setNewCustomer({ ...newCustomer, billingAddress: e.target.value })}
            placeholder="123 Market St, Suite 400, San Francisco, CA"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={createLoading}
            >
              Save Contact
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
