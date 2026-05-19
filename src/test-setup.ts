import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock the Power Apps SDK data module — it has ESM resolution issues in jsdom
vi.mock('@microsoft/power-apps/data', () => ({
  getClient: () => ({
    createRecordAsync: vi.fn(),
    updateRecordAsync: vi.fn(),
    deleteRecordAsync: vi.fn(),
    retrieveRecordAsync: vi.fn(),
    retrieveMultipleRecordsAsync: vi.fn().mockResolvedValue({ data: [] }),
    executeAsync: vi.fn(),
  }),
}));
