/**
 * Seed script for ArcoirisDB
 * Creates roles + admin user + test categories + test products
 * Run: node seed.js
 */
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'ArcoirisDB';

async function seed() {
  const client = new MongoClient(MONGO_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db(DB_NAME);

    // ========== 1. ROLES ==========
    console.log('\n📋 Creating roles...');
    const rolesCol = db.collection('roles');

    const adminRole = {
      name: 'admin',
      permissions: [
        'admin_granted',
        'users_read', 'users_write', 'users_update', 'users_delete',
        'roles_read', 'roles_write', 'roles_update', 'roles_delete',
        'categories_read', 'categories_write', 'categories_update', 'categories_delete',
        'products_read', 'products_write', 'products_update', 'products_delete',
        'hero-slides_read', 'hero-slides_write', 'hero-slides_update', 'hero-slides_delete',
        'videos_read', 'videos_write', 'videos_update', 'videos_delete',
        'questions_read', 'questions_write', 'questions_update', 'questions_delete',
        'trainings_read', 'trainings_write', 'trainings_update', 'trainings_delete',
        'history_read', 'history_delete',
        'upload_write',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userRole = {
      name: 'user',
      permissions: [
        'categories_read',
        'products_read',
        'hero-slides_read',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const guestRole = {
      name: 'guest',
      permissions: [
        'categories_read',
        'products_read',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Upsert roles
    for (const role of [adminRole, userRole, guestRole]) {
      const result = await rolesCol.updateOne(
        { name: role.name },
        { $set: role },
        { upsert: true }
      );
      const action = result.upsertedCount ? 'Created' : 'Updated';
      console.log(`  ${action} role: ${role.name}`);
    }

    // Get admin role ID for user creation
    const adminRoleDoc = await rolesCol.findOne({ name: 'admin' });
    const adminRoleId = adminRoleDoc._id;
    console.log(`  Admin role ID: ${adminRoleId}`);

    // ========== 2. ADMIN USER ==========
    console.log('\n👤 Creating admin user...');
    const usersCol = db.collection('users');

    const existingAdmin = await usersCol.findOne({ email: 'admin@arcoiris.com' });
    if (existingAdmin) {
      console.log('  Admin user already exists, updating...');
      const hashedPw = await bcrypt.hash('Admin123!', 12);
      await usersCol.updateOne(
        { email: 'admin@arcoiris.com' },
        {
          $set: {
            password: hashedPw,
            roles: [adminRoleId],
            permissions: [],
            updatedAt: new Date(),
          }
        }
      );
      console.log('  ✅ Admin user updated');
    } else {
      const hashedPw = await bcrypt.hash('Admin123!', 12);
      await usersCol.insertOne({
        name: 'Admin',
        lastname: 'Arcoiris',
        email: 'admin@arcoiris.com',
        whatsapp: '+5491112345678',
        password: hashedPw,
        permissions: [],
        roles: [adminRoleId],
        subscription: { status: 'active' },
        couponUsed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('  ✅ Admin user created');
    }

    // ========== 3. TEST CATEGORIES ==========
    console.log('\n📁 Creating test categories...');
    const catsCol = db.collection('categories');

    const categories = [
      {
        name: 'Anillos',
        description: 'Anillos de oro, plata y fantasía para toda ocasión',
        icon: '💍',
        order: 1,
        isActive: true,
        parentCategoryId: null,
        isParent: true,
        level: 0,
        productCount: 0,
        slug: 'anillos',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Collares',
        description: 'Collares y cadenas elegantes',
        icon: '📿',
        order: 2,
        isActive: true,
        parentCategoryId: null,
        isParent: true,
        level: 0,
        productCount: 0,
        slug: 'collares',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Pulseras',
        description: 'Pulseras y brazaletes',
        icon: '⌚',
        order: 3,
        isActive: true,
        parentCategoryId: null,
        isParent: false,
        level: 0,
        productCount: 0,
        slug: 'pulseras',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Aros',
        description: 'Aros y aretes para cada estilo',
        icon: '✨',
        order: 4,
        isActive: true,
        parentCategoryId: null,
        isParent: true,
        level: 0,
        productCount: 0,
        slug: 'aros',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Relojes',
        description: 'Relojes clásicos y modernos',
        icon: '⏱️',
        order: 5,
        isActive: true,
        parentCategoryId: null,
        isParent: false,
        level: 0,
        productCount: 0,
        slug: 'relojes',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Accesorios',
        description: 'Otros accesorios de joyería',
        icon: '👑',
        order: 6,
        isActive: true,
        parentCategoryId: null,
        isParent: false,
        level: 0,
        productCount: 0,
        slug: 'accesorios',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const cat of categories) {
      const result = await catsCol.updateOne(
        { slug: cat.slug },
        { $set: cat },
        { upsert: true }
      );
      const action = result.upsertedCount ? 'Created' : 'Updated';
      console.log(`  ${action} category: ${cat.icon} ${cat.name}`);
    }

    // Get category IDs for subcategories
    const anillosDoc = await catsCol.findOne({ slug: 'anillos' });
    const collaresDoc = await catsCol.findOne({ slug: 'collares' });
    const arosDoc = await catsCol.findOne({ slug: 'aros' });

    // Subcategories
    const subcategories = [
      { name: 'Anillos de Oro', description: 'Anillos en oro 18k y 24k', icon: '🥇', order: 1, isActive: true, parentCategoryId: anillosDoc._id, isParent: false, level: 1, productCount: 0, slug: 'anillos-oro', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Anillos de Plata', description: 'Anillos en plata 925', icon: '🥈', order: 2, isActive: true, parentCategoryId: anillosDoc._id, isParent: false, level: 1, productCount: 0, slug: 'anillos-plata', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Anillos Fantasía', description: 'Anillos de fantasía y bijouterie', icon: '💎', order: 3, isActive: true, parentCategoryId: anillosDoc._id, isParent: false, level: 1, productCount: 0, slug: 'anillos-fantasia', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Cadenas', description: 'Cadenas finas y gruesas', icon: '🔗', order: 1, isActive: true, parentCategoryId: collaresDoc._id, isParent: false, level: 1, productCount: 0, slug: 'cadenas', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Colgantes', description: 'Dijes y colgantes', icon: '💫', order: 2, isActive: true, parentCategoryId: collaresDoc._id, isParent: false, level: 1, productCount: 0, slug: 'colgantes', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Aros Argolla', description: 'Aros tipo argolla', icon: '⭕', order: 1, isActive: true, parentCategoryId: arosDoc._id, isParent: false, level: 1, productCount: 0, slug: 'aros-argolla', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Aros Colgantes', description: 'Aros con colgantes', icon: '🌟', order: 2, isActive: true, parentCategoryId: arosDoc._id, isParent: false, level: 1, productCount: 0, slug: 'aros-colgantes', createdAt: new Date(), updatedAt: new Date() },
    ];

    for (const sub of subcategories) {
      const result = await catsCol.updateOne(
        { slug: sub.slug },
        { $set: sub },
        { upsert: true }
      );
      const action = result.upsertedCount ? 'Created' : 'Updated';
      console.log(`  ${action} subcategory: ${sub.icon} ${sub.name}`);
    }

    // ========== 4. TEST PRODUCTS ==========
    console.log('\n🛍️ Creating test products...');
    const prodsCol = db.collection('products');

    // Get subcategory IDs
    const anillosOroDoc = await catsCol.findOne({ slug: 'anillos-oro' });
    const anillosPlataDoc = await catsCol.findOne({ slug: 'anillos-plata' });
    const cadenasDoc = await catsCol.findOne({ slug: 'cadenas' });
    const colgantesDoc = await catsCol.findOne({ slug: 'colgantes' });
    const arosArgollaDoc = await catsCol.findOne({ slug: 'aros-argolla' });
    const pulserasDoc = await catsCol.findOne({ slug: 'pulseras' });
    const relojesDoc = await catsCol.findOne({ slug: 'relojes' });
    const accesoriosDoc = await catsCol.findOne({ slug: 'accesorios' });

    const products = [
      {
        name: 'Anillo Solitario Oro 18k',
        description: 'Elegante anillo solitario en oro 18 kilates con circón central. Ideal para compromiso o regalo especial.',
        price: 185000,
        originalPrice: 220000,
        category: 'Anillos',
        categoryId: anillosOroDoc._id,
        stock: 8,
        featured: true,
        isActive: true,
        tags: ['oro', '18k', 'solitario', 'compromiso'],
        rating: 4.8,
        images: [],
        imageSlots: {},
        slug: 'anillo-solitario-oro-18k',
      },
      {
        name: 'Alianza Oro 18k Clásica',
        description: 'Alianza clásica en oro 18k, acabado pulido. Perfecta para matrimonios.',
        price: 95000,
        category: 'Anillos',
        categoryId: anillosOroDoc._id,
        stock: 15,
        featured: false,
        isActive: true,
        tags: ['oro', '18k', 'alianza', 'matrimonio'],
        rating: 4.5,
        images: [],
        imageSlots: {},
        slug: 'alianza-oro-18k-clasica',
      },
      {
        name: 'Anillo Plata 925 Infinito',
        description: 'Delicado anillo en plata esterlina 925 con diseño infinito y zirconias.',
        price: 12500,
        originalPrice: 15000,
        category: 'Anillos',
        categoryId: anillosPlataDoc._id,
        stock: 25,
        featured: true,
        isActive: true,
        tags: ['plata', '925', 'infinito', 'zirconia'],
        rating: 4.6,
        images: [],
        imageSlots: {},
        slug: 'anillo-plata-925-infinito',
      },
      {
        name: 'Cadena Groumet Oro 18k 50cm',
        description: 'Cadena tipo groumet en oro 18k, 50cm de largo. Cierre mosquetón.',
        price: 280000,
        category: 'Collares',
        categoryId: cadenasDoc._id,
        stock: 5,
        featured: true,
        isActive: true,
        tags: ['oro', '18k', 'cadena', 'groumet'],
        rating: 4.9,
        images: [],
        imageSlots: {},
        slug: 'cadena-groumet-oro-18k',
      },
      {
        name: 'Dije Corazón Plata 925',
        description: 'Colgante en forma de corazón, plata 925 con baño de rodio. Incluye cadena.',
        price: 18500,
        category: 'Collares',
        categoryId: colgantesDoc._id,
        stock: 20,
        featured: false,
        isActive: true,
        tags: ['plata', '925', 'corazón', 'dije'],
        rating: 4.3,
        images: [],
        imageSlots: {},
        slug: 'dije-corazon-plata-925',
      },
      {
        name: 'Aros Argolla Oro 18k Medianos',
        description: 'Aros tipo argolla en oro 18k, tamaño mediano. Cierre seguro con traba.',
        price: 125000,
        originalPrice: 145000,
        category: 'Aros',
        categoryId: arosArgollaDoc._id,
        stock: 10,
        featured: true,
        isActive: true,
        tags: ['oro', '18k', 'argolla', 'aros'],
        rating: 4.7,
        images: [],
        imageSlots: {},
        slug: 'aros-argolla-oro-18k',
      },
      {
        name: 'Pulsera Eslabones Plata 925',
        description: 'Pulsera de eslabones en plata 925 con cierre ajustable. Estilo moderno.',
        price: 22000,
        category: 'Pulseras',
        categoryId: pulserasDoc._id,
        stock: 18,
        featured: false,
        isActive: true,
        tags: ['plata', '925', 'eslabones', 'pulsera'],
        rating: 4.4,
        images: [],
        imageSlots: {},
        slug: 'pulsera-eslabones-plata-925',
      },
      {
        name: 'Pulsera Riviera Zirconias',
        description: 'Pulsera riviera con zirconias cúbicas engarzadas, baño de oro. Elegancia pura.',
        price: 35000,
        originalPrice: 42000,
        category: 'Pulseras',
        categoryId: pulserasDoc._id,
        stock: 12,
        featured: true,
        isActive: true,
        tags: ['zirconia', 'riviera', 'baño oro', 'pulsera'],
        rating: 4.8,
        images: [],
        imageSlots: {},
        slug: 'pulsera-riviera-zirconias',
      },
      {
        name: 'Reloj Clásico Acero Dorado',
        description: 'Reloj de pulsera clásico en acero inoxidable con acabado dorado. Movimiento japonés.',
        price: 45000,
        category: 'Relojes',
        categoryId: relojesDoc._id,
        stock: 7,
        featured: false,
        isActive: true,
        tags: ['reloj', 'acero', 'dorado', 'clásico'],
        rating: 4.2,
        images: [],
        imageSlots: {},
        slug: 'reloj-clasico-acero-dorado',
      },
      {
        name: 'Set Collar + Aros Perlas',
        description: 'Set completo de collar y aros con perlas cultivadas. Ideal para eventos formales.',
        price: 55000,
        originalPrice: 68000,
        category: 'Accesorios',
        categoryId: accesoriosDoc._id,
        stock: 6,
        featured: true,
        isActive: true,
        tags: ['set', 'perlas', 'collar', 'aros', 'formal'],
        rating: 4.9,
        images: [],
        imageSlots: {},
        slug: 'set-collar-aros-perlas',
      },
    ];

    for (const prod of products) {
      const result = await prodsCol.updateOne(
        { slug: prod.slug },
        { 
          $set: { ...prod, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
      const action = result.upsertedCount ? 'Created' : 'Updated';
      const priceFormatted = `$${(prod.price).toLocaleString('es-AR')}`;
      console.log(`  ${action} product: ${prod.name} (${priceFormatted})`);
    }

    // ========== 5. UPDATE PRODUCT COUNTS ==========
    console.log('\n📊 Updating category product counts...');
    const allCats = await catsCol.find({}).toArray();
    for (const cat of allCats) {
      const count = await prodsCol.countDocuments({ 
        categoryId: cat._id,
        isActive: true 
      });
      await catsCol.updateOne({ _id: cat._id }, { $set: { productCount: count } });
      if (count > 0) console.log(`  ${cat.name}: ${count} products`);
    }

    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n🔑 Admin credentials:');
    console.log('   Email:    admin@arcoiris.com');
    console.log('   Password: Admin123!');
    console.log(`\n📋 Roles:    ${await rolesCol.countDocuments()} roles`);
    console.log(`👤 Users:    ${await usersCol.countDocuments()} users`);
    console.log(`📁 Categories: ${await catsCol.countDocuments()} categories`);
    console.log(`🛍️  Products:  ${await prodsCol.countDocuments()} products`);
    console.log('\n🌐 Login: POST http://localhost:3015/api/v1/auth/login');
    console.log('   Body: { "email": "admin@arcoiris.com", "password": "Admin123!" }');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
