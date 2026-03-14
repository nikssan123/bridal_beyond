jest.mock('../../prisma', () => ({
  prisma: {
    review: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '../../prisma';
import { listBySellerId, create } from './reviewsRepository';

const mockPrisma = prisma as unknown as {
  review: { findMany: jest.Mock; create: jest.Mock };
};

describe('reviewsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listBySellerId', () => {
    it('returns mapped ReviewDTO array', async () => {
      const rows = [
        {
          id: 'r1',
          seller_id: 's1',
          author_name: 'Alice',
          rating: 5,
          comment: 'Great',
          created_at: new Date('2024-01-15'),
        },
      ] as any[];
      mockPrisma.review.findMany.mockResolvedValue(rows);
      const result = await listBySellerId('s1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'r1',
        sellerId: 's1',
        userName: 'Alice',
        rating: 5,
        comment: 'Great',
        createdAt: '2024-01-15',
      });
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { seller_id: 's1' },
        orderBy: { created_at: 'desc' },
      });
    });

    it('returns empty array when no reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      const result = await listBySellerId('s1');
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates review and returns DTO', async () => {
      const created = {
        id: 'r1',
        seller_id: 's1',
        author_name: 'Bob',
        rating: 4,
        comment: 'Good',
        created_at: new Date('2024-01-20'),
      } as any;
      mockPrisma.review.create.mockResolvedValue(created);
      const result = await create({
        sellerId: 's1',
        authorName: 'Bob',
        rating: 4,
        comment: 'Good',
        authorUserId: 'u1',
      });
      expect(result).toEqual({
        id: 'r1',
        sellerId: 's1',
        userName: 'Bob',
        rating: 4,
        comment: 'Good',
        createdAt: '2024-01-20',
      });
      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: {
          seller_id: 's1',
          author_user_id: 'u1',
          author_name: 'Bob',
          rating: 4,
          comment: 'Good',
        },
      });
    });

    it('passes null for authorUserId when not provided', async () => {
      mockPrisma.review.create.mockResolvedValue({
        id: 'r1',
        seller_id: 's1',
        author_name: 'Anon',
        rating: 3,
        comment: 'Ok',
        created_at: new Date(),
      } as any);
      await create({
        sellerId: 's1',
        authorName: 'Anon',
        rating: 3,
        comment: 'Ok',
      });
      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          author_user_id: null,
        }),
      });
    });
  });
});
