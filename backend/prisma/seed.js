const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TARGET_EMAIL = 'nikssan123@gmail.com';

const DUMMY_LISTINGS = [
  {
    title: 'Elegant Ivory Wedding Gown with Lace',
    description: 'Stunning ivory wedding dress with delicate lace details and tulle overlay. Worn once, professionally cleaned. Includes storage bag.',
    price: 950,
    originalPrice: 2800,
    category: 'wedding',
    size: 'M',
    condition: 'like-new',
    color: 'Ivory',
    brand: 'Pronovias',
    bust: '88 cm',
    waist: '68 cm',
    hips: '94 cm',
    length: '170 cm',
    imageUrls: ['https://picsum.photos/400/600?random=1', 'https://picsum.photos/400/600?random=2'],
  },
  {
    title: 'Blush Satin Ball Gown',
    description: 'Beautiful blush satin dress for prom or special occasion. Worn once. Flattering A-line silhouette with subtle sparkle.',
    price: 320,
    originalPrice: 780,
    category: 'graduation',
    size: 'S',
    condition: 'like-new',
    color: 'Blush',
    brand: 'Vera Wang',
    bust: '84 cm',
    waist: '64 cm',
    hips: '90 cm',
    length: '155 cm',
    imageUrls: ['https://picsum.photos/400/600?random=3'],
  },
  {
    title: 'Champagne Evening Dress',
    description: 'Luxurious evening dress in champagne gold. Perfect for galas or formal events. Excellent condition.',
    price: 265,
    originalPrice: 620,
    category: 'evening',
    size: 'M',
    condition: 'good',
    color: 'Champagne',
    brand: 'BCBG',
    bust: '86 cm',
    waist: '66 cm',
    hips: '92 cm',
    length: '160 cm',
    imageUrls: ['https://picsum.photos/400/600?random=4', 'https://picsum.photos/400/600?random=5'],
  },
  {
    title: 'White Lace Bridal Dress Long Sleeves',
    description: 'Romantic wedding dress with long lace sleeves. A-line silhouette. Professionally dry cleaned and stored in garment bag.',
    price: 880,
    originalPrice: 2600,
    category: 'wedding',
    size: 'S',
    condition: 'like-new',
    color: 'White',
    brand: 'Rosa Clará',
    bust: '84 cm',
    waist: '64 cm',
    hips: '90 cm',
    length: '165 cm',
    imageUrls: ['https://picsum.photos/400/600?random=6'],
  },
  {
    title: 'Emerald Green Chiffon Gown',
    description: 'Elegant emerald green chiffon dress. Light and feminine, ideal for bridesmaid or cocktail party.',
    price: 185,
    originalPrice: 450,
    category: 'evening',
    size: 'L',
    condition: 'good',
    color: 'Emerald',
    brand: 'Jenny Packham',
    bust: '92 cm',
    waist: '74 cm',
    hips: '100 cm',
    length: '162 cm',
    imageUrls: ['https://picsum.photos/400/600?random=7', 'https://picsum.photos/400/600?random=8', 'https://picsum.photos/400/600?random=9'],
  },
];

const DUMMY_REVIEWS = [
  { authorName: 'Anna K.', rating: 5, comment: 'The dress was exactly as described! So happy with my purchase. Fast shipping and great communication.' },
  { authorName: 'Maria P.', rating: 4, comment: 'Beautiful dress, quick delivery. Slightly longer than expected but nothing a tailor cannot fix.' },
  { authorName: 'Sophie L.', rating: 5, comment: 'Absolutely perfect wedding dress! Would recommend this seller to anyone.' },
  { authorName: 'Elena D.', rating: 5, comment: 'Stunning gown at a great price. Seller was very helpful with measurements.' },
  { authorName: 'Victoria S.', rating: 4, comment: 'Very nice dress for the price. Packaged carefully.' },
  { authorName: 'Nadia I.', rating: 5, comment: 'My dream dress! Thank you so much for a smooth transaction.' },
  { authorName: 'Guest Buyer', rating: 5, comment: 'Excellent experience from start to finish. Dress was in perfect condition.' },
];

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
  });

  if (!user) {
    console.error(`User with email ${TARGET_EMAIL} not found in the database.`);
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.email}). Adding dummy data...`);

  for (const listing of DUMMY_LISTINGS) {
    const { imageUrls, originalPrice, ...rest } = listing;
    const created = await prisma.listing.create({
      data: {
        ...rest,
        original_price: originalPrice,
        seller_id: user.id,
        status: 'active',
        images: {
          create: imageUrls.map((url, position) => ({ url, position })),
        },
      },
    });
    console.log(`  Created listing: ${created.title} (${created.id})`);
  }

  for (const review of DUMMY_REVIEWS) {
    const created = await prisma.review.create({
      data: {
        seller_id: user.id,
        author_name: review.authorName,
        author_user_id: null,
        rating: review.rating,
        comment: review.comment,
      },
    });
    console.log(`  Created review: ${review.authorName} - ${review.rating} stars (${created.id})`);
  }

  console.log(`\nDone! Added ${DUMMY_LISTINGS.length} listings and ${DUMMY_REVIEWS.length} reviews for ${user.email}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
