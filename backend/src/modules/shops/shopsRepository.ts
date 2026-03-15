import { prisma } from '../../prisma';
import { ShopSummary, ShopProfile, ShopProfileWithEmail, ShopStatus, ShopCreateInput } from './shopTypes';
import * as shopReviewsRepo from './shopReviewsRepository';

function toSummary(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  status: string;
  created_at: Date;
  _count?: { listings: number };
}): ShopSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    address: row.address,
    status: row.status as ShopStatus,
    listingsCount: row._count?.listings ?? 0,
    createdAt: row.created_at.toISOString(),
  };
}

export async function create(ownerId: string, data: ShopCreateInput): Promise<ShopSummary> {
  const shop = await prisma.shop.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      address: data.address ?? null,
      logo_url: data.logoUrl ?? null,
      owner_id: ownerId,
      status: 'pending',
    },
    include: { _count: { select: { listings: true } } },
  });
  return toSummary({ ...shop, _count: shop._count });
}

export async function findById(id: string): Promise<ShopProfile | null> {
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { listings: true } },
    },
  });
  if (!shop) return null;
  const reviewSummary = await shopReviewsRepo.getStatsByShopId(shop.id);
  return {
    ...toSummary({ ...shop, _count: shop._count }),
    ownerName: shop.owner.name,
    ownerId: shop.owner.id,
    reviewSummary: { averageRating: reviewSummary.averageRating, count: reviewSummary.count },
  };
}

export async function findBySlug(slug: string): Promise<ShopProfile | null> {
  const shop = await prisma.shop.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { listings: true } },
    },
  });
  if (!shop) return null;
  const reviewSummary = await shopReviewsRepo.getStatsByShopId(shop.id);
  return {
    ...toSummary({ ...shop, _count: shop._count }),
    ownerName: shop.owner.name,
    ownerId: shop.owner.id,
    reviewSummary: { averageRating: reviewSummary.averageRating, count: reviewSummary.count },
  };
}

export async function findByOwnerId(ownerId: string): Promise<ShopProfile | null> {
  const shop = await prisma.shop.findUnique({
    where: { owner_id: ownerId },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { listings: true } },
    },
  });
  if (!shop) return null;
  return {
    ...toSummary({ ...shop, _count: shop._count }),
    ownerName: shop.owner.name,
    ownerId: shop.owner.id,
  };
}

export async function listActive(limit: number = 50): Promise<ShopSummary[]> {
  const shops = await prisma.shop.findMany({
    where: { status: 'approved' },
    take: limit,
    orderBy: { created_at: 'desc' },
    include: { _count: { select: { listings: true } } },
  });
  return shops.map((s) => toSummary({ ...s, _count: s._count }));
}

export async function listPending(limit: number = 100): Promise<ShopProfileWithEmail[]> {
  const shops = await prisma.shop.findMany({
    where: { status: 'pending' },
    take: limit,
    orderBy: { created_at: 'desc' },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { listings: true } },
    },
  });
  return shops.map((s) => ({
    ...toSummary({ ...s, _count: s._count }),
    ownerName: s.owner.name,
    ownerId: s.owner.id,
    ownerEmail: s.owner.email,
  }));
}

export async function listForAdmin(status?: string, limit: number = 100): Promise<ShopProfileWithEmail[]> {
  const where = status ? { status } : {};
  const shops = await prisma.shop.findMany({
    where,
    take: limit,
    orderBy: { created_at: 'desc' },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { listings: true } },
    },
  });
  return shops.map((s) => ({
    ...toSummary({ ...s, _count: s._count }),
    ownerName: s.owner.name,
    ownerId: s.owner.id,
    ownerEmail: s.owner.email,
  }));
}

export async function updateStatus(id: string, status: ShopStatus): Promise<ShopProfile | null> {
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { listings: true } },
    },
  });
  if (!shop || shop.status !== 'pending') return null;
  if (status !== 'approved' && status !== 'rejected') return null;
  const updated = await prisma.shop.update({
    where: { id },
    data: { status, updated_at: new Date() },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { listings: true } },
    },
  });
  return {
    ...toSummary({ ...updated, _count: updated._count }),
    ownerName: updated.owner.name,
    ownerId: updated.owner.id,
  };
}
