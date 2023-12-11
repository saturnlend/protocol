import { DeployFunction } from "hardhat-deploy/dist/types";
import { deploy, verifyContract } from "../utils";

const BASE_RATE_PER_YEAR = 19999999999728000n;
const MULTIPLIER_PER_YEAR = 224999999999568000n;
const JUMP_MULTIPLIER_PER_YEAR = 999999999999014400n;
const KINK = 800000000000000000n;

const func: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts();

  const contract = "contracts/ModeTestnet/JumpRateModelV2.sol:JumpRateModelV2";
  const args = [BASE_RATE_PER_YEAR, MULTIPLIER_PER_YEAR, JUMP_MULTIPLIER_PER_YEAR, KINK, deployer];
  const { address } = await deploy(hre, "InterestRateModelWBTC", args, { contract });

  await verifyContract(hre, { contract, address, args });
};

func.tags = ["IRM", "InterestRateModel", "IRM-WBTC", "InterestRateModelWBTC"];

export default func;
