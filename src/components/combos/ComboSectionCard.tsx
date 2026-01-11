import {
  Combo,
  comboDescriptionJa,
  comboNotablePrerequisitesJa,
  comboUnTranslated,
} from "@/domain/entity/combo";
import SectionCard from "@/components/ui/SectionCard";
import Link from "next/link";
import { cardNameJa, newCardId } from "@/domain/entity/card";
import InfoDisplay from "@/components/ui/InfoDisplay";
import ColorIdentityBadges from "@/components/ui/ColorIdentityBadges.client";
import CardImage from "@/components/cards/CardImage.client";
import { ComponentProps } from "react";
import ExpandToggleContainer from "@/components/combos/ExpandToggleContainer.client";

interface Props {
  combo: Combo;
  cardPathFactory: (id: string) => ComponentProps<typeof Link>["href"];
  size?: "sm" | "md";
  footerActions?: ComponentProps<typeof SectionCard>["footerActions"];
}

const ComboSectionCard = ({ combo, cardPathFactory, size = "md", footerActions }: Props) => {
  const sectionTitle = combo.uses.map((use) => cardNameJa(use.card.relation)).join(" & ");
  const sectionSubtitle = `${combo.id}${comboUnTranslated(combo) ? " untranslated" : ""}`;

  if (size === "sm") {
    return (
      <SectionCard title={sectionTitle} subtitle={sectionSubtitle} footerActions={footerActions}>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-5">
          {combo.uses.map((use) => (
            <Link key={use.card.id} href={cardPathFactory(newCardId(use.card.relation.name))}>
              <CardImage card={use.card.relation} />
            </Link>
          ))}
          {combo.requires?.map((req) => (
            <div
              key={req.template.id}
              className="relative bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center p-2 text-center text-xs"
              style={{ aspectRatio: "63/88" }}
            >
              <div className="font-bold text-gray-700 dark:text-gray-200">
                {req.template.name}
              </div>
              <div className="text-gray-500 dark:text-gray-400">x{req.quantity}</div>
            </div>
          ))}
        </div>
        <ExpandToggleContainer>
          <div className="flex flex-col gap-2">
            <InfoDisplay label="Color Identity">
              <ColorIdentityBadges colorIdentity={combo.identity} />
            </InfoDisplay>
            <InfoDisplay label="Prerequisites">{comboNotablePrerequisitesJa(combo)}</InfoDisplay>
            <InfoDisplay label="Produces">
              <ul>
                {combo.produces.map((p) => (
                  <li key={p.feature.id}>{p.feature.name}</li>
                ))}
              </ul>
            </InfoDisplay>
            <ol className="list-decimal list-inside">
              {comboDescriptionJa(combo)
                .split("\n")
                .map((line, idx) => (
                  <li key={idx} className="mb-2">
                    {line}
                  </li>
                ))}
            </ol>
          </div>
        </ExpandToggleContainer>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={sectionTitle} subtitle={sectionSubtitle} footerActions={footerActions}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {combo.uses.map((use) => (
          <CardImage
            key={use.card.id}
            href={`/admin/cards/${newCardId(use.card.name)}`}
            card={use.card.relation}
          />
        ))}
        {combo.requires?.map((req) => (
          <div
            key={req.template.id}
            className="relative bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center p-2 text-center text-xs"
            style={{ aspectRatio: "63/88" }}
          >
            <div className="font-bold text-gray-700 dark:text-gray-200">{req.template.name}</div>
            <div className="text-gray-500 dark:text-gray-400">x{req.quantity}</div>
          </div>
        ))}
      </div>
      <InfoDisplay label="Color Identity">
        <ColorIdentityBadges colorIdentity={combo.identity} />
      </InfoDisplay>
      <InfoDisplay label="Prerequisites">{comboNotablePrerequisitesJa(combo)}</InfoDisplay>
      <InfoDisplay label="Produces">
        <ul>
          {combo.produces.map((p) => (
            <li key={p.feature.id}>{p.feature.name}</li>
          ))}
        </ul>
      </InfoDisplay>
      <ol className="list-decimal list-inside">
        {comboDescriptionJa(combo)
          .split("\n")
          .map((line, idx) => (
            <li key={idx} className="mb-2">
              {line}
            </li>
          ))}
      </ol>
    </SectionCard>
  );
};

export default ComboSectionCard;
