import React, { useEffect, useMemo, useState } from "react";
import { Card, Heading, Box, Flex } from "theme-ui";

import { LiquityStoreState } from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { GT } from "../../../strings";
import { InfoMessage } from "../../InfoMessage";
import { ClaimableLQTY } from "./ClaimableLQTY";
import AirdropAction from "./AirdropAction";
import { LoadingOverlay } from "../../LoadingOverlay";
import { useMyTransactionState } from "../../Transaction";

const selector = ({ airdropClaimableLQTY, airdropHasClaimed }: LiquityStoreState) => ({
  airdropClaimableLQTY,
  airdropHasClaimed
});

const transactionId = "airdrop";

const View: React.FC = () => {
  const { airdropClaimableLQTY, airdropHasClaimed } = useLiquitySelector(selector);
  const [changePending, setChangePending] = useState(false);

  const canClaim = useMemo(
    () => !airdropClaimableLQTY.isZero && !airdropHasClaimed,
    [airdropClaimableLQTY, airdropHasClaimed]
  );

  const myTransactionState = useMyTransactionState(transactionId);
  useEffect(() => {
    if (myTransactionState.type === "waitingForConfirmation") {
      setChangePending(true);
    } else if (myTransactionState.type === "failed" || myTransactionState.type === "cancelled") {
      setChangePending(false);
    } else if (myTransactionState.type === "confirmed") {
      setChangePending(false);
    }
  }, [myTransactionState.type, setChangePending]);

  return (
    <Card>
      <Heading>
        {GT} Aidrop
        <Flex sx={{ justifyContent: "flex-end" }}>
          <ClaimableLQTY />
        </Flex>
      </Heading>
      <Box sx={{ p: [2, 3] }}>
        <InfoMessage title={`You are eligible for ${GT} airdrop.`} />

        <Flex variant="layout.actions">
          <AirdropAction transactionId={transactionId} disabled={!canClaim} />
        </Flex>
      </Box>

      {changePending && <LoadingOverlay />}
    </Card>
  );
};

export default View;
