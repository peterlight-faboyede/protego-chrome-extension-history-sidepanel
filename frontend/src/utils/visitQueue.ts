import { VisitCreate } from '../api/client';

const QUEUE_KEY = 'visitQueue';

export const visitQueue = {
  async add(visit: VisitCreate): Promise<void> {
    const { [QUEUE_KEY]: queue = [] } = await chrome.storage.local.get([QUEUE_KEY]);
    queue.push({ ...visit, timestamp: Date.now() });
    await chrome.storage.local.set({ [QUEUE_KEY]: queue });
  },

  async getAll(): Promise<Array<VisitCreate & { timestamp: number }>> {
    const { [QUEUE_KEY]: queue = [] } = await chrome.storage.local.get([QUEUE_KEY]);
    return queue;
  },

  async getByUrl(url: string): Promise<Array<VisitCreate & { timestamp: number }>> {
    const queue = await this.getAll();
    const data = queue.filter(v => v.url === url);
    return data;
  },

  async clear(count?: number): Promise<void> {
    if (count === undefined) {
      await chrome.storage.local.remove([QUEUE_KEY]);
      return;
    }
    const queue = await this.getAll();
    await chrome.storage.local.set({ [QUEUE_KEY]: queue.slice(count) });
  },

  async count(): Promise<number> {
    const queue = await this.getAll();
    return queue.length;
  }
};

