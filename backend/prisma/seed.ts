import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample products
  const products = [
    {
      name: 'Classic Heart Necklace',
      description: 'Elegant heart-shaped pendant with sterling silver chain. Perfect for everyday wear or special occasions.',
      price: 2999,
      stock: 50,
      sku: 'THN-001',
      category: 'Necklaces',
      images: ['/images/products/heart-necklace-1.jpg', '/images/products/heart-necklace-2.jpg'],
    },
    {
      name: 'Rose Gold Bracelet',
      description: 'Delicate rose gold plated bracelet with adjustable chain. Hypoallergenic and tarnish-resistant.',
      price: 1499,
      stock: 75,
      sku: 'THB-001',
      category: 'Bracelets',
      images: ['/images/products/rose-bracelet-1.jpg'],
    },
    {
      name: 'Crystal Drop Earrings',
      description: 'Stunning crystal drop earrings with secure butterfly backs. Lightweight and comfortable for all-day wear.',
      price: 899,
      stock: 100,
      sku: 'THE-001',
      category: 'Earrings',
      images: ['/images/products/crystal-earrings-1.jpg', '/images/products/crystal-earrings-2.jpg'],
    },
    {
      name: 'Infinity Ring Set',
      description: 'Set of 3 stackable rings with infinity symbols. Available in silver, gold, and rose gold finishes.',
      price: 1299,
      stock: 60,
      sku: 'THR-001',
      category: 'Rings',
      images: ['/images/products/infinity-rings-1.jpg'],
    },
    {
      name: 'Pearl Pendant Necklace',
      description: 'Freshwater pearl pendant on a delicate gold chain. Timeless elegance for any occasion.',
      price: 3499,
      stock: 30,
      sku: 'THN-002',
      category: 'Necklaces',
      images: ['/images/products/pearl-necklace-1.jpg'],
    },
    {
      name: 'Charm Bracelet',
      description: 'Silver charm bracelet with 5 interchangeable charms. Add your own charms to personalize.',
      price: 2199,
      stock: 45,
      sku: 'THB-002',
      category: 'Bracelets',
      images: ['/images/products/charm-bracelet-1.jpg'],
    },
    {
      name: 'Stud Earring Set',
      description: 'Set of 6 pairs of minimalist stud earrings in various designs. Perfect for everyday wear.',
      price: 699,
      stock: 120,
      sku: 'THE-002',
      category: 'Earrings',
      images: ['/images/products/stud-set-1.jpg'],
    },
    {
      name: 'Birthstone Ring',
      description: 'Elegant birthstone ring with your choice of gemstone. Available in all 12 birthstones.',
      price: 1799,
      stock: 40,
      sku: 'THR-002',
      category: 'Rings',
      images: ['/images/products/birthstone-ring-1.jpg'],
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
    console.log(`✓ Created/Updated: ${product.name}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
