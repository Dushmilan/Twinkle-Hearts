import { it, expect } from 'vitest';

it('ImageUpload module should load', async () => {
  const mod = await import('../ImageUpload');
  expect(mod.default).toBeDefined();
});