"use client";

import Image from "next/image";

interface Props {
  name: string;
  imageUrl: string;
}

const CardImage = ({ imageUrl, name }: Props) => {
  return (
    <Image
      src={imageUrl}
      alt={name}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12.5vw"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "/placeholder-card.png"; // フォールバック画像
      }}
    />
  );
};

export default CardImage;
