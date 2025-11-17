import { cache } from 'react';
import { getMessages } from 'next-intl/server';

/**
 * getMessages()をキャッシュ化して重複呼び出しを防ぐ
 * layout.tsxのgenerateMetadataとLocaleLayoutで共有される
 */
export const getCachedMessages = cache(async () => {
  return await getMessages();
});
