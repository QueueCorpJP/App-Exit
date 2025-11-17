/**
 * ページ辞書ヘルパー
 * サーバーコンポーネント用
 */
export function createPageDictHelper(dict: Record<string, any>) {
  return (key: string): string => {
    const keys = key.split('.');
    let value: any = dict;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
}

/**
 * クライアントコンポーネント用のページ辞書ヘルパー
 */
export function usePageDict(dict: Record<string, any> = {}) {
  return (key: string): string => {
    const keys = key.split('.');
    let value: any = dict;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
}
