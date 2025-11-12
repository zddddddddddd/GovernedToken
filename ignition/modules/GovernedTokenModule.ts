import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GovernedTokenModule = buildModule("GovernedTokenModule", (m) => {
  // 部署 GovernedToken 实现合约
  const governedToken = m.contract("GovernedToken");

  // 初始化 GovernedToken
  m.call(governedToken, "init", [], {
    id: "init_governed_token",
  });

  // 部署 Proxy 合约
  const proxy = m.contract("Proxy");

  // 设置 Proxy 的目标合约为 GovernedToken
  m.call(proxy, "setTarget", [governedToken], {
    id: "set_proxy_target",
    after: [governedToken],
  });

  // 通过代理地址获取 GovernedToken 接口
  const proxiedToken = m.contractAt("GovernedToken", proxy, {
    id: "proxied_token",
  });

  // 通过代理初始化 GovernedToken
  m.call(proxiedToken, "init", [], {
    id: "init_proxied_token",
    after: [proxy],
  });

  return {
    governedToken,
    proxy,
    proxiedToken,
  };
});

export default GovernedTokenModule;
