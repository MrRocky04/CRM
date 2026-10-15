import prisma from '../db/prisma.js';
import { recalculateCustomerMetrics } from './customer.service.js';

function getWooConfig() {
  const storeUrl = process.env.WOOCOMMERCE_STORE_URL?.replace(/\/+$/, '');
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  const isConfigured = Boolean(
    storeUrl &&
    consumerKey &&
    consumerSecret &&
    !consumerKey.includes('0123456789') &&
    storeUrl !== 'https://example.com'
  );

  return { storeUrl, consumerKey, consumerSecret, isConfigured };
}

export async function getSyncStatus() {
  const syncState = await prisma.syncState.findFirst({
    where: { syncType: 'WOOCOMMERCE_FULL' }
  });

  const { isConfigured, storeUrl } = getWooConfig();

  let details = null;
  if (syncState?.details) {
    try {
      details = JSON.parse(syncState.details);
    } catch {
      details = syncState.details;
    }
  }

  return {
    isConfigured,
    storeUrl: isConfigured ? storeUrl : null,
    status: syncState?.status || 'IDLE',
    lastSyncStartedAt: syncState?.lastSyncStartedAt || null,
    lastSyncCompletedAt: syncState?.lastSyncCompletedAt || null,
    recordsProcessed: syncState?.recordsProcessed || 0,
    errorsCount: syncState?.errorsCount || 0,
    lastError: syncState?.lastError || null,
    details
  };
}

export async function syncWooCommerceData() {
  const { storeUrl, consumerKey, consumerSecret, isConfigured } = getWooConfig();

  // Create or update sync state record
  let syncState = await prisma.syncState.upsert({
    where: { syncType: 'WOOCOMMERCE_FULL' },
    update: {
      status: 'IN_PROGRESS',
      lastSyncStartedAt: new Date(),
      lastError: null
    },
    create: {
      syncType: 'WOOCOMMERCE_FULL',
      status: 'IN_PROGRESS',
      lastSyncStartedAt: new Date()
    }
  });

  if (!isConfigured) {
    const errorMsg = 'WooCommerce credentials not configured or using default placeholders. Set WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET in .env.';
    await prisma.syncState.update({
      where: { syncType: 'WOOCOMMERCE_FULL' },
      data: {
        status: 'FAILED',
        lastError: errorMsg
      }
    });
    const err = new Error(errorMsg);
    err.statusCode = 400;
    throw err;
  }

  const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const requestHeaders = {
    Authorization: authHeader,
    'X-Forwarded-Proto': 'https'
  };
  let customersProcessed = 0;
  let ordersProcessed = 0;
  let errorsCount = 0;
  let lastError = null;

  try {
    // 1. Fetch & Upsert Customers (Paginated)
    let page = 1;
    let hasMoreCustomers = true;

    while (hasMoreCustomers && page <= 5) { // Safety ceiling of 5 pages (500 records) per run
      const response = await fetch(`${storeUrl}/wp-json/wc/v3/customers?page=${page}&per_page=100`, {
        headers: requestHeaders
      });

      if (!response.ok) {
        throw new Error(`WooCommerce API Error (Customers page ${page}): HTTP ${response.status} - ${response.statusText}`);
      }

      const customers = await response.json();
      if (!Array.isArray(customers) || customers.length === 0) {
        hasMoreCustomers = false;
        break;
      }

      for (const wcCust of customers) {
        try {
          const email = (wcCust.email || '').toLowerCase().trim();
          if (!email) continue;

          await prisma.customer.upsert({
            where: { woocommerceId: wcCust.id },
            update: {
              firstName: wcCust.first_name || 'Customer',
              lastName: wcCust.last_name || '',
              phone: wcCust.billing?.phone || null,
              billingAddress: JSON.stringify(wcCust.billing || {}),
              shippingAddress: JSON.stringify(wcCust.shipping || {}),
              avatarUrl: wcCust.avatar_url || null
            },
            create: {
              woocommerceId: wcCust.id,
              email,
              firstName: wcCust.first_name || 'Customer',
              lastName: wcCust.last_name || '',
              phone: wcCust.billing?.phone || null,
              source: 'WOOCOMMERCE',
              billingAddress: JSON.stringify(wcCust.billing || {}),
              shippingAddress: JSON.stringify(wcCust.shipping || {}),
              avatarUrl: wcCust.avatar_url || null
            }
          });
          customersProcessed++;
        } catch (e) {
          errorsCount++;
          lastError = e.message;
        }
      }

      page++;
    }

    // 2. Fetch & Upsert Orders (Paginated)
    page = 1;
    let hasMoreOrders = true;

    while (hasMoreOrders && page <= 5) {
      const response = await fetch(`${storeUrl}/wp-json/wc/v3/orders?page=${page}&per_page=100`, {
        headers: requestHeaders
      });

      if (!response.ok) {
        throw new Error(`WooCommerce API Error (Orders page ${page}): HTTP ${response.status} - ${response.statusText}`);
      }

      const orders = await response.json();
      if (!Array.isArray(orders) || orders.length === 0) {
        hasMoreOrders = false;
        break;
      }

      for (const wcOrder of orders) {
        try {
          let customer = null;
          // Cautious customer linking
          if (wcOrder.customer_id && wcOrder.customer_id > 0) {
            customer = await prisma.customer.findUnique({
              where: { woocommerceId: wcOrder.customer_id }
            });
          }
          if (!customer && wcOrder.billing?.email) {
            customer = await prisma.customer.findUnique({
              where: { email: wcOrder.billing.email.toLowerCase().trim() }
            });
          }

          const order = await prisma.order.upsert({
            where: { woocommerceId: wcOrder.id },
            update: {
              orderNumber: String(wcOrder.number || wcOrder.id),
              customerId: customer?.id || null,
              status: wcOrder.status || 'completed',
              total: parseFloat(wcOrder.total || 0),
              subtotal: parseFloat(wcOrder.subtotal || 0),
              taxTotal: parseFloat(wcOrder.total_tax || 0),
              shippingTotal: parseFloat(wcOrder.shipping_total || 0),
              discountTotal: parseFloat(wcOrder.discount_total || 0),
              currency: wcOrder.currency || 'USD',
              paymentMethod: wcOrder.payment_method || null,
              paymentMethodTitle: wcOrder.payment_method_title || null,
              dateCreated: new Date(wcOrder.date_created_gmt || wcOrder.date_created || Date.now()),
              dateModified: wcOrder.date_modified_gmt ? new Date(wcOrder.date_modified_gmt) : null,
              billingName: `${wcOrder.billing?.first_name || ''} ${wcOrder.billing?.last_name || ''}`.trim() || null,
              billingEmail: wcOrder.billing?.email || null,
              billingPhone: wcOrder.billing?.phone || null,
              billingAddress: JSON.stringify(wcOrder.billing || {}),
              shippingAddress: JSON.stringify(wcOrder.shipping || {}),
              customerNote: wcOrder.customer_note || null,
              isGuest: !customer
            },
            create: {
              woocommerceId: wcOrder.id,
              orderNumber: String(wcOrder.number || wcOrder.id),
              customerId: customer?.id || null,
              status: wcOrder.status || 'completed',
              total: parseFloat(wcOrder.total || 0),
              subtotal: parseFloat(wcOrder.subtotal || 0),
              taxTotal: parseFloat(wcOrder.total_tax || 0),
              shippingTotal: parseFloat(wcOrder.shipping_total || 0),
              discountTotal: parseFloat(wcOrder.discount_total || 0),
              currency: wcOrder.currency || 'USD',
              paymentMethod: wcOrder.payment_method || null,
              paymentMethodTitle: wcOrder.payment_method_title || null,
              dateCreated: new Date(wcOrder.date_created_gmt || wcOrder.date_created || Date.now()),
              dateModified: wcOrder.date_modified_gmt ? new Date(wcOrder.date_modified_gmt) : null,
              billingName: `${wcOrder.billing?.first_name || ''} ${wcOrder.billing?.last_name || ''}`.trim() || null,
              billingEmail: wcOrder.billing?.email || null,
              billingPhone: wcOrder.billing?.phone || null,
              billingAddress: JSON.stringify(wcOrder.billing || {}),
              shippingAddress: JSON.stringify(wcOrder.shipping || {}),
              customerNote: wcOrder.customer_note || null,
              isGuest: !customer
            }
          });

          // Sync line items
          if (Array.isArray(wcOrder.line_items)) {
            for (const item of wcOrder.line_items) {
              const existingItem = await prisma.orderItem.findFirst({
                where: { orderId: order.id, woocommerceId: item.id }
              });

              if (!existingItem) {
                await prisma.orderItem.create({
                  data: {
                    orderId: order.id,
                    woocommerceId: item.id,
                    name: item.name || 'Product',
                    productId: item.product_id || null,
                    variationId: item.variation_id || null,
                    quantity: item.quantity || 1,
                    price: parseFloat(item.price || 0),
                    subtotal: parseFloat(item.subtotal || 0),
                    total: parseFloat(item.total || 0),
                    sku: item.sku || null
                  }
                });
              }
            }
          }

          if (customer) {
            await recalculateCustomerMetrics(customer.id);
          }

          ordersProcessed++;
        } catch (e) {
          errorsCount++;
          lastError = e.message;
        }
      }

      page++;
    }

    const totalProcessed = customersProcessed + ordersProcessed;
    await prisma.syncState.update({
      where: { syncType: 'WOOCOMMERCE_FULL' },
      data: {
        status: errorsCount > 0 ? 'PARTIAL' : 'SUCCESS',
        lastSyncCompletedAt: new Date(),
        recordsProcessed: totalProcessed,
        errorsCount,
        lastError,
        details: JSON.stringify({ customersProcessed, ordersProcessed })
      }
    });

    return {
      success: true,
      customersProcessed,
      ordersProcessed,
      errorsCount,
      lastError
    };
  } catch (err) {
    await prisma.syncState.update({
      where: { syncType: 'WOOCOMMERCE_FULL' },
      data: {
        status: 'FAILED',
        lastError: err.message
      }
    });
    throw err;
  }
}
