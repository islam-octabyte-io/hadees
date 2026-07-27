import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupSwagger } from './../src/swagger';

/**
 * End-to-end coverage of the read API. These hit the real seeded Postgres
 * (DATABASE_URL), so the expected counts below are corpus facts, not fixtures:
 * 15 books, Bukhari's 7563 hadiths, HA270A as a variant narration.
 *
 *   pnpm --filter backend test:e2e
 */

interface BookRow {
  uci: string;
  slug: string;
  number: number;
}
interface KitabRow {
  uci: string;
  bookUci: string;
  numberInBook: number;
}
interface BaabRow {
  uci: string;
  kitabUci: string;
}
interface HadithRow {
  uci: string;
  baabUci: string;
  subNumber: number;
  texts: { edition: string; text: string }[];
}
interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

describe('Hadees API (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  /** supertest types `body` as `any`; this is the one place we narrow it. */
  async function get<T>(url: string, status = 200): Promise<T> {
    const res = await request(http).get(url).expect(status);
    return res.body as T;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupSwagger(app); // mounts /docs and /docs-json, exactly as main.ts does
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health', () => {
    it('reports the database as reachable', async () => {
      expect(await get('/health')).toMatchObject({ status: 'ok', db: 'up' });
    });
  });

  describe('/books', () => {
    it('lists all 15 books in canonical order', async () => {
      const books = await get<BookRow[]>('/books');
      expect(books).toHaveLength(15);
      expect(books[0]).toMatchObject({ uci: 'HZ1', slug: 'bukhari' });
    });

    it('accepts a number, slug, UCI or hadith prefix', async () => {
      for (const id of ['1', 'bukhari', 'HZ1', 'HB']) {
        expect((await get<BookRow>(`/books/${id}`)).uci).toBe('HZ1');
      }
    });

    it('404s on an unknown book', () =>
      request(http).get('/books/nope').expect(404));

    it("lists a book's kitabs in reading order", async () => {
      const kitabs = await get<KitabRow[]>('/books/bukhari/kitabs');
      expect(kitabs[0]).toMatchObject({ uci: 'HK1', numberInBook: 1 });
    });

    it("paginates a book's hadiths with a real total", async () => {
      const page = await get<Page<HadithRow>>('/books/bukhari/hadiths?limit=2');
      expect(page.data).toHaveLength(2);
      expect(page.meta).toMatchObject({
        page: 1,
        limit: 2,
        total: 7563,
        totalPages: 3782,
      });
    });
  });

  describe('/kitabs', () => {
    it('resolves the same kitab three ways', async () => {
      for (const id of ['3', 'HK3', 'bukhari:3']) {
        expect(await get<KitabRow>(`/kitabs/${id}`)).toMatchObject({
          uci: 'HK3',
          bookUci: 'HZ1',
        });
      }
    });

    it("lists a kitab's baabs", async () => {
      const baabs = await get<BaabRow[]>('/kitabs/HK1/baabs');
      expect(baabs[0]).toMatchObject({ uci: 'HY1', kitabUci: 'HK1' });
    });

    it('filters the list by book', async () => {
      const page = await get<Page<KitabRow>>('/kitabs?book=bukhari&limit=1');
      expect(page.data[0].bookUci).toBe('HZ1');
      expect(page.meta.total).toBeGreaterThan(0);
    });
  });

  describe('/baabs', () => {
    it('resolves by UCI and by nested composite', async () => {
      const byUci = await get<BaabRow>('/baabs/HY1');
      const byComposite = await get<BaabRow>('/baabs/bukhari:1:1');
      expect(byComposite.uci).toBe(byUci.uci);
    });

    it('lists the hadiths of a baab', async () => {
      const page = await get<Page<HadithRow>>('/baabs/HY1/hadiths');
      expect(page.data.length).toBeGreaterThan(0);
      expect(page.data[0].baabUci).toBe('HY1');
    });
  });

  describe('/hadiths', () => {
    it('resolves by UCI and by book:number identically', async () => {
      const byUci = await get<HadithRow>('/hadiths/HB100');
      const byRef = await get<HadithRow>('/hadiths/bukhari:100');
      expect(byRef).toEqual(byUci);
      expect(byUci.uci).toBe('HB100');
    });

    it('returns only the default edition when ?edition= is omitted', async () => {
      const hadith = await get<HadithRow>('/hadiths/HB100');
      expect(hadith.texts).toHaveLength(1);
      expect(hadith.texts[0].edition).toBe('ar-vocalized');
    });

    it('returns editions in the order requested', async () => {
      const hadith = await get<HadithRow>(
        '/hadiths/HB100?edition=ur-darussalam,ar-vocalized',
      );
      expect(hadith.texts.map((t) => t.edition)).toEqual([
        'ur-darussalam',
        'ar-vocalized',
      ]);
    });

    it('reaches a variant narration through its dotted source number', async () => {
      expect(
        await get<HadithRow>('/hadiths/aladab-almufarrad:270.1'),
      ).toMatchObject({ uci: 'HA270A', subNumber: 1 });
    });

    it('400s on an unknown edition and 404s on an unknown hadith', async () => {
      await request(http).get('/hadiths/HB100?edition=nope').expect(400);
      await request(http).get('/hadiths/HB999999').expect(404);
    });

    it('filters by baab', async () => {
      const page = await get<Page<HadithRow>>('/hadiths?baab=HY1&limit=5');
      for (const h of page.data) expect(h.baabUci).toBe('HY1');
    });

    it('rejects a limit above the cap', () =>
      request(http).get('/hadiths?limit=500').expect(400));
  });

  describe('/editions', () => {
    it('lists and filters', async () => {
      expect(await get<BookRow[]>('/editions')).toHaveLength(2);

      const urdu = await get<{ uci: string }[]>('/editions?language=ur');
      expect(urdu).toHaveLength(1);
      expect(urdu[0].uci).toBe('HE2');

      const original = await get<{ uci: string }[]>('/editions?type=original');
      expect(original).toHaveLength(1);
      expect(original[0].uci).toBe('HE1');
    });

    it('resolves by slug, number and UCI', async () => {
      for (const id of ['ur-darussalam', '2', 'HE2']) {
        expect((await get<{ uci: string }>(`/editions/${id}`)).uci).toBe('HE2');
      }
    });
  });

  describe('/docs', () => {
    it('serves the OpenAPI document covering every route', async () => {
      const doc = await get<{ paths: Record<string, unknown> }>('/docs-json');
      expect(Object.keys(doc.paths)).toEqual(
        expect.arrayContaining([
          '/books',
          '/books/{identifier}',
          '/books/{identifier}/kitabs',
          '/books/{identifier}/hadiths',
          '/kitabs',
          '/kitabs/{identifier}',
          '/kitabs/{identifier}/baabs',
          '/kitabs/{identifier}/hadiths',
          '/baabs',
          '/baabs/{identifier}',
          '/baabs/{identifier}/hadiths',
          '/hadiths',
          '/hadiths/{identifier}',
          '/editions',
          '/editions/{identifier}',
          '/health',
        ]),
      );
    });
  });
});
