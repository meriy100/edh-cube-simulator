import PageHeader from "@/components/ui/PageHeader";
import { fetchPools } from "@/repository/pools";
import Alert from "@/components/ui/Alert.client";
import ActionCard from "@/components/ui/ActionCard.client";
import { BookUp2, ChessPawn, Crown } from "lucide-react";
import Link from "next/link";

const CommandersPage = async () => {
  const pools = await fetchPools({ published: true });
  const current = pools[0];

  if (!current) {
    return <Alert variant="error">No published pools</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`EDH Cube v${current.version}`} />
      <Link href="/commanders">
        <ActionCard
          title="統率者"
          description="金シールが貼ってある統率者のプール"
          icon={<Crown className="text-orange-500" />}
        />
      </Link>
      <Link href="/normals">
        <ActionCard
          title="通常カード"
          description="シールなしのカードプール"
          icon={<ChessPawn className="text-pink-600" />}
        />
      </Link>
      <Link href="/combos">
        <ActionCard
          title="コンボ"
          description="プールで成立するコンボ集"
          icon={<BookUp2 className="text-green-600" />}
        />
      </Link>
    </div>
  );
};

export default CommandersPage;
