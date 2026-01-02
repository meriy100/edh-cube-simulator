import PageHeader from "@/components/ui/PageHeader";
import Alert from "@/components/ui/Alert.client";
import ActionCard from "@/components/ui/ActionCard.client";
import { BookUp2, ChessPawn, Crown } from "lucide-react";
import { fetchPublishedPool } from "@/repository/pools";

const Home = async () => {
  const current = await fetchPublishedPool();

  if (!current) {
    return <Alert variant="error">No published pools</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`EDH Cube v${current.version}`} />
      <ActionCard
        title="統率者"
        description="金シールが貼ってある統率者のプール"
        icon={<Crown className="text-orange-500" />}
        href="/commanders/wubrg"
      />
      <ActionCard
        title="通常カード"
        description="シールなしのカードプール"
        icon={<ChessPawn className="text-pink-600" />}
        href="/normals/wubrg"
      />
      <ActionCard
        title="コンボ"
        description="プールで成立するコンボ集"
        icon={<BookUp2 className="text-green-600" />}
        href="/combos/wubrg"
      />
    </div>
  );
};

export default Home;
