import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    query: {},
    pathname: '/',
    asPath: '/',
    back: vi.fn(),
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  }),
}));

// Mock fetch for apiFetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock supabase client
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock.supabase.co/storage/v1/object/public/attachments/test.jpg' } })),
        remove: vi.fn(),
        list: vi.fn(),
      })),
    },
  },
}));

// Mock Prisma client
vi.mock('../generated/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    note: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    folder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    attachment: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((cb: (...args: unknown[]) => unknown) => cb({ note: { findUnique: vi.fn(), delete: vi.fn() } })),
  })),
  Prisma: {
    NoteWhereInput: {},
    NoteFindManyArgs: {},
  },
}));
