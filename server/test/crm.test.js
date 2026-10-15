import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/db/prisma.js';
import * as authService from '../src/services/auth.service.js';
import * as customerService from '../src/services/customer.service.js';
import * as orderService from '../src/services/order.service.js';
import * as templateService from '../src/services/template.service.js';
import * as agentService from '../src/services/agent.service.js';
import * as workflowService from '../src/services/workflow.service.js';
import { verifyWooCommerceSignature } from '../src/services/webhook.service.js';
import { validateTemplatePlaceholders } from '../src/validators/index.js';
import { calculateCustomerSegment } from '../src/services/segmentation.service.js';
import crypto from 'crypto';

describe('WooCommerce CRM Backend Tests', () => {
  before(async () => {
    // Ensure test admin exists
    await authService.provisionAdmin('testadmin@crm.local', 'Password123!', 'Test Admin');
  });

  after(async () => {
    await prisma.$disconnect();
  });

  describe('1. Authentication & Session Management', () => {
    it('should authenticate admin with valid credentials and return a session token', async () => {
      const result = await authService.login('testadmin@crm.local', 'Password123!');
      assert.ok(result.token, 'Session token should be generated');
      assert.strictEqual(result.user.email, 'testadmin@crm.local');
      assert.strictEqual(result.user.role, 'ADMIN');

      // Verify token in DB
      const session = await prisma.session.findUnique({ where: { token: result.token } });
      assert.ok(session, 'Session record must exist in DB');

      // Logout
      await authService.logout(result.token);
      const afterLogout = await prisma.session.findUnique({ where: { token: result.token } });
      assert.strictEqual(afterLogout, null, 'Session should be removed on logout');
    });

    it('should reject invalid password', async () => {
      await assert.rejects(
        async () => {
          await authService.login('testadmin@crm.local', 'WrongPassword!');
        },
        { message: 'Invalid email or password.' }
      );
    });
  });

  describe('2. Customer Segmentation Engine & Precedence (FR-RET-01)', () => {
    it('should classify as Inactive if last order is older than 60 days', () => {
      const now = Date.now();
      const seg = calculateCustomerSegment({
        orderCount: 5,
        totalSpent: 800,
        lastOrderDate: new Date(now - 75 * 24 * 60 * 60 * 1000)
      });
      assert.strictEqual(seg, 'Inactive');
    });

    it('should classify as Loyal if orderCount >= 5 and recently active', () => {
      const now = Date.now();
      const seg = calculateCustomerSegment({
        orderCount: 5,
        totalSpent: 450,
        lastOrderDate: new Date(now - 10 * 24 * 60 * 60 * 1000)
      });
      assert.strictEqual(seg, 'Loyal');
    });

    it('should classify as Repeat if orderCount >= 2 and < 5', () => {
      const now = Date.now();
      const seg = calculateCustomerSegment({
        orderCount: 3,
        totalSpent: 150,
        lastOrderDate: new Date(now - 15 * 24 * 60 * 60 * 1000)
      });
      assert.strictEqual(seg, 'Repeat');
    });

    it('should default to New if orderCount <= 1', () => {
      const now = Date.now();
      const seg = calculateCustomerSegment({
        orderCount: 1,
        totalSpent: 50,
        lastOrderDate: new Date(now - 2 * 24 * 60 * 60 * 1000)
      });
      assert.strictEqual(seg, 'New');
    });
  });

  describe('3. Template Placeholders Validation (FR-COM-03)', () => {
    it('should accept supported placeholders {{name}} and {{email}}', () => {
      const valid = validateTemplatePlaceholders('Hello {{name}}, we sent updates to {{email}}.');
      assert.strictEqual(valid.isValid, true);
      assert.strictEqual(valid.invalidPlaceholders.length, 0);
    });

    it('should reject unsupported placeholders like {{phone}} or {{discount_code}}', () => {
      const invalid = validateTemplatePlaceholders('Hello {{name}}, your code is {{discount_code}}.');
      assert.strictEqual(invalid.isValid, false);
      assert.deepStrictEqual(invalid.invalidPlaceholders, ['{{discount_code}}']);
    });
  });

  describe('4. Order Read-Only Authority & Querying (FR-ORD-01 to 04)', () => {
    it('should list persisted orders with pagination and total count', async () => {
      const res = await orderService.getOrders({ page: 1, limit: 10 });
      assert.ok(Array.isArray(res.orders));
      assert.ok(res.pagination.total >= 0);
    });

    it('should fetch order detail with line items', async () => {
      const orders = await prisma.order.findMany({ take: 1 });
      if (orders.length > 0) {
        const order = await orderService.getOrderById(orders[0].id);
        assert.ok(order.id);
        assert.ok(Array.isArray(order.items));
      }
    });
  });

  describe('5. Webhook Signature Verification & Idempotency (FR-SYNC-03)', () => {
    it('should correctly verify HMAC SHA-256 signatures for WooCommerce', () => {
      const secret = 'my_test_secret';
      const rawBody = Buffer.from('{"id":123,"status":"completed"}');
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');

      const isValid = verifyWooCommerceSignature(rawBody, signature, secret);
      assert.strictEqual(isValid, true);

      const isInvalid = verifyWooCommerceSignature(rawBody, 'tampered_signature', secret);
      assert.strictEqual(isInvalid, false);
    });
  });

  describe('6. Action Agent Evidence Grounding (FR-AGT-01 to 04)', () => {
    it('should produce evidence-based recommendations citing facts vs inferences without unconfigured AI', async () => {
      const result = await agentService.getStoreRecommendations();
      assert.strictEqual(result.engineInfo.mode, 'DETERMINISTIC_RULES_ENGINE');
      assert.ok(Array.isArray(result.recommendations));

      if (result.recommendations.length > 0) {
        const rec = result.recommendations[0];
        assert.ok(Array.isArray(rec.facts), 'Must cite facts array');
        assert.ok(rec.inference, 'Must clearly state rule-based inference');
      }
    });
  });

  describe('7. Workflow Engine & Duplicate Prevention (FR-WF-01 to 05)', () => {
    it('should execute workflow and safely skip duplicate runs on repeated calls', async () => {
      const workflows = await workflowService.getWorkflows();
      const inactiveWf = workflows.find(w => w.triggerType === 'INACTIVE_CUSTOMER');

      if (inactiveWf) {
        // Run 1
        const run1 = await workflowService.executeWorkflow(inactiveWf.id);
        assert.ok(run1);

        // Run 2 immediately after: duplicate actions should be safely skipped
        const run2 = await workflowService.executeWorkflow(inactiveWf.id);
        assert.strictEqual(run2.processedCount, 0, 'Second run should not re-execute already processed actions');
        assert.ok(run2.skippedCount >= 0);
      }
    });
  });
});
