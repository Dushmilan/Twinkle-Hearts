import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with greeting cards...');

  // Greeting card products
  const products = [
    {
      name: 'Happy Birthday Sparkles',
      description: 'A vibrant birthday card with colorful confetti and sparkle accents. "Another year of being amazing!" — perfect for celebrating someone special.',
      price: 250,
      stock: 100,
      sku: 'BD-001',
      category: 'Birthday',
      images: ['/images/cards/birthday-sparkles-1.jpg', '/images/cards/birthday-sparkles-2.jpg'],
      isFeatured: true,
    },
    {
      name: 'Forever Yours',
      description: 'An elegant romantic card with soft watercolor hearts and a heartfelt message. "You are my today and all of my tomorrows."',
      price: 300,
      stock: 80,
      sku: 'LV-001',
      category: 'Love',
      images: ['/images/cards/love-forever-1.jpg'],
      isFeatured: true,
    },
    {
      name: 'Golden Anniversary',
      description: 'A premium anniversary card with gold foil accents and a timeless message. "Celebrating the beautiful journey of your love."',
      price: 400,
      stock: 60,
      sku: 'AN-001',
      category: 'Anniversary',
      images: ['/images/cards/golden-anniversary-1.jpg'],
      isFeatured: true,
    },
    {
      name: 'Friends Like You',
      description: 'A cheerful friendship card with tropical flowers and a warm message. "Friends like you make everything brighter."',
      price: 200,
      stock: 120,
      sku: 'FR-001',
      category: 'Friendship',
      images: ['/images/cards/friendship-tropical-1.jpg'],
    },
    {
      name: 'Avurudu Blessings',
      description: 'A traditional Sinhala Avurudu greeting card with beautiful motifs of oil lamp and kiribath. "Suba Aluth Avuruddak Wewa!"',
      price: 250,
      stock: 90,
      sku: 'FV-001',
      category: 'Festival',
      images: ['/images/cards/avurudu-blessings-1.jpg'],
      isFeatured: true,
    },
    {
      name: 'Thinking of You',
      description: 'A gentle sympathy card with soft lavender and a comforting message. "Sending you love and strength during this difficult time."',
      price: 250,
      stock: 70,
      sku: 'SY-001',
      category: 'Sympathy',
      images: ['/images/cards/sympathy-lavender-1.jpg'],
    },
    {
      name: 'Birthday Wishes in Sinhala',
      description: 'A beautiful birthday card with Sinhala text "සුබ උපන්දින සුභ පැතුම්!" and floral decorations. Bilingual message inside.',
      price: 250,
      stock: 85,
      sku: 'BD-002',
      category: 'Birthday',
      images: ['/images/cards/birthday-sinhala-1.jpg'],
    },
    {
      name: 'Love in Tamil',
      description: 'A romantic card with Tamil text "நான் உன்னை காதலிக்கிறேன்" and elegant peacock feather design.',
      price: 300,
      stock: 65,
      sku: 'LV-002',
      category: 'Love',
      images: ['/images/cards/love-tamil-1.jpg'],
    },
    {
      name: 'Baby Shower Blessings',
      description: 'A sweet baby shower card with pastel colors and tiny footprints. "Welcome little one — you are already so loved!"',
      price: 250,
      stock: 75,
      sku: 'BS-001',
      category: 'Birthday',
      images: ['/images/cards/baby-shower-1.jpg'],
    },
    {
      name: 'Vesak Blessings',
      description: 'A serene Vesak greeting card with lotus flower and lantern design. "Suba Vesak Purnima Wewa!" with Dharma message.',
      price: 250,
      stock: 95,
      sku: 'FV-002',
      category: 'Festival',
      images: ['/images/cards/vesak-blessings-1.jpg'],
      isFeatured: true,
    },
    {
      name: 'Get Well Soon',
      description: 'A cheerful recovery card with sunflowers and an uplifting message. "Sending sunshine your way — get well soon!"',
      price: 200,
      stock: 80,
      sku: 'GW-001',
      category: 'Sympathy',
      images: ['/images/cards/get-well-sunflower-1.jpg'],
    },
    {
      name: 'Christmas Joy',
      description: 'A festive Christmas card with star and holly design. "Wishing you joy, peace, and all the love this holiday season."',
      price: 300,
      stock: 100,
      sku: 'FV-003',
      category: 'Festival',
      images: ['/images/cards/christmas-joy-1.jpg'],
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

  console.log('🎉 Seeding completed with 12 greeting cards!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
