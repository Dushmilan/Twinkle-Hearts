import 'dotenv/config';
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

      category: 'Birthday',
      images: ['https://picsum.photos/seed/birthday-sparkles/600/800'],
      isFeatured: true,
    },
    {
      name: 'Forever Yours',
      description: 'An elegant romantic card with soft watercolor hearts and a heartfelt message. "You are my today and all of my tomorrows."',
      price: 300,
      stock: 80,

      category: 'Love',
      images: ['https://picsum.photos/seed/forever-yours/600/800'],
      isFeatured: true,
    },
    {
      name: 'Golden Anniversary',
      description: 'A premium anniversary card with gold foil accents and a timeless message. "Celebrating the beautiful journey of your love."',
      price: 400,
      stock: 60,

      category: 'Anniversary',
      images: ['https://picsum.photos/seed/golden-anniversary/600/800'],
      isFeatured: true,
    },
    {
      name: 'Friends Like You',
      description: 'A cheerful friendship card with tropical flowers and a warm message. "Friends like you make everything brighter."',
      price: 200,
      stock: 120,

      category: 'Friendship',
      images: ['https://picsum.photos/seed/friends-like-you/600/800'],
    },
    {
      name: 'Avurudu Blessings',
      description: 'A traditional Sinhala Avurudu greeting card with beautiful motifs of oil lamp and kiribath. "Suba Aluth Avuruddak Wewa!"',
      price: 250,
      stock: 90,

      category: 'Festival',
      images: ['https://picsum.photos/seed/avurudu-blessings/600/800'],
      isFeatured: true,
    },
    {
      name: 'Thinking of You',
      description: 'A gentle sympathy card with soft lavender and a comforting message. "Sending you love and strength during this difficult time."',
      price: 250,
      stock: 70,

      category: 'Sympathy',
      images: ['https://picsum.photos/seed/thinking-of-you/600/800'],
    },
    {
      name: 'Birthday Wishes in Sinhala',
      description: 'A beautiful birthday card with Sinhala text "සුබ උපන්දින සුභ පැතුම්!" and floral decorations. Bilingual message inside.',
      price: 250,
      stock: 85,

      category: 'Birthday',
      images: ['https://picsum.photos/seed/birthday-wishes-sinhala/600/800'],
    },
    {
      name: 'Love in Tamil',
      description: 'A romantic card with Tamil text "நான் உன்னை காதலிக்கிறேன்" and elegant peacock feather design.',
      price: 300,
      stock: 65,

      category: 'Love',
      images: ['https://picsum.photos/seed/love-tamil/600/800'],
    },
    {
      name: 'Baby Shower Blessings',
      description: 'A sweet baby shower card with pastel colors and tiny footprints. "Welcome little one — you are already so loved!"',
      price: 250,
      stock: 75,

      category: 'Birthday',
      images: ['https://picsum.photos/seed/baby-shower/600/800'],
    },
    {
      name: 'Vesak Blessings',
      description: 'A serene Vesak greeting card with lotus flower and lantern design. "Suba Vesak Purnima Wewa!" with Dharma message.',
      price: 250,
      stock: 95,

      category: 'Festival',
      images: ['https://picsum.photos/seed/vesak-blessings/600/800'],
      isFeatured: true,
    },
    {
      name: 'Get Well Soon',
      description: 'A cheerful recovery card with sunflowers and an uplifting message. "Sending sunshine your way — get well soon!"',
      price: 200,
      stock: 80,

      category: 'Sympathy',
      images: ['https://picsum.photos/seed/get-well-soon/600/800'],
    },
    {
      name: 'Christmas Joy',
      description: 'A festive Christmas card with star and holly design. "Wishing you joy, peace, and all the love this holiday season."',
      price: 300,
      stock: 100,

      category: 'Festival',
      images: ['https://picsum.photos/seed/christmas-joy/600/800'],
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (!existing) {
      await prisma.product.create({ data: { ...product, images: JSON.stringify(product.images) } });
      console.log(`✓ Created: ${product.name}`);
    } else {
      console.log(`• Already exists: ${product.name}`);
    }
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
