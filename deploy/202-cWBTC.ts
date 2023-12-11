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

const UNDERYING_TOKEN_ADDRESS = getEnvironment("WBTC_TOKEN_ADDRESS");

const COLLATERAL_FACTOR = 700000000000000000n;
const INITIAL_EXCHANGE_RATE = 20000000000000000n;
const RESERVE_FACTOR = 200000000000000000n;
const DECIMALS = 8;

const func: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts();

  const interestRateModelWBTC = await getDeploymentAddress(hre, "InterestRateModelWBTC");
  const Unitroller = await getUnitroller(hre);

  const contract = "CErc20Immutable";
  const args = [
    await isUnderlyingTokenContract(hre.ethers.provider, "cWBTC", UNDERYING_TOKEN_ADDRESS()),
    await Unitroller.getAddress(),
    interestRateModelWBTC,
    INITIAL_EXCHANGE_RATE,
    "cWBTC",
    "cWBTC",
    DECIMALS,
    deployer,
  ];
  const cWBTC = await deploy<CErc20Immutable>(hre, "cWBTC", args, { contract });

  const allMarkets = await getSafeContractProperty(Unitroller.getAllMarkets(), []);
  if (!allMarkets.includes(cWBTC.address)) {
    console.log(`Unitroller: Support market cWBTC at ${cWBTC.address}`);
    await ensureFinished(Unitroller._supportMarket(cWBTC.address));
  }

  if (isSimplePriceOracle()) {
    const SimplePriceOracle = await getContract<SimplePriceOracle>(hre, "SimplePriceOracle", {
      signer: deployer,
    });
    const price = parseUnits("1", 18 + 18 - Number(await cWBTC.decimals()));
    if ((await SimplePriceOracle.getUnderlyingPrice(cWBTC.address)) !== price) {
      console.log(`SimplePriceOracle: Set cWBTC price to $37,500`);
      await ensureFinished(SimplePriceOracle.setUnderlyingPrice(cWBTC.address, price));
    }
  }

  const { collateralFactorMantissa } = await Unitroller.markets(cWBTC.address);
  if (collateralFactorMantissa !== COLLATERAL_FACTOR) {
    console.log(`Unitroller: Set cWBTC collateral factor: ${COLLATERAL_FACTOR}`);
    await ensureFinished(Unitroller._setCollateralFactor(cWBTC.address, COLLATERAL_FACTOR));
  }

  const reserveFactor = await cWBTC.reserveFactorMantissa();
  if (reserveFactor !== RESERVE_FACTOR) {
    console.log(`cWBTC: Set reserve factor: ${reserveFactor}`);
    await ensureFinished(cWBTC._setReserveFactor(RESERVE_FACTOR));
  }

  await verifyContract(hre, { contract, address: cWBTC.address, args });
};

func.tags = ["CToken", "cWBTC"];
func.dependencies = ["InterestRateModelWBTC", "Unitroller"];

export default func;
