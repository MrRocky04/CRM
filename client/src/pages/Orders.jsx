import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogFooter } from '../components/ui/Dialog';
import { EmptyState } from '../components/common/EmptyState';
import {
  ShoppingBag,
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  Calendar,
  CreditCard
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../lib/utils';

export function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Selected order for detail modal (FR-ORD-03)
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'ALL';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sortBy') || 'dateCreated';
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

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await api.getOrders({
        search,
        status,
        page,
        limit: 10,
        sortBy,
        sortOrder
      });
      setOrders(res.orders);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [search, status, page, sortBy, sortOrder]);

  function updateQuery(newParams) {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '' || v === 'ALL') {
        updated.delete(k);
      } else {
        updated.set(k, v);
      }
    });
    if (!newParams.page) updated.set('page', '1');
    setSearchParams(updated);
  }

  async function handleViewDetail(order) {
    try {
      const fullOrder = await api.getOrder(order.id);
      setSelectedOrder(fullOrder);
      setIsDetailOpen(true);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">WooCommerce Orders</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Synchronized store order history, status tracking, and line item details.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-brand-indigo shrink-0" />
          <span>Commerce Authority: Orders are read-only in CRM</span>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order #, customer name, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <Select
            value={status}
            onChange={(e) => updateQuery({ status: e.target.value })}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'completed', label: 'Completed' },
              { value: 'processing', label: 'Processing' },
              { value: 'on-hold', label: 'On Hold' },
              { value: 'pending', label: 'Pending Payment' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'refunded', label: 'Refunded' },
              { value: 'failed', label: 'Failed' }
            ]}
          />

          <Select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-');
              updateQuery({ sortBy: sb, sortOrder: so });
            }}
            options={[
              { value: 'dateCreated-desc', label: 'Newest Orders' },
              { value: 'dateCreated-asc', label: 'Oldest Orders' },
              { value: 'total-desc', label: 'Highest Total' },
              { value: 'total-asc', label: 'Lowest Total' }
            ]}
          />
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items Summary</TableHead>
              <TableHead className="text-right">Total</TableHead>
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
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8">
                  <EmptyState
                    icon={ShoppingBag}
                    title="No orders found"
                    description="No WooCommerce orders match your current filters."
                    actionText="Reset Filters"
                    onAction={() => setSearchParams({})}
                  />
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => {
                const st = getStatusBadge(o.status);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-bold text-slate-900 text-xs">
                      #{o.orderNumber}
                    </TableCell>

                    <TableCell className="text-xs">
                      {o.customer ? (
                        <Link
                          to={`/customers/${o.customer.id}`}
                          className="font-semibold text-brand-indigo hover:underline flex items-center gap-1"
                        >
                          {o.customer.firstName} {o.customer.lastName}
                        </Link>
                      ) : o.billingName ? (
                        <span className="text-slate-700">{o.billingName} (Guest)</span>
                      ) : (
                        <span className="text-slate-400 italic">Guest Checkout</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      {formatDate(o.dateCreated, 'MMM d, yyyy, h:mm a')}
                    </TableCell>

                    <TableCell>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${st.className}`}>
                        {o.status}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                      {o.items?.map((it) => `${it.name} (x${it.quantity})`).join(', ') || '—'}
                    </TableCell>

                    <TableCell className="text-right font-bold text-slate-900 text-xs">
                      {formatCurrency(o.total, o.currency)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(o)}
                        className="text-xs text-slate-600 hover:text-brand-indigo"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
          <div>
            Showing <strong>{orders.length}</strong> of <strong>{pagination.total}</strong> orders
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

      {/* Order Detail Modal (FR-ORD-03, FR-ORD-04) */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Order Details #${selectedOrder?.orderNumber}`}
        description="Synchronized WooCommerce Commerce Record (Read-Only)"
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-5 text-xs text-slate-700">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <span className="font-semibold text-slate-900 capitalize">{selectedOrder.status}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                <span className="font-semibold text-slate-900">{formatDate(selectedOrder.dateCreated)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</span>
                <span className="font-semibold text-slate-900">{selectedOrder.paymentMethodTitle || 'Standard'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Currency</span>
                <span className="font-semibold text-slate-900">{selectedOrder.currency}</span>
              </div>
            </div>

            {/* Customer linking */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Customer Association</span>
                {selectedOrder.customer ? (
                  <Link
                    to={`/customers/${selectedOrder.customer.id}`}
                    className="font-bold text-brand-indigo hover:underline flex items-center gap-1 mt-0.5"
                  >
                    {selectedOrder.customer.firstName} {selectedOrder.customer.lastName} ({selectedOrder.customer.email})
                  </Link>
                ) : (
                  <span className="font-medium text-slate-800">
                    {selectedOrder.billingName || 'Guest User'} ({selectedOrder.billingEmail || 'No email'})
                  </span>
                )}
              </div>
              <Badge variant={selectedOrder.isGuest ? 'default' : 'success'}>
                {selectedOrder.isGuest ? 'Guest Checkout' : 'Registered Customer'}
              </Badge>
            </div>

            {/* Line Items */}
            <div>
              <h5 className="font-semibold text-slate-900 mb-2">Order Line Items</h5>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-medium text-slate-800">{item.name}</td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.price, selectedOrder.currency)}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-900">
                          {formatCurrency(item.total, selectedOrder.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrder.subtotal, selectedOrder.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax Total:</span>
                <span>{formatCurrency(selectedOrder.taxTotal, selectedOrder.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping Total:</span>
                <span>{formatCurrency(selectedOrder.shippingTotal, selectedOrder.currency)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>{formatCurrency(selectedOrder.total, selectedOrder.currency)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
