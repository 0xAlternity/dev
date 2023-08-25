import React from "react";
import { Flex } from "theme-ui";

import { LiquityStoreState } from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";
import { GT } from "../../../strings";

const selector = ({ airdropClaimableLQTY }: LiquityStoreState) => ({
  airdropClaimableLQTY
});

export const ClaimableLQTY: React.FC = () => {
  const { airdropClaimableLQTY } = useLiquitySelector(selector);
  console.log("airdropClaimableLQTY", airdropClaimableLQTY.toString());

  return (
    <Flex sx={{ mr: 2, fontSize: 2, fontWeight: "medium" }}>
      {airdropClaimableLQTY.prettify(0)} {GT}
    </Flex>
  );
};
