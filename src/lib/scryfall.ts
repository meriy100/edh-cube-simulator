import { z } from "zod";

const imageUrisSchema = z.object({
  small: z.string(),
  normal: z.string(),
  large: z.string(),
  png: z.string(),
  art_crop: z.string(),
  border_crop: z.string(),
});

const colorSchema = z.union([
  z.literal("W"),
  z.literal("U"),
  z.literal("B"),
  z.literal("R"),
  z.literal("G"),
  z.literal("C"),
]);

// 分割カードや両面カードの「各面」を表すスキーマ
const cardFaceSchema = z.object({
  name: z.string(),
  printed_name: z.string().optional(),
  printed_text: z.string().optional(),

  mana_cost: z.string().optional(),
  type_line: z.string().optional(),
  oracle_text: z.string().optional(),
  colors: z.array(colorSchema).optional(),
  power: z.string().optional(),
  toughness: z.string().optional(),
  artist: z.string().optional(),
  image_uris: imageUrisSchema.optional(), // 両面カードの場合、各面に画像がある
});

export const scryfallCardSchema = z.object({
  // 常に存在する基本識別子
  id: z.string(),
  oracle_id: z.string().optional(), // 一部の特殊カードでは無い場合がある
  name: z.string(),
  printed_name: z.string().optional(),
  printed_text: z.string().optional(),
  layout: z.enum([
    "normal",
    "split",
    "flip",
    "transform",
    "modal_dfc",
    "meld",
    "leveler",
    "class",
    "saga",
    "adventure",
    "host",
    "augment",
  ]),

  // 基本特性（単面カードの場合はここにある）
  mana_cost: z.string().optional(),
  cmc: z.number(),
  type_line: z.string(),
  oracle_text: z.string().optional(),
  colors: z.array(colorSchema).optional(),
  color_identity: z.array(colorSchema),

  // 画像（単面カードはここ、両面カードは card_faces 側にある）
  image_uris: imageUrisSchema.optional(),

  // ★重要：変則カード用の配列
  // 分割カード(split)や両面カード(transform, modal_dfc)の場合にデータが入る
  card_faces: z.array(cardFaceSchema).optional(),

  // セット・販売情報
  set: z.string(),
  set_name: z.string(),
  collector_number: z.string(),
});

export type ScryfallCard = z.infer<typeof scryfallCardSchema>;

interface CardResponse {
  en: ScryfallCard;
  ja?: ScryfallCard;
}

function findBestJapaneseCard(cards: ScryfallCard[]): ScryfallCard {
  // 1. printed_text に日本語（ひらがな・カタカナ）が含まれているものを探す
  const hasJapaneseText = (text?: string) => /[\u3040-\u309F\u30A0-\u30FF]/.test(text || "");

  // 日本語テキストがあるものを抽出
  const fullJapaneseCards = cards.filter((card) => hasJapaneseText(card.printed_text));

  if (fullJapaneseCards.length > 0) {
    // 存在するなら、その中で最新のセット（基本セットやエキスパンション）を優先
    return fullJapaneseCards[0];
  }

  // 2. 見つからなければ、仕方ないので printed_name だけでも日本語のもの
  const hasJapaneseName = cards.find((card) => hasJapaneseText(card.printed_name));

  return hasJapaneseName || cards[0];
}

/**
 * Scryfall 推奨の待機時間 (50-100ms) を作るためのユーティリティ
 */
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * カード名から英語版と日本語版の情報を取得する (Fetch API 版)
 */
export const fetchScryfall = async (cardName: string): Promise<CardResponse> => {
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

  const enData = scryfallCardSchema.parse(await enRes.json());

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
        const jaList = z.array(scryfallCardSchema).parse(searchResult.data);
        jaData = findBestJapaneseCard(jaList);
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
