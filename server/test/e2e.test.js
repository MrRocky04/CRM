import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://127.0.0.1:5000';

describe('WooCommerce CRM End-to-End API Integration Suite', () => {
  let sessionCookie = '';
  let csrfToken = '';
  let sampleCustomerId = '';

  it('1. GET /api/auth/csrf - establishes CSRF token and cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/csrf`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.csrfToken, 'CSRF token returned');
    csrfToken = data.csrfToken;

    const cookieHeader = res.headers.get('set-cookie');
    assert.ok(cookieHeader, 'Cookie should be set');
  });

  it('2. POST /api/auth/login - authenticates admin and establishes session', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        email: 'admin@crm.local',
        password: 'AdminPassword123!'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.email, 'admin@crm.local');
    assert.strictEqual(data.user.role, 'ADMIN');

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Session cookie set');
    // Extract crm_session cookie
    const match = setCookie.match(/crm_session=([^;]+)/);
    assert.ok(match, 'crm_session token found in cookie');
    sessionCookie = `crm_session=${match[1]}; crm_csrf_token=${csrfToken}`;
  });

  it('3. GET /api/customers - lists customers and validates segments', async () => {
    const res = await fetch(`${BASE_URL}/api/customers?limit=100`, {
      headers: {
        Cookie: sessionCookie
      }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.customers));
    assert.ok(data.customers.length >= 4, 'Seed data customers present');

    const sophia = data.customers.find(c => c.email === 'sophia.vance@example.com');
    assert.ok(sophia, 'Sophia Vance exists');
    assert.strictEqual(sophia.segment, 'Loyal');
    sampleCustomerId = sophia.id;

    const marcus = data.customers.find(c => c.email === 'marcus.brody@example.com');
    assert.ok(marcus, 'Marcus Brody exists');
    assert.strictEqual(marcus.segment, 'Inactive');
  });

  it('4. POST /api/notes/customer/:id - creates customer interaction note', async () => {
    const res = await fetch(`${BASE_URL}/api/notes/customer/${sampleCustomerId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: sessionCookie
      },
      body: JSON.stringify({
        content: 'E2E automated test customer verification note.'
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.note.id);
    assert.strictEqual(data.note.content, 'E2E automated test customer verification note.');
  });

  it('5. POST /api/tasks - schedules follow-up task', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: sessionCookie
      },
      body: JSON.stringify({
        title: 'E2E Verification Task: Review satisfaction',
        customerId: sampleCustomerId,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.task.id);
    assert.strictEqual(data.task.priority, 'HIGH');
  });

  it('6. GET /api/orders - returns read-only WooCommerce order records', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Cookie: sessionCookie }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.orders));
    assert.ok(data.orders.length > 0);

    const order5001 = data.orders.find(o => o.orderNumber === '5001');
    assert.ok(order5001, 'Order 5001 exists');
    assert.strictEqual(order5001.status, 'completed');
  });

  it('7. POST /api/communications/preview - renders template with {{name}} and {{email}} placeholders', async () => {
    const res = await fetch(`${BASE_URL}/api/communications/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: sessionCookie
      },
      body: JSON.stringify({
        customerId: sampleCustomerId,
        subject: 'Hello {{name}}, welcome!',
        body: 'Dear {{name}},\n\nYour account at {{email}} is active!'
      })
    });

    assert.strictEqual(res.status, 200);
    const preview = await res.json();
    assert.strictEqual(preview.subject, 'Hello Sophia Vance, welcome!');
    assert.ok(preview.body.includes('sophia.vance@example.com'));
  });

  it('8. POST /api/communications/send - explicitly approved communication dispatch', async () => {
    const res = await fetch(`${BASE_URL}/api/communications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: sessionCookie
      },
      body: JSON.stringify({
        customerId: sampleCustomerId,
        recipientEmail: 'sophia.vance@example.com',
        recipientName: 'Sophia Vance',
        subject: 'Approved E2E Dispatch',
        body: 'This message was explicitly reviewed and confirmed.'
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.communication.status, 'ACCEPTED');
    assert.ok(data.communication.providerMessageId);
  });

  it('9. GET /api/agent/recommendations - verifies evidence citation and facts vs inferences', async () => {
    const res = await fetch(`${BASE_URL}/api/agent/recommendations`, {
      headers: { Cookie: sessionCookie }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.engineInfo.mode, 'DETERMINISTIC_RULES_ENGINE');
    assert.ok(Array.isArray(data.recommendations));
    assert.ok(data.recommendations.length > 0);

    const rec = data.recommendations[0];
    assert.ok(Array.isArray(rec.facts));
    assert.ok(rec.inference);
    assert.ok(rec.prefillTask);
  });

  it('10. GET /api/analytics/retention - calculates retention cohorts and sales trends', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics/retention?timeRange=90d`, {
      headers: { Cookie: sessionCookie }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.trendData);
    assert.ok(data.segmentBreakdown);
    assert.ok(data.disclosures.revenueType);
  });
});
