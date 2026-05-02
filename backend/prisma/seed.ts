import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const providerHash = await bcrypt.hash('Provider123!', 10);
  const distHash     = await bcrypt.hash('Distrib123!', 10);

  const provider = await prisma.user.upsert({
    where:  { email: 'provider@demo.com' },
    update: {},
    create: { email: 'provider@demo.com',     passwordHash: providerHash, name: 'Proveedor Demo', company: 'TechSupply SL',    role: 'PROVIDER' },
  });

  await prisma.user.upsert({
    where:  { email: 'distributor@demo.com' },
    update: {},
    create: { email: 'distributor@demo.com',  passwordHash: distHash,     name: 'Distribuidor Demo', company: 'LogiDist SA', role: 'DISTRIBUTOR' },
  });

  console.log('✅ Users created');

  // ── Categories ─────────────────────────────────────────────────────────────
  const electronics = await prisma.category.upsert({
    where: { name: 'Electrónica' }, update: {},
    create: { name: 'Electrónica' },
  });
  const furniture = await prisma.category.upsert({
    where: { name: 'Mobiliario de oficina' }, update: {},
    create: { name: 'Mobiliario de oficina' },
  });
  const consumables = await prisma.category.upsert({
    where: { name: 'Consumibles' }, update: {},
    create: { name: 'Consumibles' },
  });
  const software = await prisma.category.upsert({
    where: { name: 'Software y licencias' }, update: {},
    create: { name: 'Software y licencias' },
  });

  console.log('✅ Categories created');

  // ── Products ───────────────────────────────────────────────────────────────
  const products = [
    {
      name: 'Monitor Dell 29" UltraSharp',
      description: 'Monitor ultrawide IPS 29 pulgadas, resolución 2560x1080, ideal para productividad.',
      price: 399.99, cost: 220.00, stock: 12, categoryId: electronics.id,
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
    },
    {
      name: 'Teclado mecánico Logitech MX Keys',
      description: 'Teclado inalámbrico retroiluminado con teclas de bajo perfil, compatible con varios dispositivos.',
      price: 119.99, cost: 65.00, stock: 25, categoryId: electronics.id,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
    },
    {
      name: 'Ratón ergonómico Logitech MX Master 3',
      description: 'Ratón inalámbrico de alta precisión con scroll electromagnético y múltiples perfiles.',
      price: 99.99, cost: 52.00, stock: 30, categoryId: electronics.id,
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    },
    {
      name: 'Silla de oficina ErgoFlex Pro',
      description: 'Silla ergonómica con soporte lumbar ajustable, reposabrazos 4D y base de aluminio.',
      price: 549.00, cost: 310.00, stock: 8, categoryId: furniture.id,
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    },
    {
      name: 'Mesa de escritorio elevable 160cm',
      description: 'Mesa motorizada de altura regulable (70-120cm), tablero de madera de roble, 160x80cm.',
      price: 689.00, cost: 390.00, stock: 5, categoryId: furniture.id,
      imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400',
    },
    {
      name: 'Pack papel A4 500 hojas (5 resmas)',
      description: 'Papel de impresión blanco 80g/m², alta blancura, apto para todos los tipos de impresora.',
      price: 24.90, cost: 12.00, stock: 150, categoryId: consumables.id,
      imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
    },
    {
      name: 'Cartuchos de tinta HP 305 XL (pack 4)',
      description: 'Pack de 4 cartuchos de tinta original HP: negro, cian, magenta y amarillo, alto rendimiento.',
      price: 44.99, cost: 22.00, stock: 60, categoryId: consumables.id,
      imageUrl: 'https://images.unsplash.com/photo-1612198790700-0c3c05faf678?w=400',
    },
    {
      name: 'Microsoft 365 Business Standard (1 año)',
      description: 'Licencia anual para 1 usuario. Incluye Word, Excel, PowerPoint, Teams y 1TB en OneDrive.',
      price: 132.00, cost: 95.00, stock: 999, categoryId: software.id,
      imageUrl: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400',
    },
  ];

  for (const p of products) {
    const { imageUrl, ...productData } = p;
    const existing = await prisma.product.findFirst({ where: { name: productData.name } });
    if (!existing) {
      const created = await prisma.product.create({ data: productData });
      await prisma.productImage.create({
        data: { productId: created.id, url: imageUrl, isPrimary: true },
      });
    }
  }

  console.log('✅ Products created');

  // ── Sample orders ──────────────────────────────────────────────────────────
  const allProducts = await prisma.product.findMany();
  const monitor = allProducts.find(p => p.name.includes('Monitor'));
  const keyboard = allProducts.find(p => p.name.includes('Teclado'));
  const chair    = allProducts.find(p => p.name.includes('Silla'));

  if (monitor && keyboard) {
    const existingOrder = await prisma.order.findFirst({ where: { buyerId: provider.id } });
    if (!existingOrder) {
      const monitorPrice  = Number(monitor.price);
      const keyboardPrice = Number(keyboard.price);
      const total = monitorPrice * 1 + keyboardPrice * 2;

      await prisma.order.create({
        data: {
          buyerId:     provider.id,
          status:      'DELIVERED',
          totalAmount: total,
          items: {
            create: [
              { productId: monitor.id,  quantity: 1, unitPrice: monitorPrice,  subtotal: monitorPrice },
              { productId: keyboard.id, quantity: 2, unitPrice: keyboardPrice, subtotal: keyboardPrice * 2 },
            ],
          },
        },
      });
    }
  }

  if (chair) {
    const existingOrder2 = await prisma.order.findFirst({
      where: { buyerId: provider.id, status: 'CONFIRMED' },
    });
    if (!existingOrder2) {
      const chairPrice = Number(chair.price);
      await prisma.order.create({
        data: {
          buyerId:     provider.id,
          status:      'CONFIRMED',
          totalAmount: chairPrice,
          items: {
            create: [
              { productId: chair.id, quantity: 1, unitPrice: chairPrice, subtotal: chairPrice },
            ],
          },
        },
      });
    }
  }

  console.log('✅ Sample orders created');
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('  Provider:     provider@demo.com      /  Provider123!');
  console.log('  Distributor:  distributor@demo.com   /  Distrib123!');
  console.log('─────────────────────────────────────────');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
