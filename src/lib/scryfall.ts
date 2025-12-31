interface ScryfallCard {
  name: string;
  set: string;
  collector_number: string;
  lang: string;
  oracle_id: string; // 紐付けに必須
  printed_name?: string;
  printed_text?: string;
  oracle_text?: string;
  image_uris?: {
    normal: string;
    png: string;
  };
}

interface CardResponse {
  en: ScryfallCard;
  ja?: ScryfallCard;
}

/**
 * Scryfall 推奨の待機時間 (50-100ms) を作るためのユーティリティ
 */
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * カード名から英語版と日本語版の情報を取得する (Fetch API 版)
 */
export const fetchCardInfoEnJa = async (cardName: string): Promise<CardResponse> => {
  const baseUrl = "https://api.scryfall.com";

  // 1. 英語版を exact 検索で取得
  const enUrl = `${baseUrl}/cards/named?exact=${encodeURIComponent(cardName)}`;
  const enRes = await fetch(enUrl);

  if (!enRes.ok) {
    if (enRes.status === 404) {
      throw new Error(`Card not found: ${cardName}`);
    }
    throw new Error(`Scryfall API error: ${enRes.status}`);
  }

  const enData: ScryfallCard = await enRes.json();

  // Scryfall API の推奨に従い、次のリクエスト前に少し待機
  await sleep(100);

  // 2. oracle_id を使って日本語版を検索
  let jaData: ScryfallCard | undefined = undefined;

  // 検索クエリ: oracle_id が一致し、かつ言語が日本語のものを「印刷単位」で探す
  const jaQuery = `oracle_id:${enData.oracle_id} lang:ja`;
  const jaSearchUrl = `${baseUrl}/cards/search?q=${encodeURIComponent(jaQuery)}&unique=prints`;

  try {
    const jaRes = await fetch(jaSearchUrl);

    if (jaRes.ok) {
      const searchResult = await jaRes.json();
      if (searchResult.data && searchResult.data.length > 0) {
        // リストの先頭（最新セットなど）を日本語版データとして採用
        jaData = searchResult.data[0];
      }
    }
  } catch (error) {
    // ネットワークエラー等の場合。日本語版がない(404)場合は jaRes.ok が false になるだけでここは通りません。
    console.error("Search request failed", error);
  }

  return {
    en: enData,
    ja: jaData,
  };
};
