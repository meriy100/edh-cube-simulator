import ActionCard from "@/components/ui/ActionCard.client";
import { BookUp2, ChessPawn, Crown, Package } from "lucide-react";

interface Props {
  commander?: boolean;
  normals?: boolean;
  combos?: boolean;
  outside?: boolean;
}

const PageNavigation = ({ commander, normals, combos, outside }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {commander ? (
        <ActionCard
          title="統率者"
          icon={<Crown className="text-orange-500" />}
          href="/commanders/wubrgc"
        />
      ) : null}
      {normals ? (
        <ActionCard
          title="通常カード"
          icon={<ChessPawn className="text-pink-600" />}
          href="/normals/wubrgc"
        />
      ) : null}
      {combos ? (
        <ActionCard
          title="コンボ"
          icon={<BookUp2 className="text-green-600" />}
          href="/combos/wubrgc"
        />
      ) : null}
      {outside ? (
        <ActionCard
          title="その他カード"
          icon={<Package className="text-purple-500" />}
          href="/outside/wubrgc"
        />
      ) : null}
    </div>
  );
};

export default PageNavigation;
