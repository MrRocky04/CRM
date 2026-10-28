import bcrypt from 'bcryptjs';
import prisma from '../src/db/prisma.js';

async function main() {
  console.log('Seeding Merqanta Commerce CRM Database...');

  // 1. Users
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const agentPasswordHash = await bcrypt.hash('AgentPassword123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: { passwordHash: adminPasswordHash, role: 'ADMIN', name: 'Sarah Connor (Admin)' },
    create: {
      email: 'admin@crm.local',
      name: 'Sarah Connor (Admin)',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    }
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@crm.local' },
    update: { passwordHash: agentPasswordHash, role: 'USER', name: 'Alex Rivera (Agent)' },
    create: {
      email: 'agent@crm.local',
      name: 'Alex Rivera (Agent)',
      passwordHash: agentPasswordHash,
      role: 'USER'
    }
  });

  // Also provision environment admin if specified
  const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@crm.local';
  const envAdminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const envAdminName = process.env.ADMIN_NAME || 'CRM Administrator';
  const envAdminHash = await bcrypt.hash(envAdminPassword, 10);

  await prisma.user.upsert({
    where: { email: envAdminEmail },
    update: { passwordHash: envAdminHash, role: 'ADMIN', name: envAdminName },
    create: {
      email: envAdminEmail,
      name: envAdminName,
      passwordHash: envAdminHash,
      role: 'ADMIN'
    }
  });

  console.log('✓ Users created');

  // 2. Email Templates
  const templates = [
    {
      id: 'template_welcome',
      name: 'Welcome New Customer',
      category: 'WELCOME',
      subject: 'Welcome to Merqanta Store, {{name}}!',
      body: 'Dear {{name}},\n\nThank you for choosing us for your recent order! Your account with {{email}} is now active.\n\nIf you have any questions about your delivery or need recommendations, our support team is just a reply away.\n\nWarm regards,\nThe Merqanta Customer Success Team',
      description: 'Sent to first-time shoppers after their initial completed order.'
    },
    {
      id: 'template_retention',
      name: 'VIP Loyalty Appreciation',
      category: 'RETENTION',
      subject: 'Exclusive VIP Perk for {{name}}',
      body: 'Hello {{name}},\n\nBecause you are one of our most valued VIP customers, we have unlocked early access to our private collection for your account ({{email}}).\n\nThank you for trusting our quality and craft.\n\nBest wishes,\nMerqanta Leadership',
      description: 'Appreciation email for customers in the Loyal segment.'
    },
    {
      id: 'template_winback',
      name: 'Win-Back Inactive Customer',
      category: 'RETENTION',
      subject: 'We miss you at Merqanta, {{name}}',
      body: 'Hi {{name}},\n\nIt has been a little while since your last order with us. We have introduced several new collections we think you will love!\n\nAs a welcome-back gift, use code WELCOMEBACK for complimentary express shipping on your next order with {{email}}.\n\nWarm regards,\nThe Merqanta Team',
      description: 'Re-engagement message for customers in the Inactive segment.'
    },
    {
      id: 'template_followup',
      name: 'Post-Purchase Satisfaction Check-in',
      category: 'FOLLOW_UP',
      subject: 'How is your new purchase, {{name}}?',
      body: 'Hello {{name}},\n\nWe wanted to verify that your recent delivery arrived in pristine condition and that you are enjoying your purchase!\n\nPlease reply directly to this email at {{email}} if you have any feedback or requests.\n\nThank you,\nMerqanta Customer Care',
      description: 'Follow-up inquiry sent after delivery.'
    }
  ];

  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { id: t.id },
      update: t,
      create: t
    });
  }

  console.log('✓ Email templates created');

  // 3. Clean old demo records for fresh seeding
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.customer.deleteMany();
  console.log('✓ Cleared previous demo records');

  // 4. Customers
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const rawCustomers = [
    // --- LOYAL SEGMENT ---
    {
      woocommerceId: 101,
      email: 'sophia.vance@example.com',
      firstName: 'Sophia',
      lastName: 'Vance',
      phone: '+1 (555) 234-5678',
      source: 'WOOCOMMERCE',
      segment: 'Loyal',
      orderCount: 6,
      totalSpent: 945.50,
      lastOrderDate: new Date(now - 12 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Sophia', last_name: 'Vance', address_1: '742 Evergreen Terrace',
        city: 'Springfield', state: 'OR', postcode: '97477', country: 'US'
      }),
      shippingAddress: JSON.stringify({
        first_name: 'Sophia', last_name: 'Vance', address_1: '742 Evergreen Terrace',
        city: 'Springfield', state: 'OR', postcode: '97477', country: 'US'
      })
    },
    {
      woocommerceId: 102,
      email: 'alexander.wright@example.com',
      firstName: 'Alexander',
      lastName: 'Wright',
      phone: '+1 (555) 341-9988',
      source: 'WOOCOMMERCE',
      segment: 'Loyal',
      orderCount: 8,
      totalSpent: 1420.00,
      lastOrderDate: new Date(now - 6 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Alexander', last_name: 'Wright', address_1: '500 Madison Ave',
        city: 'New York', state: 'NY', postcode: '10022', country: 'US'
      })
    },
    {
      woocommerceId: 103,
      email: 'elena.rostova@example.com',
      firstName: 'Elena',
      lastName: 'Rostova',
      phone: '+1 (555) 789-1234',
      source: 'WOOCOMMERCE',
      segment: 'Loyal',
      orderCount: 5,
      totalSpent: 1150.00,
      lastOrderDate: new Date(now - 18 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Elena', last_name: 'Rostova', address_1: '1440 Lakeshore Dr',
        city: 'Chicago', state: 'IL', postcode: '60611', country: 'US'
      })
    },
    {
      woocommerceId: 104,
      email: 'marcus.vance@example.com',
      firstName: 'Marcus',
      lastName: 'Vance',
      phone: '+1 (555) 667-8901',
      source: 'WOOCOMMERCE',
      segment: 'Loyal',
      orderCount: 5,
      totalSpent: 890.00,
      lastOrderDate: new Date(now - 14 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Marcus', last_name: 'Vance', address_1: '890 Peachtree St',
        city: 'Atlanta', state: 'GA', postcode: '30309', country: 'US'
      })
    },

    // --- REPEAT SEGMENT ---
    {
      woocommerceId: 105,
      email: 'liam.chen@example.com',
      firstName: 'Liam',
      lastName: 'Chen',
      phone: '+1 (555) 345-6789',
      source: 'WOOCOMMERCE',
      segment: 'Repeat',
      orderCount: 3,
      totalSpent: 285.00,
      lastOrderDate: new Date(now - 22 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Liam', last_name: 'Chen', address_1: '450 Mission St',
        city: 'San Francisco', state: 'CA', postcode: '94105', country: 'US'
      })
    },
    {
      woocommerceId: 106,
      email: 'priya.patel@example.com',
      firstName: 'Priya',
      lastName: 'Patel',
      phone: '+1 (555) 456-7890',
      source: 'WOOCOMMERCE',
      segment: 'Repeat',
      orderCount: 3,
      totalSpent: 340.00,
      lastOrderDate: new Date(now - 16 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Priya', last_name: 'Patel', address_1: '2100 Ross Ave',
        city: 'Dallas', state: 'TX', postcode: '75201', country: 'US'
      })
    },
    {
      woocommerceId: 107,
      email: 'carlos.rodriguez@example.com',
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      phone: '+1 (555) 567-8901',
      source: 'WOOCOMMERCE',
      segment: 'Repeat',
      orderCount: 4,
      totalSpent: 480.00,
      lastOrderDate: new Date(now - 28 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Carlos', last_name: 'Rodriguez', address_1: '701 Brickell Ave',
        city: 'Miami', state: 'FL', postcode: '33131', country: 'US'
      })
    },
    {
      woocommerceId: 108,
      email: 'olivia.kim@example.com',
      firstName: 'Olivia',
      lastName: 'Kim',
      phone: '+1 (555) 678-9012',
      source: 'WOOCOMMERCE',
      segment: 'Repeat',
      orderCount: 2,
      totalSpent: 210.00,
      lastOrderDate: new Date(now - 20 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Olivia', last_name: 'Kim', address_1: '1201 3rd Ave',
        city: 'Seattle', state: 'WA', postcode: '98101', country: 'US'
      })
    },

    // --- NEW SEGMENT ---
    {
      woocommerceId: 109,
      email: 'emma.watson@example.com',
      firstName: 'Emma',
      lastName: 'Watson',
      phone: '+1 (555) 901-2345',
      source: 'WOOCOMMERCE',
      segment: 'New',
      orderCount: 1,
      totalSpent: 65.00,
      lastOrderDate: new Date(now - 3 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Emma', last_name: 'Watson', address_1: '88 High Street',
        city: 'Oxford', country: 'GB'
      })
    },
    {
      woocommerceId: 110,
      email: 'noah.tanaka@example.com',
      firstName: 'Noah',
      lastName: 'Tanaka',
      phone: '+1 (555) 890-1234',
      source: 'WOOCOMMERCE',
      segment: 'New',
      orderCount: 1,
      totalSpent: 175.00,
      lastOrderDate: new Date(now - 2 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Noah', last_name: 'Tanaka', address_1: '2-11-3 Shibuya',
        city: 'Tokyo', country: 'JP'
      })
    },
    {
      woocommerceId: 111,
      email: 'chloe.bennett@example.com',
      firstName: 'Chloe',
      lastName: 'Bennett',
      phone: '+1 (555) 234-8901',
      source: 'WOOCOMMERCE',
      segment: 'New',
      orderCount: 1,
      totalSpent: 89.00,
      lastOrderDate: new Date(now - 7 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Chloe', last_name: 'Bennett', address_1: '100 Queen St W',
        city: 'Toronto', state: 'ON', country: 'CA'
      })
    },
    {
      woocommerceId: 112,
      email: 'aris.thorne@example.com',
      firstName: 'Dr. Aris',
      lastName: 'Thorne',
      phone: '+1 (555) 432-1098',
      source: 'CRM',
      segment: 'New',
      orderCount: 0,
      totalSpent: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Dr. Aris', last_name: 'Thorne', address_1: '300 Research Parkway',
        city: 'Seattle', state: 'WA', postcode: '98101', country: 'US'
      })
    },

    // --- INACTIVE SEGMENT ---
    {
      woocommerceId: 113,
      email: 'marcus.brody@example.com',
      firstName: 'Marcus',
      lastName: 'Brody',
      phone: '+1 (555) 876-5432',
      source: 'WOOCOMMERCE',
      segment: 'Inactive',
      orderCount: 4,
      totalSpent: 620.00,
      lastOrderDate: new Date(now - 82 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Marcus', last_name: 'Brody', address_1: '12 Museum Square',
        city: 'Boston', state: 'MA', postcode: '02115', country: 'US'
      })
    },
    {
      woocommerceId: 114,
      email: 'isabella.rossi@example.com',
      firstName: 'Isabella',
      lastName: 'Rossi',
      phone: '+1 (555) 912-3456',
      source: 'WOOCOMMERCE',
      segment: 'Inactive',
      orderCount: 3,
      totalSpent: 540.00,
      lastOrderDate: new Date(now - 75 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Isabella', last_name: 'Rossi', address_1: 'Via Montenapoleone 8',
        city: 'Milan', country: 'IT'
      })
    },
    {
      woocommerceId: 115,
      email: 'jamal.washington@example.com',
      firstName: 'Jamal',
      lastName: 'Washington',
      phone: '+1 (555) 321-6549',
      source: 'WOOCOMMERCE',
      segment: 'Inactive',
      orderCount: 2,
      totalSpent: 310.00,
      lastOrderDate: new Date(now - 95 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Jamal', last_name: 'Washington', address_1: '1600 Pennsylvania Ave',
        city: 'Washington', state: 'DC', postcode: '20500', country: 'US'
      })
    },
    {
      woocommerceId: 116,
      email: 'harper.lee@example.com',
      firstName: 'Harper',
      lastName: 'Lee',
      phone: '+1 (555) 654-9870',
      source: 'WOOCOMMERCE',
      segment: 'Inactive',
      orderCount: 2,
      totalSpent: 190.00,
      lastOrderDate: new Date(now - 110 * day),
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      billingAddress: JSON.stringify({
        first_name: 'Harper', last_name: 'Lee', address_1: '101 Mockingbird Ln',
        city: 'Monroeville', state: 'AL', postcode: '36460', country: 'US'
      })
    }
  ];

  const createdCustomers = {};

  for (const c of rawCustomers) {
    const cust = await prisma.customer.upsert({
      where: { email: c.email },
      update: c,
      create: c
    });
    createdCustomers[c.email] = cust;
  }

  console.log(`✓ 16 Customers created across all 4 segments (Loyal, Repeat, New, Inactive)`);

  // 4. Orders with Line Items (30+ realistic commerce orders over last 6 months)
  const ordersSeedList = [
    // Sophia Vance (Cust 101, Loyal)
    {
      woocommerceId: 5001,
      orderNumber: 'ORD-5001',
      customerEmail: 'sophia.vance@example.com',
      status: 'completed',
      total: 210.00, subtotal: 195.00, taxTotal: 15.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 12 * day),
      items: [
        { name: 'Ergonomic Desk Mat - Navy Edition', quantity: 1, price: 45.00, total: 45.00, sku: 'MAT-NVY-01' },
        { name: 'Keychron Custom Switch Sampler (64 Switches)', quantity: 1, price: 150.00, total: 150.00, sku: 'SW-SAMP-64' }
      ]
    },
    {
      woocommerceId: 5002,
      orderNumber: 'ORD-5002',
      customerEmail: 'sophia.vance@example.com',
      status: 'completed',
      total: 340.50, subtotal: 310.00, taxTotal: 30.50, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Apple Pay',
      dateCreated: new Date(now - 45 * day),
      items: [
        { name: 'Studio Monitor Arm Dual Gas-Spring', quantity: 1, price: 310.00, total: 310.00, sku: 'ARM-DUAL-PRO' }
      ]
    },
    {
      woocommerceId: 5003,
      orderNumber: 'ORD-5003',
      customerEmail: 'sophia.vance@example.com',
      status: 'completed',
      total: 165.00, subtotal: 150.00, taxTotal: 15.00, shippingTotal: 0,
      paymentMethod: 'paypal', paymentMethodTitle: 'PayPal Express',
      dateCreated: new Date(now - 90 * day),
      items: [
        { name: 'Artisan Walnut Wood Wrist Rest (TKL)', quantity: 2, price: 75.00, total: 150.00, sku: 'REST-WLT-TKL' }
      ]
    },

    // Alexander Wright (Cust 102, Loyal)
    {
      woocommerceId: 5004,
      orderNumber: 'ORD-5004',
      customerEmail: 'alexander.wright@example.com',
      status: 'completed',
      total: 480.00, subtotal: 440.00, taxTotal: 40.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 6 * day),
      items: [
        { name: 'Ultra-Wide Desk Light Bar with Wireless Dial', quantity: 2, price: 140.00, total: 280.00, sku: 'LGT-BAR-PRO' },
        { name: 'Noise-Cancelling Leather Headphone Stand', quantity: 1, price: 160.00, total: 160.00, sku: 'STD-HPHONE-LTHR' }
      ]
    },
    {
      woocommerceId: 5005,
      orderNumber: 'ORD-5005',
      customerEmail: 'alexander.wright@example.com',
      status: 'completed',
      total: 390.00, subtotal: 360.00, taxTotal: 30.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 35 * day),
      items: [
        { name: 'Titanium Mechanical Keycap Set - Cyberpunk', quantity: 1, price: 220.00, total: 220.00, sku: 'CAP-TITAN-CYB' },
        { name: 'Braided Thunderbolt 4 Cable 2m Space Gray', quantity: 2, price: 70.00, total: 140.00, sku: 'CBL-TB4-2M' }
      ]
    },
    {
      woocommerceId: 5006,
      orderNumber: 'ORD-5006',
      customerEmail: 'alexander.wright@example.com',
      status: 'completed',
      total: 550.00, subtotal: 500.00, taxTotal: 50.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 115 * day),
      items: [
        { name: 'Premium Standing Desk Converter - Matte Black', quantity: 1, price: 500.00, total: 500.00, sku: 'DSK-CONV-BLK' }
      ]
    },

    // Elena Rostova (Cust 103, Loyal)
    {
      woocommerceId: 5007,
      orderNumber: 'ORD-5007',
      customerEmail: 'elena.rostova@example.com',
      status: 'completed',
      total: 310.00, subtotal: 285.00, taxTotal: 25.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Apple Pay',
      dateCreated: new Date(now - 18 * day),
      items: [
        { name: 'Custom Coiled Keyboard Cable Aviator GX16', quantity: 2, price: 65.00, total: 130.00, sku: 'CBL-COIL-GX' },
        { name: 'Desk Sound Dampening Felt Panels (Set of 6)', quantity: 1, price: 155.00, total: 155.00, sku: 'PNL-FELT-06' }
      ]
    },
    {
      woocommerceId: 5008,
      orderNumber: 'ORD-5008',
      customerEmail: 'elena.rostova@example.com',
      status: 'completed',
      total: 420.00, subtotal: 385.00, taxTotal: 35.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 60 * day),
      items: [
        { name: 'Aluminum Macro Pad with OLED Screen', quantity: 1, price: 195.00, total: 195.00, sku: 'PAD-MACRO-OLED' },
        { name: 'Lubed Switches Tester Pack (90pcs)', quantity: 1, price: 190.00, total: 190.00, sku: 'SW-LUBE-90' }
      ]
    },

    // Marcus Vance (Cust 104, Loyal)
    {
      woocommerceId: 5009,
      orderNumber: 'ORD-5009',
      customerEmail: 'marcus.vance@example.com',
      status: 'completed',
      total: 290.00, subtotal: 265.00, taxTotal: 25.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 14 * day),
      items: [
        { name: 'Modular Aluminum Desk Shelf with Drawer', quantity: 1, price: 265.00, total: 265.00, sku: 'SHLF-ALUM-MOD' }
      ]
    },

    // Liam Chen (Cust 105, Repeat)
    {
      woocommerceId: 5010,
      orderNumber: 'ORD-5010',
      customerEmail: 'liam.chen@example.com',
      status: 'completed',
      total: 120.00, subtotal: 110.00, taxTotal: 10.00, shippingTotal: 0,
      paymentMethod: 'paypal', paymentMethodTitle: 'PayPal',
      dateCreated: new Date(now - 22 * day),
      items: [
        { name: 'Compact 3-in-1 Wireless MagSafe Charging Pad', quantity: 1, price: 110.00, total: 110.00, sku: 'CHG-MAG-3IN1' }
      ]
    },
    {
      woocommerceId: 5011,
      orderNumber: 'ORD-5011',
      customerEmail: 'liam.chen@example.com',
      status: 'completed',
      total: 95.00, subtotal: 85.00, taxTotal: 10.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 70 * day),
      items: [
        { name: 'Ergonomic Desk Mat - Charcoal', quantity: 1, price: 45.00, total: 45.00, sku: 'MAT-CHAR-01' },
        { name: 'Braided USB-C Cable 2m', quantity: 1, price: 40.00, total: 40.00, sku: 'CBL-USBC-2M' }
      ]
    },

    // Priya Patel (Cust 106, Repeat)
    {
      woocommerceId: 5012,
      orderNumber: 'ORD-5012',
      customerEmail: 'priya.patel@example.com',
      status: 'completed',
      total: 180.00, subtotal: 165.00, taxTotal: 15.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Apple Pay',
      dateCreated: new Date(now - 16 * day),
      items: [
        { name: 'Pantone Precision Color Calibrator for Displays', quantity: 1, price: 165.00, total: 165.00, sku: 'CAL-COLOR-01' }
      ]
    },
    {
      woocommerceId: 5013,
      orderNumber: 'ORD-5013',
      customerEmail: 'priya.patel@example.com',
      status: 'completed',
      total: 160.00, subtotal: 145.00, taxTotal: 15.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 55 * day),
      items: [
        { name: 'Architectural Scale Ruler & Drafting Pad Kit', quantity: 1, price: 145.00, total: 145.00, sku: 'DFT-PAD-KIT' }
      ]
    },

    // Carlos Rodriguez (Cust 107, Repeat)
    {
      woocommerceId: 5014,
      orderNumber: 'ORD-5014',
      customerEmail: 'carlos.rodriguez@example.com',
      status: 'completed',
      total: 260.00, subtotal: 240.00, taxTotal: 20.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 28 * day),
      items: [
        { name: 'Studio Monitor Isolation Acoustic Pads (Pair)', quantity: 2, price: 60.00, total: 120.00, sku: 'PAD-MON-ISO' },
        { name: 'XLR Gold-Plated Balanced Audio Cable 5m', quantity: 2, price: 60.00, total: 120.00, sku: 'CBL-XLR-5M' }
      ]
    },
    {
      woocommerceId: 5015,
      orderNumber: 'ORD-5015',
      customerEmail: 'carlos.rodriguez@example.com',
      status: 'completed',
      total: 220.00, subtotal: 200.00, taxTotal: 20.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 85 * day),
      items: [
        { name: 'Artisan Headphone Storage Hook Aluminum', quantity: 2, price: 50.00, total: 100.00, sku: 'HOK-ALUM-01' },
        { name: 'Cable Management Under-Desk Raceway', quantity: 2, price: 50.00, total: 100.00, sku: 'CBL-RCWY-01' }
      ]
    },

    // Olivia Kim (Cust 108, Repeat)
    {
      woocommerceId: 5016,
      orderNumber: 'ORD-5016',
      customerEmail: 'olivia.kim@example.com',
      status: 'completed',
      total: 210.00, subtotal: 190.00, taxTotal: 20.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 20 * day),
      items: [
        { name: 'Minimalist Walnut Laptop Stand with Cable Channel', quantity: 1, price: 190.00, total: 190.00, sku: 'STD-LPTP-WLT' }
      ]
    },

    // Emma Watson (Cust 109, New)
    {
      woocommerceId: 5017,
      orderNumber: 'ORD-5017',
      customerEmail: 'emma.watson@example.com',
      status: 'completed',
      total: 65.00, subtotal: 60.00, taxTotal: 5.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Apple Pay',
      dateCreated: new Date(now - 3 * day),
      items: [
        { name: 'Precision Stylus Pen with Magnetic Tip', quantity: 1, price: 60.00, total: 60.00, sku: 'PEN-STYL-MAG' }
      ]
    },

    // Noah Tanaka (Cust 110, New)
    {
      woocommerceId: 5018,
      orderNumber: 'ORD-5018',
      customerEmail: 'noah.tanaka@example.com',
      status: 'processing',
      total: 175.00, subtotal: 160.00, taxTotal: 15.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 2 * day),
      items: [
        { name: 'Wireless Mechanical Numpad Hot-swappable', quantity: 1, price: 160.00, total: 160.00, sku: 'NUM-WRLSS-HOT' }
      ]
    },

    // Chloe Bennett (Cust 111, New)
    {
      woocommerceId: 5019,
      orderNumber: 'ORD-5019',
      customerEmail: 'chloe.bennett@example.com',
      status: 'completed',
      total: 89.00, subtotal: 80.00, taxTotal: 9.00, shippingTotal: 0,
      paymentMethod: 'paypal', paymentMethodTitle: 'PayPal',
      dateCreated: new Date(now - 7 * day),
      items: [
        { name: 'SD Card High-Speed Aluminum Storage Case', quantity: 1, price: 80.00, total: 80.00, sku: 'CASE-SD-ALUM' }
      ]
    },

    // Marcus Brody (Cust 113, Inactive)
    {
      woocommerceId: 5020,
      orderNumber: 'ORD-5020',
      customerEmail: 'marcus.brody@example.com',
      status: 'completed',
      total: 180.00, subtotal: 165.00, taxTotal: 15.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 82 * day),
      items: [
        { name: 'Full-Grain Italian Leather Portfolio Folio', quantity: 1, price: 165.00, total: 165.00, sku: 'FOL-LTHR-ITL' }
      ]
    },
    {
      woocommerceId: 5021,
      orderNumber: 'ORD-5021',
      customerEmail: 'marcus.brody@example.com',
      status: 'completed',
      total: 240.00, subtotal: 220.00, taxTotal: 20.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 130 * day),
      items: [
        { name: 'Hand-Turned Brass Mechanical Pencil 0.5mm', quantity: 2, price: 110.00, total: 220.00, sku: 'PNC-BRS-05' }
      ]
    },

    // Isabella Rossi (Cust 114, Inactive)
    {
      woocommerceId: 5022,
      orderNumber: 'ORD-5022',
      customerEmail: 'isabella.rossi@example.com',
      status: 'completed',
      total: 290.00, subtotal: 270.00, taxTotal: 20.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Apple Pay',
      dateCreated: new Date(now - 75 * day),
      items: [
        { name: 'Wool Felt & Leather Desk Organizer Tray', quantity: 3, price: 90.00, total: 270.00, sku: 'TRY-FELT-LTHR' }
      ]
    },
    {
      woocommerceId: 5023,
      orderNumber: 'ORD-5023',
      customerEmail: 'isabella.rossi@example.com',
      status: 'completed',
      total: 250.00, subtotal: 230.00, taxTotal: 20.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 140 * day),
      items: [
        { name: 'Solid Walnut Tape Dispenser & Pen Cup Set', quantity: 1, price: 230.00, total: 230.00, sku: 'SET-WLT-CUP' }
      ]
    },

    // Jamal Washington (Cust 115, Inactive)
    {
      woocommerceId: 5024,
      orderNumber: 'ORD-5024',
      customerEmail: 'jamal.washington@example.com',
      status: 'completed',
      total: 190.00, subtotal: 175.00, taxTotal: 15.00, shippingTotal: 0,
      paymentMethod: 'paypal', paymentMethodTitle: 'PayPal',
      dateCreated: new Date(now - 95 * day),
      items: [
        { name: 'USB-C Dynamic Broadcast Microphone Arm', quantity: 1, price: 175.00, total: 175.00, sku: 'MIC-ARM-PRO' }
      ]
    },

    // Harper Lee (Cust 116, Inactive)
    {
      woocommerceId: 5025,
      orderNumber: 'ORD-5025',
      customerEmail: 'harper.lee@example.com',
      status: 'completed',
      total: 110.00, subtotal: 100.00, taxTotal: 10.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 110 * day),
      items: [
        { name: 'Calligraphy Wooden Ink Well & Nib Holder', quantity: 1, price: 100.00, total: 100.00, sku: 'INK-WELL-WOOD' }
      ]
    },

    // Special status orders: Refunded, Cancelled, On-Hold, Guest
    {
      woocommerceId: 5026,
      orderNumber: 'ORD-5026',
      customerEmail: 'sophia.vance@example.com',
      status: 'refunded',
      total: 85.00, subtotal: 80.00, taxTotal: 5.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 5 * day),
      items: [
        { name: 'Braided Type-C Audio Dongle DAC', quantity: 1, price: 80.00, total: 80.00, sku: 'AUD-DAC-TC' }
      ]
    },
    {
      woocommerceId: 5027,
      orderNumber: 'ORD-5027',
      customerEmail: 'carlos.rodriguez@example.com',
      status: 'cancelled',
      total: 140.00, subtotal: 130.00, taxTotal: 10.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 10 * day),
      items: [
        { name: 'Custom Printed Acoustic Sound Wall Art', quantity: 1, price: 130.00, total: 130.00, sku: 'ART-SND-WALL' }
      ]
    },
    {
      woocommerceId: 5028,
      orderNumber: 'ORD-5028',
      customerEmail: 'elena.rostova@example.com',
      status: 'on-hold',
      total: 215.00, subtotal: 195.00, taxTotal: 20.00, shippingTotal: 0,
      paymentMethod: 'cod', paymentMethodTitle: 'Bank Wire Transfer',
      dateCreated: new Date(now - 1 * day),
      items: [
        { name: 'Brass Key Switch Opener & Lube Station', quantity: 1, price: 195.00, total: 195.00, sku: 'STN-LUBE-BRS' }
      ]
    },
    {
      woocommerceId: 5029,
      orderNumber: 'ORD-5029',
      customerEmail: null,
      isGuest: true,
      billingName: 'David Guest',
      billingEmail: 'david.guest@example.com',
      status: 'completed',
      total: 145.00, subtotal: 135.00, taxTotal: 10.00, shippingTotal: 0,
      paymentMethod: 'stripe', paymentMethodTitle: 'Credit Card (Stripe)',
      dateCreated: new Date(now - 8 * day),
      items: [
        { name: 'Braided USB-C Cable 2m Triple Pack', quantity: 1, price: 135.00, total: 135.00, sku: 'CBL-TRIPLE-PK' }
      ]
    }
  ];

  for (const o of ordersSeedList) {
    const { items, customerEmail, ...orderFields } = o;
    const targetCust = customerEmail ? createdCustomers[customerEmail] : null;

    const orderData = {
      ...orderFields,
      orderNumber: String(orderFields.woocommerceId),
      customerId: targetCust ? targetCust.id : null,
      billingName: targetCust ? `${targetCust.firstName} ${targetCust.lastName}` : (orderFields.billingName || 'Guest Customer'),
      billingEmail: targetCust ? targetCust.email : (orderFields.billingEmail || 'guest@example.com')
    };

    const order = await prisma.order.upsert({
      where: { woocommerceId: orderData.woocommerceId },
      update: orderData,
      create: orderData
    });

    for (const item of items) {
      const existingItem = await prisma.orderItem.findFirst({
        where: { orderId: order.id, name: item.name }
      });
      if (!existingItem) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            ...item
          }
        });
      }
    }
  }

  console.log('✓ 29 Commerce Orders with detailed line items created');

  // 5. Customer Notes
  const notesData = [
    {
      customerEmail: 'sophia.vance@example.com',
      authorName: 'Sarah Connor',
      content: 'Sophia called regarding custom keycap colors for her studio setup. Mentioned she will be ordering 3 more stations for her team.'
    },
    {
      customerEmail: 'alexander.wright@example.com',
      authorName: 'Alex Rivera',
      content: 'Client requested tax-exempt commercial invoice for executive office remodel. Verified and updated.'
    },
    {
      customerEmail: 'marcus.brody@example.com',
      authorName: 'Alex Rivera',
      content: 'Marcus has not ordered in 82 days. Left voicemail offering private VIP preview code for the new leather collection.'
    },
    {
      customerEmail: 'isabella.rossi@example.com',
      authorName: 'Sarah Connor',
      content: 'Reached out to confirm international delivery preferences to Milan. Highly pleased with packaging quality.'
    },
    {
      customerEmail: 'aris.thorne@example.com',
      authorName: 'Sarah Connor',
      content: 'Initial wholesale inquiry via conference booth meeting. Interested in bulk order of 25 standing desk converters for the research center.'
    },
    {
      customerEmail: 'liam.chen@example.com',
      authorName: 'Alex Rivera',
      content: 'Inquired about next restock of the Walnut wood wrist rests.'
    }
  ];

  for (const n of notesData) {
    const cust = createdCustomers[n.customerEmail];
    if (cust) {
      await prisma.customerNote.create({
        data: {
          customerId: cust.id,
          authorName: n.authorName,
          content: n.content
        }
      });
    }
  }

  console.log('✓ Customer notes created');

  // 6. Follow-up Tasks (Mix of priorities, statuses, and sources)
  const tasksData = [
    {
      title: 'Win-back outreach to Marcus Brody',
      description: 'Customer is in Inactive segment (82 days without purchase, $620 historical spend). Prepare personal win-back discount offer.',
      customerEmail: 'marcus.brody@example.com',
      priority: 'URGENT',
      status: 'PENDING',
      dueDate: new Date(now - 3 * day), // Overdue task to verify overdue indicator
      source: 'ACTION_AGENT'
    },
    {
      title: 'Retention check-in for Isabella Rossi',
      description: 'Customer inactive for 75 days. Offer complimentary express shipping preview.',
      customerEmail: 'isabella.rossi@example.com',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: new Date(now - 1 * day), // Overdue task
      source: 'ACTION_AGENT'
    },
    {
      title: 'VIP appreciation call: Alexander Wright',
      description: 'Acknowledge top-tier VIP status ($1,420 across 8 orders). Deliver early-access concierge link.',
      customerEmail: 'alexander.wright@example.com',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: new Date(now + 1 * day),
      source: 'ACTION_AGENT'
    },
    {
      title: 'Welcome onboarding call: Emma Watson',
      description: 'Follow up on first completed stylus pen order to verify complete customer satisfaction.',
      customerEmail: 'emma.watson@example.com',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: new Date(now + 2 * day),
      source: 'WORKFLOW'
    },
    {
      title: 'Send enterprise wholesale catalog to Dr. Aris Thorne',
      description: 'Prepare custom PDF quote for 25 units with tiered volume discounting.',
      customerEmail: 'aris.thorne@example.com',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: new Date(now + 4 * day),
      source: 'MANUAL'
    },
    {
      title: 'Investigate refunded DAC unit for Sophia Vance',
      description: 'Customer order ORD-5026 was refunded. Call to check if replacement is needed.',
      customerEmail: 'sophia.vance@example.com',
      priority: 'URGENT',
      status: 'PENDING',
      dueDate: new Date(now + 1 * day),
      source: 'ACTION_AGENT'
    },
    {
      title: 'Check in on Noah Tanaka shipping tracking',
      description: 'New customer order ORD-5018 currently in processing status.',
      customerEmail: 'noah.tanaka@example.com',
      priority: 'LOW',
      status: 'COMPLETED',
      completedAt: new Date(now - 1 * day),
      dueDate: new Date(now - 2 * day),
      source: 'MANUAL'
    },
    {
      title: 'Quarterly VIP review for Elena Rostova',
      description: 'Elena ordered 5 times totaling $1,150. Send seasonal sample gift box.',
      customerEmail: 'elena.rostova@example.com',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      completedAt: new Date(now - 5 * day),
      dueDate: new Date(now - 6 * day),
      source: 'MANUAL'
    }
  ];

  for (const t of tasksData) {
    const cust = createdCustomers[t.customerEmail];
    if (cust) {
      const { customerEmail, ...taskFields } = t;
      await prisma.task.create({
        data: {
          ...taskFields,
          customerId: cust.id
        }
      });
    }
  }

  console.log('✓ Tasks created across all statuses and priorities');

  // 7. Communications
  const commsData = [
    {
      customerEmail: 'sophia.vance@example.com',
      subject: 'Exclusive VIP Perk for Sophia',
      body: 'Hello Sophia,\n\nBecause you are one of our most valued VIP customers, we have unlocked early access to our private collection for your account.\n\nBest wishes,\nMerqanta Leadership',
      status: 'DELIVERED',
      templateId: 'template_retention',
      providerMessageId: 'resend_msg_01jh98a1b2c3d4e5f6',
      sentAt: new Date(now - 10 * day),
      deliveredAt: new Date(now - 10 * day + 5000),
      openedAt: new Date(now - 10 * day + 3600000)
    },
    {
      customerEmail: 'alexander.wright@example.com',
      subject: 'Your order ORD-5004 is on the way!',
      body: 'Hi Alexander,\n\nYour recent order has been shipped with priority courier tracking.\n\nThank you for choosing Merqanta!',
      status: 'DELIVERED',
      templateId: null,
      providerMessageId: 'resend_msg_01jh98a1b2c3d4e5f7',
      sentAt: new Date(now - 5 * day),
      deliveredAt: new Date(now - 5 * day + 4000)
    },
    {
      customerEmail: 'emma.watson@example.com',
      subject: 'Welcome to Merqanta Store, Emma!',
      body: 'Dear Emma,\n\nThank you for choosing us for your recent order! Your account with emma.watson@example.com is now active.\n\nWarm regards,\nThe Merqanta Customer Success Team',
      status: 'DELIVERED',
      templateId: 'template_welcome',
      providerMessageId: 'resend_msg_01jh98a1b2c3d4e5f8',
      sentAt: new Date(now - 3 * day),
      deliveredAt: new Date(now - 3 * day + 3000),
      openedAt: new Date(now - 2 * day)
    },
    {
      customerEmail: 'marcus.brody@example.com',
      subject: 'We miss you at Merqanta, Marcus',
      body: 'Hi Marcus,\n\nIt has been a little while since your last order with us. Use code WELCOMEBACK for complimentary express shipping.\n\nWarm regards,\nThe Merqanta Team',
      status: 'ACCEPTED',
      templateId: 'template_winback',
      providerMessageId: 'resend_msg_01jh98a1b2c3d4e5f9',
      sentAt: new Date(now - 2 * day)
    }
  ];

  for (const cm of commsData) {
    const cust = createdCustomers[cm.customerEmail];
    if (cust) {
      const { customerEmail, ...commFields } = cm;
      await prisma.communication.create({
        data: {
          ...commFields,
          customerId: cust.id,
          recipientEmail: cust.email,
          recipientName: `${cust.firstName} ${cust.lastName}`
        }
      });
    }
  }

  console.log('✓ Communications created');

  // 8. Workflows
  await prisma.workflow.upsert({
    where: { id: 'wf_inactive_retention' },
    update: {
      name: 'Inactive Customer Retention Guard',
      description: 'Identifies customers who have not made a purchase in 60+ days and creates an urgent follow-up task.',
      enabled: true
    },
    create: {
      id: 'wf_inactive_retention',
      name: 'Inactive Customer Retention Guard',
      description: 'Identifies customers who have not made a purchase in 60+ days and creates an urgent follow-up task.',
      enabled: true,
      triggerType: 'INACTIVE_CUSTOMER',
      triggerConfig: JSON.stringify({ daysInactive: 60 }),
      actionType: 'CREATE_TASK',
      actionConfig: JSON.stringify({
        taskTitle: 'Reach out to inactive client: {{name}}',
        priority: 'HIGH'
      })
    }
  });

  await prisma.workflow.upsert({
    where: { id: 'wf_draft_winback_email' },
    update: {
      name: 'Draft Win-Back Email Campaign',
      description: 'Prepares draft emails for customer re-engagement without auto-sending (requires explicit approval).',
      enabled: false
    },
    create: {
      id: 'wf_draft_winback_email',
      name: 'Draft Win-Back Email Campaign',
      description: 'Prepares draft emails for customer re-engagement without auto-sending (requires explicit approval).',
      enabled: false,
      triggerType: 'INACTIVE_CUSTOMER',
      triggerConfig: JSON.stringify({ daysInactive: 90 }),
      actionType: 'DRAFT_EMAIL',
      actionConfig: JSON.stringify({
        subject: 'Special 15% discount for you!',
        templateId: 'template_winback'
      })
    }
  });

  console.log('✓ Workflows created');

  // 9. SyncState
  await prisma.syncState.upsert({
    where: { syncType: 'WOOCOMMERCE_FULL' },
    update: {
      status: 'SUCCESS',
      lastSyncCompletedAt: new Date(now - 1 * day),
      recordsProcessed: 45,
      errorsCount: 0,
      details: 'Full synchronization completed: 16 customers, 29 orders processed successfully.'
    },
    create: {
      syncType: 'WOOCOMMERCE_FULL',
      status: 'SUCCESS',
      lastSyncCompletedAt: new Date(now - 1 * day),
      recordsProcessed: 45,
      errorsCount: 0,
      details: 'Full synchronization completed: 16 customers, 29 orders processed successfully.'
    }
  });

  console.log('✓ SyncState seeded');
  console.log('🎉 Merqanta Commerce CRM database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
