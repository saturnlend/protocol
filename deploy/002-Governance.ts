import { DeployFunction } from "hardhat-deploy/dist/types";
import { deploy, verifyContract } from "../utils";

const func: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts();

  const contract = "Comp";
  const args: any[] = [deployer];
  const { address } = await deploy(hre, "Governance", args, { contract });

  await verifyContract(hre, { contract, address, args });
};

func.tags = ["Governance"];

export default func;
