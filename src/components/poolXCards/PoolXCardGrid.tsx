import { PoolXCard } from "@/domain/entity/poolXCard";
import TagBadge from "@/components/ui/TagBadge.client";
import CardImage from "@/components/cards/CardImage.client";
import Link from "next/link";
import { cardNameJa, newCardId } from "@/domain/entity/card";

interface Props {
  poolXCards: PoolXCard[];
}

const PoolXCardGrid = ({ poolXCards }: Props) => {
  if (poolXCards.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">カードがありません</p>
          <p className="text-sm mt-1">プールにカードが登録されていません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {poolXCards.map((poolXCard) => (
        <Link key={poolXCard.name} href={`/admin/cards/${newCardId(poolXCard.name)}`}>
          <div className="flex flex-col space-y-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            <CardImage card={poolXCard.card} />

            <div className="p-3 space-y-2">
              <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight">
                {cardNameJa(poolXCard.card)}
              </h3>
              {poolXCard.commander && (
                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                  統率者
                </span>
              )}

              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">CMC: {poolXCard.card.cmc}</span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {poolXCard.card.type}
              </div>

              {poolXCard.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {poolXCard.tags.slice(0, 2).map((tag) => (
                    <TagBadge key={tag} size="sm">
                      {tag}
                    </TagBadge>
                  ))}
                  {poolXCard.tags.length > 2 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{poolXCard.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default PoolXCardGrid;
