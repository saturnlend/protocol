import { parseUnits } from "ethers";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { CEther, SimplePriceOracle } from "../typechain";
import {
  deploy,
  ensureFinished,
  getContract,
  getDeploymentAddress,
  getSafeContractProperty,
  verifyContract,
} from "../utils";
import getUnitroller from "../utils/unitroller";
import { isSimplePriceOracle } from "./000-PriceOracle";

const COLLATERAL_FACTOR = 825000000000000000n;
const INITIAL_EXCHANGE_RATE = 200000000000000000000000000n;
const RESERVE_FACTOR = 200000000000000000n;
const DECIMALS = 8;

const func: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts();

  const interestRateModelETH = await getDeploymentAddress(hre, "InterestRateModelETH");
  const Unitroller = await getUnitroller(hre);

  const contract = "CEther";
  const args = [
    await Unitroller.getAddress(),
    interestRateModelETH,
    INITIAL_EXCHANGE_RATE,
    "cETH",
    "cETH",
    DECIMALS,
    deployer,
  ];
  const cETH = await deploy<CEther>(hre, "cETH", args, { contract });

  const allMarkets = await getSafeContractProperty(Unitroller.getAllMarkets(), []);
  if (!allMarkets.includes(cETH.address)) {
    console.log(`Unitroller: Support market cETH at ${cETH.address}`);
    await ensureFinished(Unitroller._supportMarket(cETH.address));
  }

  if (isSimplePriceOracle()) {
    const SimplePriceOracle = await getContract<SimplePriceOracle>(hre, "SimplePriceOracle", {
      signer: deployer,
    });
    const price = parseUnits("2000", 18 + 18 - Number(await cETH.decimals()));
    if ((await SimplePriceOracle.getUnderlyingPrice(cETH.address)) !== price) {
      console.log(`SimplePriceOracle: Set cETH price to $2,000`);
      await ensureFinished(SimplePriceOracle.setUnderlyingPrice(cETH.address, price));
    }
  }

  const { collateralFactorMantissa } = await Unitroller.markets(cETH.address);
  if (collateralFactorMantissa !== COLLATERAL_FACTOR) {
    console.log(`Unitroller: Set cETH collateral factor: ${COLLATERAL_FACTOR}`);
    await ensureFinished(Unitroller._setCollateralFactor(cETH.address, COLLATERAL_FACTOR));
  }

  const reserveFactor = await cETH.reserveFactorMantissa();
  if (reserveFactor !== RESERVE_FACTOR) {
    console.log(`cETH: Set reserve factor: ${RESERVE_FACTOR}`);
    await ensureFinished(cETH._setReserveFactor(RESERVE_FACTOR));
  }

  await verifyContract(hre, { contract, address: cETH.address, args });
};

func.tags = ["CToken", "cETH"];
func.dependencies = ["InterestRateModelETH", "Unitroller"];

export default func;
