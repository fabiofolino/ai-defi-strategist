const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const StrategyRouterModule = buildModule("StrategyRouterModule", (m) => {
  // Mainnet Lido contract addresses
  const stETHAddress = m.getParameter("stETHAddress", "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84");
  const wstETHAddress = m.getParameter("wstETHAddress", "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0");

  const strategyRouter = m.contract("StrategyRouter", [stETHAddress, wstETHAddress]);

  return { strategyRouter };
});

module.exports = StrategyRouterModule;