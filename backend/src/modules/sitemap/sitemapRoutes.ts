import { Router } from 'express';
import { env } from '../../config/env';
import { list } from '../listings/listingsRepository';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const baseUrl = env.clientUrl.replace(/\/+$/, '');

    const staticUrls = [
      '/',
      '/listings',
      '/terms',
      '/privacy',
    ];

    const urls: string[] = [];

    for (const path of staticUrls) {
      urls.push(
        `<url><loc>${baseUrl}${path}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
      );
    }

    const { listings } = await list({
      status: 'active',
      limit: 5000,
      offset: 0,
    });

    const now = new Date().toISOString();

    for (const listing of listings) {
      urls.push(
        `<url><loc>${baseUrl}/listings/${listing.id}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      urls.join('') +
      `</urlset>`;

    res.header('Content-Type', 'application/xml').send(xml);
  } catch (e) {
    next(e);
  }
});

export default router;

