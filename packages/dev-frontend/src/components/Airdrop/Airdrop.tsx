import React from "react";
import { useLiquitySelector } from "@liquity/lib-react";
import { LiquityStoreState } from "@liquity/lib-base";

import Claimed from "./views/Claimed";
import NotEligible from "./views/NotEligible";
import AirdropManager from "./views/AirdropManager";

const selector = ({ airdropClaimableLQTY, airdropHasClaimed }: LiquityStoreState) => ({
  airdropClaimableLQTY,
  airdropHasClaimed
});

export const Airdrop: React.FC = props => {
  const { airdropClaimableLQTY, airdropHasClaimed } = useLiquitySelector(selector);

  if (airdropHasClaimed) {
    return <Claimed {...props} />;
  }
  if (airdropClaimableLQTY.isZero) {
    return <NotEligible {...props} />;
  }

  return <AirdropManager {...props} />;
};
