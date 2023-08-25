import { Container } from "theme-ui";
import { SystemStats } from "../components/SystemStats";
import { Airdrop as AirdropPanel } from "../components/Airdrop/Airdrop";

export const Airdrop: React.FC = () => (
  <Container variant="columns" sx={{ justifyContent: "flex-start" }}>
    <Container variant="left">
      <AirdropPanel />
    </Container>

    <Container variant="right">
      <SystemStats />
    </Container>
  </Container>
);
