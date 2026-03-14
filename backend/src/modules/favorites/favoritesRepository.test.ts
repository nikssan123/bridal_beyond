jest.mock('../../prisma', () => ({
  prisma: {
    favorite: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    listing: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '../../prisma';
import { add, remove, findByUserId } from './favoritesRepository';

const mockPrisma = prisma as unknown as {
  favorite: { findMany: jest.Mock; create: jest.Mock; deleteMany: jest.Mock };
  listing: { findUnique: jest.Mock };
};

describe('favoritesRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('add', () => {
    it('returns false when listing does not exist', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);
      const result = await add('user-1', 'listing-1');
      expect(result).toBe(false);
      expect(mockPrisma.favorite.create).not.toHaveBeenCalled();
    });

    it('returns true and creates favorite when listing exists', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1' } as any);
      mockPrisma.favorite.create.mockResolvedValue({} as any);
      const result = await add('user-1', 'listing-1');
      expect(result).toBe(true);
      expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
        data: { user_id: 'user-1', listing_id: 'listing-1' },
      });
    });

    it('returns true on unique violation (already favorited)', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1' } as any);
      const err = new Error('Unique constraint') as Error & { code?: string };
      err.code = 'P2002';
      mockPrisma.favorite.create.mockRejectedValue(err);
      const result = await add('user-1', 'listing-1');
      expect(result).toBe(true);
    });

    it('rethrows on other errors', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1' } as any);
      mockPrisma.favorite.create.mockRejectedValue(new Error('DB error'));
      await expect(add('user-1', 'listing-1')).rejects.toThrow('DB error');
    });
  });

  describe('remove', () => {
    it('returns false when no rows deleted', async () => {
      mockPrisma.favorite.deleteMany.mockResolvedValue({ count: 0 } as any);
      const result = await remove('user-1', 'listing-1');
      expect(result).toBe(false);
    });

    it('returns true when rows deleted', async () => {
      mockPrisma.favorite.deleteMany.mockResolvedValue({ count: 1 } as any);
      const result = await remove('user-1', 'listing-1');
      expect(result).toBe(true);
      expect(mockPrisma.favorite.deleteMany).toHaveBeenCalledWith({
        where: { user_id: 'user-1', listing_id: 'listing-1' },
      });
    });
  });

  describe('findByUserId', () => {
    it('returns empty array when no favorites', async () => {
      mockPrisma.favorite.findMany.mockResolvedValue([]);
      const result = await findByUserId('user-1');
      expect(result).toEqual([]);
    });

    it('maps favorites to ListingDTO shape', async () => {
      const listing = {
        id: 'l1',
        title: 'Dress',
        description: 'Nice',
        price: 100,
        original_price: 120,
        category: 'wedding',
        size: 'M',
        condition: 'like-new',
        color: 'white',
        brand: 'X',
        bust: '32',
        waist: '28',
        hips: '36',
        length: '40',
        seller_id: 's1',
        created_at: new Date('2024-01-01'),
        images: [{ url: '/img1.jpg' }],
        seller: {
          name: 'Seller',
          avatar_url: '/av.jpg',
          location: 'Sofia',
          member_since: new Date('2020-01-01'),
          email_verified_at: new Date(),
          reviewsReceived: [{ rating: 5 }],
          listings: [{ id: 'l1' }],
        },
      };
      mockPrisma.favorite.findMany.mockResolvedValue([
        { listing: { ...listing, seller: { ...listing.seller, listings: [{}] } } },
      ] as any);
      const result = await findByUserId('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('l1');
      expect(result[0].title).toBe('Dress');
      expect(result[0].price).toBe(100);
      expect(result[0].seller.name).toBe('Seller');
    });
  });
});
