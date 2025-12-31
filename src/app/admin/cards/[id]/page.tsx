import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { fetchCard } from "@/repository/cards";
import CardImage from "@/components/cards/CardImage.client";
import ColorIdentityBadges from "@/components/ui/ColorIdentityBadges.client";
import RefetchScryfallButton from "@/app/admin/cards/[id]/RefetchScryfallButton.client";

interface Props {
  params: Promise<{ id: string }>;
}
const AdminCardShowPage = async ({ params }: Props) => {
  const { id } = await params;
  const card = await fetchCard(id);

  return (
    <div className="space-y-6">
      <PageHeader title={card.name} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SectionCard title="カード画像">
            <div className="relative bg-gray-200 dark:bg-gray-700" style={{ aspectRatio: "63/88" }}>
              {card.originalImageUrl ? (
                <CardImage imageUrl={card.originalImageUrl} name={card.name} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  画像が利用できません
                </div>
              )}
            </div>
          </SectionCard>

          {card.originalImageBackUrl && (
            <SectionCard title="裏面画像">
              <div
                className="relative bg-gray-200 dark:bg-gray-700"
                style={{ aspectRatio: "63/88" }}
              >
                <CardImage imageUrl={card.originalImageBackUrl} name={`${card.name} (裏面)`} />
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="基本情報">
            <p>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                Mana Value:
              </span>
              <span className="text-sm font-medium">{card.cmc}</span>
            </p>
            <p>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                Type:
              </span>
              <span className="text-sm font-medium">{card.type}</span>
            </p>
            <ColorIdentityBadges colorIdentity={card.colorIdentity || []} />
            <div className="flex justify-end">
              <RefetchScryfallButton name={card.name} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default AdminCardShowPage;
