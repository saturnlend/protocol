import { DeployFunction } from "hardhat-deploy/dist/types";
import { deploy, verifyContract } from "../utils";

const BASE_RATE_PER_YEAR = 0;
const MULTIPLIER_PER_YEAR = 49999999998268800n;
const JUMP_MULTIPLIER_PER_YEAR = 1089999999998841600n;
const KINK = 800000000000000000n;

const func: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts();

  const contract = "contracts/ModeTestnet/JumpRateModelV2.sol:JumpRateModelV2";
  const args = [BASE_RATE_PER_YEAR, MULTIPLIER_PER_YEAR, JUMP_MULTIPLIER_PER_YEAR, KINK, deployer];
  const { address } = await deploy(hre, "InterestRateModelUSDT", args, { contract });

  await verifyContract(hre, { contract, address, args });
};

func.tags = ["IRM", "InterestRateModel", "IRM-USDT", "InterestRateModelUSDT"];

export default func;
