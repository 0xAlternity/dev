import React from "react";
import { Card, Heading, Link, Box, Text, Button } from "theme-ui";
import { AddressZero } from "@ethersproject/constants";
import { Decimal, Percent, LiquityStoreState } from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { useLiquity } from "../hooks/LiquityContext";
import { COIN, GT } from "../strings";
import { Statistic } from "./Statistic";

const selectBalances = ({ accountBalance, lusdBalance, lqtyBalance }: LiquityStoreState) => ({
  accountBalance,
  lusdBalance,
  lqtyBalance
});

const Balances: React.FC = () => {
  const { accountBalance, lusdBalance, lqtyBalance } = useLiquitySelector(selectBalances);

  return (
    <Box sx={{ mb: 3 }}>
      <Heading>My Account Balances</Heading>
      <Statistic name="ETH"> {accountBalance.prettify(4)}</Statistic>
      <Statistic name={COIN}> {lusdBalance.prettify()}</Statistic>
      <Statistic name={GT}>{lqtyBalance.prettify()}</Statistic>
    </Box>
  );
};

const GitHubCommit: React.FC<{ children?: string }> = ({ children }) =>
  children?.match(/[0-9a-f]{40}/) ? (
    <Link href={`https://github.com/AlternityF/dev/commit/${children}`}>
      {children.substr(0, 7)}
    </Link>
  ) : (
    <>unknown</>
  );
const TokenLink: React.FC<{ name: string; address: string }> = ({ name, address }) =>
  address?.match(/[0-9a-fA-F]{40}/) ? (
    <Link sx={{ fontWeight: 400 }} href={`https://etherscan.com/address/${address}`} target="_blank">
      {name}
    </Link>
  ) : (
    <>unknown</>
  );

type SystemStatsProps = {
  variant?: string;
  showBalances?: boolean;
};

const select = ({
  numberOfTroves,
  price,
  total,
  lusdInStabilityPool,
  borrowingRate,
  redemptionRate,
  totalStakedLQTY,
  frontend
}: LiquityStoreState) => ({
  numberOfTroves,
  price,
  total,
  lusdInStabilityPool,
  borrowingRate,
  redemptionRate,
  totalStakedLQTY,
  kickbackRate: frontend.status === "registered" ? frontend.kickbackRate : null
});

export const SystemStats: React.FC<SystemStatsProps> = ({ variant = "info", showBalances }) => {
  const {
    liquity: {
      connection: { version: contractsVersion, deploymentDate, frontendTag, addresses }
    }
  } = useLiquity();

  const {
    numberOfTroves,
    price,
    lusdInStabilityPool,
    total,
    borrowingRate,
    totalStakedLQTY,
    kickbackRate
  } = useLiquitySelector(select);

  const lusdInStabilityPoolPct =
    total.debt.nonZero && new Percent(lusdInStabilityPool.div(total.debt));
  const totalCollateralRatioPct = new Percent(total.collateralRatio(price));
  const borrowingFeePct = new Percent(borrowingRate);
  const kickbackRatePct = frontendTag === AddressZero ? "100" : kickbackRate?.mul(100).prettify();

  const lcnyOptions = {
    address: addresses["lusdToken"],
    symbol: COIN,
    decimals: 18,
    image: "https://alternity.finance/lcny_x200.png"
  };

  const altrOption = {
    address: addresses["lqtyToken"],
    symbol: GT,
    decimals: 18,
    image: "https://alternity.finance/altr_x200.png"
  };

  const handleAddTokenClick = async (options: any) => {
    try {
      await window?.ethereum?.request!({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Card {...{ variant }}>
      {showBalances && <Balances />}

      <Heading>Statistics</Heading>

      <Heading as="h2" sx={{ mt: 3, fontWeight: "body" }}>
        Protocol
      </Heading>

      <Statistic
        name="Borrowing Fee"
        tooltip={`The Borrowing Fee is a one-off fee charged as a percentage of the borrowed amount (in ${COIN}) and is part of a Trove's debt. The fee varies between 0.5% and 5% depending on ${COIN} redemption volumes.`}
      >
        {borrowingFeePct.toString(2)}
      </Statistic>

      <Statistic
        name="TVL"
        tooltip="The Total Value Locked (TVL) is the total value of Ether locked as collateral in the system, given in ETH and CNY."
      >
        {total.collateral.shorten()} <Text sx={{ fontSize: 1 }}>&nbsp;ETH</Text>
        <Text sx={{ fontSize: 1 }}>
          &nbsp;(¥{Decimal.from(total.collateral.mul(price)).shorten()})
        </Text>
      </Statistic>
      <Statistic name="Troves" tooltip="The total number of active Troves in the system.">
        {Decimal.from(numberOfTroves).prettify(0)}
      </Statistic>
      <Statistic
        name={`${COIN} supply`}
        tooltip={`The total ${COIN} minted by the Alternity Protocol.`}
      >
        {total.debt.shorten()}
      </Statistic>
      {lusdInStabilityPoolPct && (
        <Statistic
          name={`${COIN} in Stability Pool`}
          tooltip={`The total ${COIN} currently held in the Stability Pool, expressed as an amount and a fraction of the ${COIN} supply.
          `}
        >
          {lusdInStabilityPool.shorten()}
          <Text sx={{ fontSize: 1 }}>&nbsp;({lusdInStabilityPoolPct.toString(1)})</Text>
        </Statistic>
      )}
      <Statistic
        name={`Staked ${GT}`}
        tooltip={`The total amount of ${GT} that is staked for earning fee revenue.`}
      >
        {totalStakedLQTY.shorten()}
      </Statistic>
      <Statistic
        name="Total Collateral Ratio"
        tooltip={`The ratio of the Yuan value of the entire system collateral at the current ETH:CNY price, to the entire system debt.`}
      >
        {totalCollateralRatioPct.prettify()}
      </Statistic>
      <Statistic
        name="Recovery Mode"
        tooltip="Recovery Mode is activated when the Total Collateral Ratio (TCR) falls below 150%. When active, your Trove can be liquidated if its collateral ratio is below the TCR. The maximum collateral you can lose from liquidation is capped at 110% of your Trove's debt. Operations are also restricted that would negatively impact the TCR."
      >
        {total.collateralRatioIsBelowCritical(price) ? <Box color="danger">Yes</Box> : "No"}
      </Statistic>
      {}

      <Heading as="h2" sx={{ mt: 3, fontWeight: "body" }}>
        Tokens
      </Heading>
      <Statistic name={<TokenLink name={COIN} address={addresses.lusdToken} />}>
        <Link
          href="#"
          sx={{ fontSize: 1, fontWeight: 400, p: 1, px: 3 }}
          onClick={event => {
            handleAddTokenClick(lcnyOptions);
            event.stopPropagation();
          }}
        >
          Add to wallet
        </Link>
      </Statistic>
      <Statistic name={<TokenLink name={GT} address={addresses.lqtyToken} />}>
        <Link
          href="#"
          sx={{ fontSize: 1, fontWeight: 400, p: 1, px: 3 }}
          onClick={event => {
            handleAddTokenClick(altrOption);
            event.stopPropagation();
          }}
        >
          Add to wallet
        </Link>
      </Statistic>

      <Heading as="h2" sx={{ mt: 3, fontWeight: "body" }}>
        Frontend
      </Heading>
      {kickbackRatePct && (
        <Statistic
          name="Kickback Rate"
          tooltip="A rate between 0 and 100% set by the Frontend Operator that determines the fraction of LQTY that will be paid out as a kickback to the Stability Providers using the frontend."
        >
          {kickbackRatePct}%
        </Statistic>
      )}

      <Box sx={{ mt: 3, opacity: 0.66 }}>
        <Box sx={{ fontSize: 0 }}>
          Contracts version: <GitHubCommit>{contractsVersion}</GitHubCommit>
        </Box>
        <Box sx={{ fontSize: 0 }}>Deployed: {deploymentDate.toLocaleString()}</Box>
        <Box sx={{ fontSize: 0 }}>
          Frontend version:{" "}
          {process.env.NODE_ENV === "development" ? (
            "development"
          ) : (
            <GitHubCommit>{process.env.REACT_APP_VERSION}</GitHubCommit>
          )}
        </Box>
      </Box>
    </Card>
  );
};
