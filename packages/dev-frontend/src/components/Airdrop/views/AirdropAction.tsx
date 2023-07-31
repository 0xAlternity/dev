import { Button } from "theme-ui";

import { useLiquity } from "../../../hooks/LiquityContext";
import { useTransactionFunction } from "../../Transaction";

type AirdropActionProps = {
  transactionId: string;
  disabled?: boolean;
};

const AirdropAction: React.FC<AirdropActionProps> = ({ transactionId, disabled }) => {
  const {
    liquity: { send: liquity }
  } = useLiquity();

  const [sendTransaction] = useTransactionFunction(
    transactionId,
    liquity.claimAirdrop.bind(liquity)
  );

  return (
    <Button disabled={disabled} onClick={sendTransaction}>
      Claim
    </Button>
  );
};

export default AirdropAction;
