import { DeployFunction } from "hardhat-deploy/dist/types";
import { deploy, verifyContract } from "../utils";

const func: DeployFunction = async (hre) => {
  const contract = "Comptroller";
  const args: any[] = [];

  const { address } = await deploy(hre, contract, args);

  await verifyContract(hre, { contract, address, args });
};

func.tags = ["Comptroller"];

export default func;
