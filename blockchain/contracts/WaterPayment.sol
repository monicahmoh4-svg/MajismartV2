// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WaterPayment
 * @notice Trustless water payment contract on Celo.
 *
 *   Citizens send cUSD (Celo Dollar stablecoin) to this contract.
 *   The contract mints MAJI tokens for them immediately.
 *   Revenue accumulates in the contract; node operators / county governments can withdraw.
 *
 *   Price is set per MAJI token in cUSD (18-decimal):
 *     default: 0.001 cUSD per MAJI = 0.01 cUSD per litre of water
 *
 *   Celo Mainnet cUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a
 *   Alfajores testnet:  0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IMajiToken {
    function mint(address to, uint256 amount) external;
    function owner() external view returns (address);
}

contract WaterPayment {
    // ── Immutables ───────────────────────────────────────────────────────
    IERC20     public immutable cUSD;
    IMajiToken public immutable majiToken;

    // ── State ─────────────────────────────────────────────────────────────
    address public owner;
    uint256 public pricePerToken;     // cUSD wei per 1 MAJI (18 dec)
    uint256 public totalRevenue;      // cumulative cUSD collected
    uint256 public totalTokensSold;

    mapping(address => uint256) public userTotalSpent;     // cUSD spent per wallet
    mapping(address => uint256) public userTokensPurchased;
    mapping(string  => uint256) public nodeRevenue;        // by nodeId string

    // ── Events ────────────────────────────────────────────────────────────
    event WaterPurchased(
        address indexed buyer,
        uint256 cUSDAmount,
        uint256 majiTokens,
        string  nodeId,
        uint256 timestamp
    );
    event RevenueWithdrawn(address indexed to, uint256 amount);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ── Modifiers ─────────────────────────────────────────────────────────
    modifier onlyOwner() { require(msg.sender == owner, "WP: not owner"); _; }

    constructor(
        address _cUSD,
        address _majiToken,
        uint256 _pricePerToken   // e.g. 1e15 = 0.001 cUSD per MAJI
    ) {
        require(_cUSD     != address(0), "WP: zero cUSD");
        require(_majiToken!= address(0), "WP: zero MajiToken");
        require(_pricePerToken > 0,      "WP: zero price");
        cUSD          = IERC20(_cUSD);
        majiToken     = IMajiToken(_majiToken);
        pricePerToken = _pricePerToken;
        owner         = msg.sender;
    }

    // ── Core: buy water ───────────────────────────────────────────────────
    /**
     * @notice Buy MAJI water tokens by paying cUSD.
     * @param cUSDAmount   Amount of cUSD (18-decimal) to spend.
     * @param nodeId       The MajiSmart node UUID the citizen intends to use.
     *                     Stored in event for off-chain indexing only.
     * @return majiTokens  Number of MAJI tokens minted.
     *
     * Before calling, the citizen must approve this contract:
     *   cUSD.approve(waterPaymentAddress, cUSDAmount)
     */
    function buyWater(uint256 cUSDAmount, string calldata nodeId)
        external
        returns (uint256 majiTokens)
    {
        require(cUSDAmount > 0, "WP: zero amount");
        require(bytes(nodeId).length > 0, "WP: empty nodeId");

        // Pull cUSD from buyer
        require(
            cUSD.transferFrom(msg.sender, address(this), cUSDAmount),
            "WP: cUSD transfer failed"
        );

        // Calculate MAJI tokens: amount * 1e18 / pricePerToken
        majiTokens = (cUSDAmount * 1e18) / pricePerToken;
        require(majiTokens > 0, "WP: amount too small");

        // Mint MAJI to buyer
        majiToken.mint(msg.sender, majiTokens);

        // Accounting
        totalRevenue              += cUSDAmount;
        totalTokensSold           += majiTokens;
        userTotalSpent[msg.sender]     += cUSDAmount;
        userTokensPurchased[msg.sender]+= majiTokens;
        nodeRevenue[nodeId]            += cUSDAmount;

        emit WaterPurchased(msg.sender, cUSDAmount, majiTokens, nodeId, block.timestamp);
        return majiTokens;
    }

    // ── Litres calculator (view) ──────────────────────────────────────────
    function cUSDToLitres(uint256 cUSDAmount) external view returns (uint256) {
        uint256 tokens = (cUSDAmount * 1e18) / pricePerToken;
        return tokens * 10 / 1e18; // 10 litres per MAJI, adjusted for decimals
    }

    function litrePrice() external view returns (uint256 cUSDPerLitre) {
        // price per token * 1 / LITRES_PER_TOKEN
        return pricePerToken / 10;
    }

    // ── Admin ─────────────────────────────────────────────────────────────
    function updatePrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "WP: zero price");
        emit PriceUpdated(pricePerToken, newPrice);
        pricePerToken = newPrice;
    }

    function withdrawRevenue(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "WP: zero address");
        require(cUSD.balanceOf(address(this)) >= amount, "WP: insufficient balance");
        require(cUSD.transfer(to, amount), "WP: transfer failed");
        emit RevenueWithdrawn(to, amount);
    }

    function withdrawAll(address to) external onlyOwner {
        uint256 bal = cUSD.balanceOf(address(this));
        require(bal > 0, "WP: nothing to withdraw");
        require(cUSD.transfer(to, bal), "WP: transfer failed");
        emit RevenueWithdrawn(to, bal);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "WP: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ── Emergency ────────────────────────────────────────────────────────
    /**
     * @notice Recover any ERC-20 accidentally sent to this contract (not cUSD).
     */
    function recoverToken(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(cUSD), "WP: cannot recover cUSD this way");
        IERC20(token).transfer(to, amount);
    }
}
