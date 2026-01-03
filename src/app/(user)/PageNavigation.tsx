import ActionCard from "@/components/ui/ActionCard.client";
import { BookUp2, ChessPawn, Crown } from "lucide-react";

interface Props {
  commander?: boolean;
  normals?: boolean;
  combos?: boolean;
}

const PageNavigation = ({ commander, normals, combos }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {commander ? (
        <ActionCard
          title="統率者"
          icon={<Crown className="text-orange-500" />}
          href="/commanders/wubrg"
        />
      ) : null}
      {normals ? (
        <ActionCard
          title="通常カード"
          icon={<ChessPawn className="text-pink-600" />}
          href="/normals/wubrg"
        />
      ) : null}
      {combos ? (
        <ActionCard
          title="コンボ"
          icon={<BookUp2 className="text-green-600" />}
          href="/combos/wubrg"
        />
      ) : null}
    </div>
  );
};

export default PageNavigation;
