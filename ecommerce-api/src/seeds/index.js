const { PrismaClient } = require('@prisma/client');
const HashService = require('../services/hash');
const { logger } = require('../services/logger');

const prisma = new PrismaClient();

async function seedUsers() {
  logger.info('Seed des utilisateurs...');
  
  try {
    // Créer un utilisateur admin
    const adminPassword = await HashService.hashPassword('Admin123!');
    const admin = await prisma.user.upsert({
      where: { email: 'admin@ecommerce.com' },
      update: {},
      create: {
        email: 'admin@ecommerce.com',
        password: adminPassword,
        name: 'Administrateur',
        role: 'ADMIN'
      }
    });
    
    // Créer un utilisateur normal
    const userPassword = await HashService.hashPassword('User123!');
    const user = await prisma.user.upsert({
      where: { email: 'user@ecommerce.com' },
      update: {},
      create: {
        email: 'user@ecommerce.com',
        password: userPassword,
        name: 'Utilisateur Test',
        role: 'USER'
      }
    });
    
    logger.info(`Utilisateurs créés : ${admin.email}, ${user.email}`);
    return { admin, user };
    
  } catch (error) {
    logger.error('Erreur lors du seed des utilisateurs', { error: error.message });
    throw error;
  }
}

async function seedProducts() {
  logger.info('Seed des produits...');
  
  try {
    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Le dernier iPhone avec puce A17 Pro et caméra révolutionnaire',
        price: 1199.99,
        quantity: 50,
        sku: 'IPHONE-15-PRO-128',
        category: 'Smartphones',
        isActive: true
      },
      {
        name: 'MacBook Air M2',
        description: 'Ordinateur portable ultra-fin avec puce M2',
        price: 1499.99,
        quantity: 25,
        sku: 'MACBOOK-AIR-M2-256',
        category: 'Ordinateurs',
        isActive: true
      },
      {
        name: 'AirPods Pro',
        description: 'Écouteurs sans fil avec réduction de bruit active',
        price: 279.99,
        quantity: 100,
        sku: 'AIRPODS-PRO-GEN2',
        category: 'Audio',
        isActive: true
      },
      {
        name: 'iPad Pro 12.9"',
        description: 'Tablette professionnelle avec écran Liquid Retina XDR',
        price: 1099.99,
        quantity: 30,
        sku: 'IPAD-PRO-129-256',
        category: 'Tablettes',
        isActive: true
      },
      {
        name: 'Apple Watch Series 9',
        description: 'Montre connectée avec puce S9',
        price: 429.99,
        quantity: 75,
        sku: 'WATCH-S9-45MM-GPS',
        category: 'Montres',
        isActive: true
      },
      {
        name: 'Magic Mouse',
        description: 'Souris sans fil rechargeable',
        price: 89.99,
        quantity: 200,
        sku: 'MAGIC-MOUSE-WHITE',
        category: 'Accessoires',
        isActive: true
      },
      {
        name: 'Magic Keyboard',
        description: 'Clavier sans fil avec pavé numérique',
        price: 149.99,
        quantity: 150,
        sku: 'MAGIC-KB-NUMERIC',
        category: 'Accessoires',
        isActive: true
      },
      {
        name: 'Studio Display',
        description: 'Écran 27 pouces 5K Retina',
        price: 1599.99,
        quantity: 15,
        sku: 'STUDIO-DISPLAY-27',
        category: 'Écrans',
        isActive: true
      },
      {
        name: 'Mac Studio',
        description: 'Station de travail compacte avec puce M2 Max',
        price: 2499.99,
        quantity: 10,
        sku: 'MAC-STUDIO-M2-MAX',
        category: 'Ordinateurs',
        isActive: true
      },
      {
        name: 'HomePod mini',
        description: 'Enceinte intelligente compacte',
        price: 99.99,
        quantity: 80,
        sku: 'HOMEPOD-MINI-WHITE',
        category: 'Audio',
        isActive: true
      }
    ];
    
    const createdProducts = [];
    
    for (const productData of products) {
      const product = await prisma.product.upsert({
        where: { sku: productData.sku },
        update: {},
        create: productData
      });
      createdProducts.push(product);
    }
    
    logger.info(`${createdProducts.length} produits créés`);
    return createdProducts;
    
  } catch (error) {
    logger.error('Erreur lors du seed des produits', { error: error.message });
    throw error;
  }
}

async function main() {
  try {
    logger.info('🌱 Début du seeding...');
    
    await seedUsers();
    await seedProducts();
    
    logger.info('✅ Seeding terminé avec succès');
    
  } catch (error) {
    logger.error('❌ Erreur lors du seeding', { error: error.message });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeding si ce fichier est appelé directement
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedUsers, seedProducts, main };