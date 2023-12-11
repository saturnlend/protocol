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

const UNDERYING_TOKEN_ADDRESS = getEnvironment("USDT_TOKEN_ADDRESS");

const COLLATERAL_FACTOR = 0n;
const INITIAL_EXCHANGE_RATE = 200000000000000n;
const RESERVE_FACTOR = 75000000000000000n;
const DECIMALS = 8;

const func: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts();

  const interestRateModelUSDT = await getDeploymentAddress(hre, "InterestRateModelUSDT");
  const Unitroller = await getUnitroller(hre);

  const contract = "CErc20Immutable";
  const args = [
    await isUnderlyingTokenContract(hre.ethers.provider, "cUSDT", UNDERYING_TOKEN_ADDRESS()),
    await Unitroller.getAddress(),
    interestRateModelUSDT,
    INITIAL_EXCHANGE_RATE,
    "cUSDT",
    "cUSDT",
    DECIMALS,
    deployer,
  ];
  const cUSDT = await deploy<CErc20Immutable>(hre, "cUSDT", args, { contract });

  const allMarkets = await getSafeContractProperty(Unitroller.getAllMarkets(), []);
  if (!allMarkets.includes(cUSDT.address)) {
    console.log(`Unitroller: Support market cUSDT at ${cUSDT.address}`);
    await ensureFinished(Unitroller._supportMarket(cUSDT.address));
  }

  if (isSimplePriceOracle()) {
    const SimplePriceOracle = await getContract<SimplePriceOracle>(hre, "SimplePriceOracle", {
      signer: deployer,
    });
    const price = parseUnits("1", 18 + 18 - Number(await cUSDT.decimals()));
    if ((await SimplePriceOracle.getUnderlyingPrice(cUSDT.address)) !== price) {
      console.log(`SimplePriceOracle: Set cUSDT price to $1`);
      await ensureFinished(SimplePriceOracle.setUnderlyingPrice(cUSDT.address, price));
    }
  }

  const { collateralFactorMantissa } = await Unitroller.markets(cUSDT.address);
  if (collateralFactorMantissa !== COLLATERAL_FACTOR) {
    console.log(`Unitroller: Set cUSDT collateral factor: ${COLLATERAL_FACTOR}`);
    await ensureFinished(Unitroller._setCollateralFactor(cUSDT.address, COLLATERAL_FACTOR));
  }

  const reserveFactor = await cUSDT.reserveFactorMantissa();
  if (reserveFactor !== RESERVE_FACTOR) {
    console.log(`cUSDT: Set reserve factor: ${reserveFactor}`);
    await ensureFinished(cUSDT._setReserveFactor(RESERVE_FACTOR));
  }

  await verifyContract(hre, { contract, address: cUSDT.address, args });
};

func.tags = ["CToken", "cUSDT"];
func.dependencies = ["InterestRateModelUSDT", "Unitroller"];

export default func;
