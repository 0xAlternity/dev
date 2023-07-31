import React from "react";
import { Card, Heading, Box, Flex } from "theme-ui";

import { GT } from "../../../strings";
import { InfoMessage } from "../../InfoMessage";
import { ClaimableLQTY } from "./ClaimableLQTY";

const View: React.FC = () => {
  return (
    <Card>
      <Heading>
        {GT} Aidrop
        <Flex sx={{ justifyContent: "flex-end" }}>
          <ClaimableLQTY />
        </Flex>
      </Heading>
      <Box sx={{ p: [2, 3] }}>
        <InfoMessage title={`You have already claimed your ${GT} airdrop.`} />
      </Box>
    </Card>
  );
};

export default View;
