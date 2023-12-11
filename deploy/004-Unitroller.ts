import { DeployFunction } from "hardhat-deploy/dist/types";
import { Comptroller } from "../typechain";
import {
  deploy,
  ensureFinished,
  getContract,
  getDeploymentAddress,
  getSafeContractProperty,
  verifyContract,
} from "../utils";
import getUnitroller from "../utils/unitroller";
import { USER_PRICE_ORACLE, isSimplePriceOracle } from "./000-PriceOracle";

const CLOSE_FACTOR = 500000000000000000n;
const LIQUIDATION_INCENTIVE = 1080000000000000000n;

const func: DeployFunction = async (hre) => {
  const priceOracle = isSimplePriceOracle()
    ? await getDeploymentAddress(hre, "SimplePriceOracle")
    : USER_PRICE_ORACLE();

  const contract = "Unitroller";
  const args: any[] = [];
  const { address: unitroller } = await deploy(hre, contract, args);

  const Unitroller = await getUnitroller(hre);
  const Comptroller = await getContract<Comptroller>(hre, "Comptroller", {
    signer: "deployer",
  });

  /* set unitroller's implementation to comptroller */
  if ((await Unitroller.comptrollerImplementation()) !== Comptroller.address) {
    const pendingComptroller = () => Unitroller.pendingComptrollerImplementation();

    if ((await pendingComptroller()) !== Comptroller.address) {
      console.log(`Unitroller: Set pending implementation to Comptroller at ${Comptroller.address}`);
      await ensureFinished(Unitroller._setPendingImplementation(Comptroller.address));
    }

    if ((await pendingComptroller()) === Comptroller.address) {
      console.log(`Comptroller: Accept as implementation from Unitroller at ${unitroller}`);
      await ensureFinished(Comptroller._become(unitroller));
    }
  }

  /* set unitroller's price oracle */
  const currentOracle = await getSafeContractProperty(Unitroller.oracle(), "");
  if (currentOracle !== priceOracle) {
    console.log(`Unitroller: Set price oracle to ${priceOracle}`);
    await ensureFinished(Unitroller._setPriceOracle(priceOracle));
  }

  /* set unitroller's close factor */
  const currentCloseFactor = await getSafeContractProperty(Unitroller.closeFactorMantissa(), 0n);
  if (currentCloseFactor !== CLOSE_FACTOR) {
    console.log(`Unitroller: Set close factor to ${CLOSE_FACTOR}`);
    await ensureFinished(Unitroller._setCloseFactor(CLOSE_FACTOR));
  }

  /* set unitroller's liquidation incentive */
  const currentLiquidationIncentive = await getSafeContractProperty(
    Unitroller.liquidationIncentiveMantissa(),
    0n
  );
  if (currentLiquidationIncentive !== LIQUIDATION_INCENTIVE) {
    console.log(`Unitroller: Set liquidation incentive to ${LIQUIDATION_INCENTIVE}`);
    await ensureFinished(Unitroller._setLiquidationIncentive(LIQUIDATION_INCENTIVE));
  }

  await verifyContract(hre, { contract, address: unitroller, args });
};

func.tags = ["Unitroller"];
func.dependencies = ["Comptroller"];

export default func;
