import { parseUnits } from "ethers";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { CErc20Immutable, SimplePriceOracle } from "../typechain";
import {
  deploy,
  ensureFinished,
  getContract,
  getDeploymentAddress,
  getEnvironment,
  getSafeContractProperty,
  isUnderlyingTokenContract,
  verifyContract,
} from "../utils";
import getUnitroller from "../utils/unitroller";
import { isSimplePriceOracle } from "./000-PriceOracle";

const UNDERYING_TOKEN_ADDRESS = getEnvironment("USDC_TOKEN_ADDRESS");

const COLLATERAL_FACTOR = 855000000000000000n;
const INITIAL_EXCHANGE_RATE = 200000000000000n;
const RESERVE_FACTOR = 450000000000000000n;
const DECIMALS = 8;

const func: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts();

  const interestRateModelUSDC = await getDeploymentAddress(hre, "InterestRateModelUSDC");
  const Unitroller = await getUnitroller(hre);

  const contract = "CErc20Immutable";
  const args = [
    await isUnderlyingTokenContract(hre.ethers.provider, "cUSDC", UNDERYING_TOKEN_ADDRESS()),
    await Unitroller.getAddress(),
    interestRateModelUSDC,
    INITIAL_EXCHANGE_RATE,
    "cUSDC",
    "cUSDC",
    DECIMALS,
    deployer,
  ];
  const cUSDC = await deploy<CErc20Immutable>(hre, "cUSDC", args, { contract });

  const allMarkets = await getSafeContractProperty(Unitroller.getAllMarkets(), []);
  if (!allMarkets.includes(cUSDC.address)) {
    console.log(`Unitroller: Support market cUSDC at ${cUSDC.address}`);
    await ensureFinished(Unitroller._supportMarket(cUSDC.address));
  }

  if (isSimplePriceOracle()) {
    const SimplePriceOracle = await getContract<SimplePriceOracle>(hre, "SimplePriceOracle", {
      signer: deployer,
    });
    const price = parseUnits("1", 18 + 18 - Number(await cUSDC.decimals()));
    if ((await SimplePriceOracle.getUnderlyingPrice(cUSDC.address)) !== price) {
      console.log(`SimplePriceOracle: Set cUSDC price to $1`);
      await ensureFinished(SimplePriceOracle.setUnderlyingPrice(cUSDC.address, price));
    }
  }

  const { collateralFactorMantissa } = await Unitroller.markets(cUSDC.address);
  if (collateralFactorMantissa !== COLLATERAL_FACTOR) {
    console.log(`Unitroller: Set cUSDC collateral factor: ${COLLATERAL_FACTOR}`);
    await ensureFinished(Unitroller._setCollateralFactor(cUSDC.address, COLLATERAL_FACTOR));
  }

  const reserveFactor = await cUSDC.reserveFactorMantissa();
  if (reserveFactor !== RESERVE_FACTOR) {
    console.log(`cUSDC: Set reserve factor: ${reserveFactor}`);
    await ensureFinished(cUSDC._setReserveFactor(RESERVE_FACTOR));
  }

  await verifyContract(hre, { contract, address: cUSDC.address, args });
};

func.tags = ["CToken", "cUSDC"];
func.dependencies = ["InterestRateModelUSDC", "Unitroller"];

export default func;
