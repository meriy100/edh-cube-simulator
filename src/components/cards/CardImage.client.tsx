"use client";

import Image from "next/image";
import { Card, cardImageBackUrl, cardImageUrl } from "@/domain/entity/card";

interface Props {
  card: Card;
  back?: boolean;
}

const CardImage = ({ card, back }: Props) => {
  const imageUrl = back ? cardImageBackUrl(card) : cardImageUrl(card);

  return (
    <div className="relative bg-gray-200 dark:bg-gray-700" style={{ aspectRatio: "63/88" }}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={card.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12.5vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder-card.png"; // フォールバック画像
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          画像が利用できません
        </div>
      )}
    </div>
  );
};

export default CardImage;
