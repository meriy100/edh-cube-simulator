import { v5 as uuidv5 } from "uuid";
import { ScryfallCard } from "@/lib/scryfall";

const NAMESPACE_MTG = "44869818-5a23-4709-906d-669528d229f3";

export type Color = "W" | "U" | "B" | "R" | "G" | "C";

export interface Card {
  name: string;
  cmc: number;
  type: string;
  set: string;
  collectorNumber: string;
  originalImageUrl?: string;
  originalImageBackUrl?: string;
  scryfall?: ScryfallCard;
  scryfallJa?: ScryfallCard;
}

export const newCardId = (name: string) => {
  const normalizedName = name.trim().toLowerCase();
  return uuidv5(normalizedName, NAMESPACE_MTG);
};

export const cardNameJa = (card: Card): string => {
  if (card.scryfallJa) {
    return (
      card.scryfallJa.printed_name ??
      card.scryfallJa.card_faces?.map((f) => f.printed_name ?? "").join(" / ") ??
      card.name
    );
  }
  return card.name;
};

export const cardImageUrl = (card: Card): string | undefined => {
  if (card.originalImageUrl?.match(/cards.scryfall.io/)) {
    return card.originalImageUrl;
  }
  if (card.scryfallJa?.image_uris?.large) {
    return card.scryfallJa.image_uris.large;
  }
  if (card.scryfallJa?.card_faces?.[0]?.image_uris?.large) {
    return card.scryfallJa.card_faces[0].image_uris.large;
  }

  if (card.scryfall?.image_uris?.large) {
    return card.scryfall.image_uris.large;
  }

  if (card.scryfall?.card_faces?.[0]?.image_uris?.large) {
    return card.scryfall.card_faces[0].image_uris.large;
  }
};

export const cardImageBackUrl = (card: Card): string | undefined => {
  if (card.originalImageBackUrl?.match(/cards.scryfall.io/)) {
    return card.originalImageBackUrl;
  }

  if (card.scryfallJa?.card_faces?.[1]?.image_uris?.large) {
    return card.scryfallJa.card_faces[1].image_uris.large;
  }

  if (card.scryfall?.card_faces?.[1]?.image_uris?.large) {
    return card.scryfall.card_faces[1].image_uris.large;
  }
};

export const cardColorIdentity = (card: Card): Color[] | undefined => {
  if (card.scryfall) {
    return card.scryfall.color_identity;
  }

  return undefined;
};

export const isCardMultiFaces = (card: Card): boolean =>
  (card.scryfall?.card_faces?.length ?? 0) > 1;

export const cardOracle = (card: Card): string | undefined => {
  if (card.scryfallJa) {
    return card.scryfallJa.printed_text ?? card.scryfallJa.oracle_text;
  }
  if (card.scryfall) {
    return card.scryfall.oracle_text;
  }
  return undefined;
};

export const cardOracleFront = (card: Card): string | undefined => {
  if (card.scryfallJa?.card_faces) {
    const front = card.scryfallJa?.card_faces[0];
    if (front) {
      return front.printed_text ?? front.oracle_text;
    }
  }
  if (card.scryfall?.card_faces) {
    const front = card.scryfall?.card_faces[0];
    if (front) {
      return front.printed_text ?? front.oracle_text;
    }
  }

  return undefined;
};

export const cardOracleBack = (card: Card): string | undefined => {
  if (card.scryfallJa?.card_faces) {
    const front = card.scryfallJa?.card_faces[1];
    if (front) {
      return front.printed_text ?? front.oracle_text;
    }
  }
  if (card.scryfall?.card_faces) {
    const front = card.scryfall?.card_faces[1];
    if (front) {
      return front.printed_text ?? front.oracle_text;
    }
  }

  return undefined;
};
