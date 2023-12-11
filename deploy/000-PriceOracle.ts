import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { isAddress } from "ethers";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { deploy, getEnvironment, isContract, verifyContract } from "../utils";

export const USER_PRICE_ORACLE = getEnvironment("USER_PRICE_ORACLE");

export enum PriceOracles {
  SIMPLE = "SimplePriceOracle",
  EXPERIMENTAL_PYTH = "ExperimentalPythPriceOracle",
}

export const isSimplePriceOracle = () =>
  USER_PRICE_ORACLE().toLowerCase() === PriceOracles.SIMPLE.toLowerCase();

export const isExperimentalPythPriceOracle = () =>
  USER_PRICE_ORACLE().toLowerCase() === PriceOracles.EXPERIMENTAL_PYTH.toLowerCase();

export const isExternalPriceOracle = async (provider?: HardhatEthersProvider) => {
  const address = USER_PRICE_ORACLE();
  return isAddress(address) && provider !== undefined ? await isContract(provider, address) : true;
};

const func: DeployFunction = async (hre) => {
  if (isSimplePriceOracle()) {
    console.log('User-fixed price oracle is "SimplePriceOracle". Will deploy SimplePriceOracle...');

    const contract = "SimplePriceOracle";
    const args: any[] = [];
    const { address } = await deploy(hre, contract, args);

    await verifyContract(hre, { contract, address, args });
  } else if (isExperimentalPythPriceOracle()) {
    console.log(
      'User-fixed price oracle is "ExperimentalPythPriceOracle". Will deploy ExperimentalPythPriceOracle...'
    );

    const pythOracle = getEnvironment("PYTH_ORACLE_ADDRESS")();
    if (!(isAddress(pythOracle) && (await isContract(hre.ethers.provider, pythOracle)))) {
      throw new Error(`User-defined pyth oracle ${pythOracle} is not a contract`);
    }

    const contract = "contracts/ExperimentalPythPriceOracle.sol:ExperimentalPythPriceOracle";
    const args = [pythOracle];
    const { address } = await deploy(hre, "ExperimentalPythPriceOracle", args, { contract });

    await verifyContract(hre, { contract, address, args });
  } else if (isAddress(USER_PRICE_ORACLE())) {
    const address = USER_PRICE_ORACLE();
    if (await isContract(hre.ethers.provider, address)) {
      console.log(`User-defined price oracle ${address} is a contract.`);
    } else {
      throw new Error(`User-defined price oracle ${address} is not a contract!`);
    }
  }
};

func.tags = ["PriceOracle", "SimplePriceOracle", "ExperimentalPythPriceOracle"];

export default func;
