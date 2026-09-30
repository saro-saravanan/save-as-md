import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { getHandle, setHandle, deleteHandle } from '../src/lib/handle-store.js';

describe('handle store', () => {
  it('stores, reads and deletes by key', async () => {
    await setHandle('default', { name: 'Clips' });
    expect(await getHandle('default')).toEqual({ name: 'Clips' });
    await deleteHandle('default');
    expect(await getHandle('default')).toBeUndefined();
  });
});
