import { DeployFunction } from "hardhat-deploy/dist/types";
import { deploy, verifyContract } from "../utils";

const func: DeployFunction = async (hre) => {
  const contract = "Maximillion";
  const cEther = "0x9DfB8727125aD9F1A70B8c59b501C5E3A0375c16";
  const args: any[] = [cEther];

  const { address } = await deploy(hre, contract, args);

  await verifyContract(hre, { contract, address, args });
};

func.tags = ["Maximillion"];

export default func;
