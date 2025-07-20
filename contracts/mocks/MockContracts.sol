// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Basic ERC20 mock for testing
 */
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title MockStETH
 * @dev Mock implementation of Lido stETH for testing
 */
contract MockStETH is ERC20 {
    uint256 private mockSubmitReturn;

    constructor() ERC20("Mock Liquid staked Ether 2.0", "stETH") {}

    function submit(address _referral) external payable returns (uint256) {
        uint256 amount = mockSubmitReturn > 0 ? mockSubmitReturn : msg.value;
        _mint(msg.sender, amount);
        return amount;
    }

    function getPooledEthByShares(uint256 _sharesAmount) external pure returns (uint256) {
        return _sharesAmount; // 1:1 for simplicity
    }

    function getSharesByPooledEth(uint256 _pooledEthAmount) external pure returns (uint256) {
        return _pooledEthAmount; // 1:1 for simplicity
    }

    function setMockSubmitReturn(uint256 _amount) external {
        mockSubmitReturn = _amount;
    }
}

/**
 * @title MockWstETH
 * @dev Mock implementation of Lido wstETH for testing
 */
contract MockWstETH is ERC20 {
    address public stETH;
    uint256 private mockWrapReturn;
    uint256 private mockUnwrapReturn;
    uint256 private mockGetWstETHByStETH;
    uint256 private mockGetStETHByWstETH;

    constructor(address _stETH) ERC20("Mock Wrapped liquid staked Ether 2.0", "wstETH") {
        stETH = _stETH;
    }

    function wrap(uint256 _stETHAmount) external returns (uint256) {
        require(IERC20(stETH).transferFrom(msg.sender, address(this), _stETHAmount), "Transfer failed");
        uint256 wstETHAmount = mockWrapReturn > 0 ? mockWrapReturn : _stETHAmount;
        _mint(msg.sender, wstETHAmount);
        return wstETHAmount;
    }

    function unwrap(uint256 _wstETHAmount) external returns (uint256) {
        require(balanceOf(msg.sender) >= _wstETHAmount, "Insufficient balance");
        _burn(msg.sender, _wstETHAmount);
        uint256 stETHAmount = mockUnwrapReturn > 0 ? mockUnwrapReturn : _wstETHAmount;
        require(IERC20(stETH).transfer(msg.sender, stETHAmount), "Transfer failed");
        return stETHAmount;
    }

    function getWstETHByStETH(uint256 _stETHAmount) external view returns (uint256) {
        return mockGetWstETHByStETH > 0 ? mockGetWstETHByStETH : _stETHAmount;
    }

    function getStETHByWstETH(uint256 _wstETHAmount) external view returns (uint256) {
        return mockGetStETHByWstETH > 0 ? mockGetStETHByWstETH : _wstETHAmount;
    }

    // Test helper functions
    function setMockWrapReturn(uint256 _amount) external {
        mockWrapReturn = _amount;
    }

    function setMockUnwrapReturn(uint256 _amount) external {
        mockUnwrapReturn = _amount;
    }

    function setMockGetWstETHByStETH(uint256 _amount) external {
        mockGetWstETHByStETH = _amount;
    }

    function setMockGetStETHByWstETH(uint256 _amount) external {
        mockGetStETHByWstETH = _amount;
    }
}