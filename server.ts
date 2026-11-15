import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initializeDatabase, queryAll } from './server/db';
import { apiRouter } from './server/routes';
import { UPLOADS_DIR } from './server/upload';
import type { Berita } from './src/types/village';

dotenv.config();

async function startServer() {
  initializeDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser());

  // Serve uploaded files and generated assets cleanly
  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));

  // SEO: Dynamic robots.txt and sitemap.xml
  app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${baseUrl}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const staticRoutes = ['', '/profil', '/pemerintahan', '/berita', '/pengumuman', '/statistik', '/pelayanan', '/potensi', '/agenda', '/galeri', '/kontak'];
    const news = queryAll<Pick<Berita, 'slug' | 'tanggal_publikasi'>>("SELECT slug, tanggal_publikasi FROM berita WHERE status = 'Dipublikasikan'");
    const urls = [
      ...staticRoutes.map((r) => `<url><loc>${baseUrl}${r}</loc><changefreq>weekly</changefreq></url>`),
      ...news.map((n) => `<url><loc>${baseUrl}/berita/${n.slug}</loc><lastmod>${n.tanggal_publikasi}</lastmod></url>`),
    ].join('');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  });

  // REST API routes
  app.use('/api', apiRouter);

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Sistem Informasi Desa Pinangsari berjalan di http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Gagal menjalankan server:', err);
  process.exit(1);
});
