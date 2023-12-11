import { DeployFunction } from "hardhat-deploy/dist/types";
import { deploy, verifyContract } from "../utils";

const func: DeployFunction = async (hre) => {
  const contract = "Unitroller";
  const args: any[] = [];

  const { address } = await deploy(hre, "CompoundLens", []);

  await verifyContract(hre, { contract, address, args });
};

func.tags = ["CompoundLens"];

export default func;
