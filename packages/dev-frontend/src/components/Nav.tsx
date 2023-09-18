import { Flex, Box, NavLink } from "theme-ui";
import { Link } from "./Link";

export const Nav: React.FC = () => {
  return (
    <Box as="nav" sx={{ display: ["none", "flex"], alignItems: "center", flex: 1 }}>
      <Flex>
        <Link to="/">Dashboard</Link>
        <Link sx={{ fontSize: 1 }} to="/airdrop">
          Airdrop
        </Link>
        {/* <NavLink sx={{ fontSize: 1 }} href="https://balancer.fi" target="_blank">
          Farm ➡️
        </NavLink> */}
        <Link sx={{ fontSize: 1 }} to="/risky-troves">
          Troves
        </Link>
        <Link sx={{ fontSize: 1 }} to="/redemption">
          Redemption
        </Link>
      </Flex>
    </Box>
  );
};
