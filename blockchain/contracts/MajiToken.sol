// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MajiToken
 * @notice ERC-20 water credit token on Celo.
 *         1 MAJI = right to dispense 10 litres at any authorised MajiSmart node.
 *         Tokens are minted when citizens buy water and burned when water is dispensed.
 *         Citizens can also EARN tokens by submitting verified community issue reports.
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract MajiToken is IERC20 {
    string  public constant name     = "MajiToken";
    string  public constant symbol   = "MAJI";
    uint8   public constant decimals = 18;

    // ── Tuneable constants ───────────────────────────────────────────────
    uint256 public constant LITRES_PER_TOKEN     = 10;
    // Reward for a verified community issue report (in MAJI, 18-decimal)
    uint256 public constant REPORT_REWARD        = 5e18; // 5 MAJI = 50 litres of water

    // ── Storage ─────────────────────────────────────────────────────────
    address public owner;
    uint256 private _totalSupply;

    mapping(address => uint256)                     private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    mapping(address => bool) public authorizedNodes;     // water dispense nodes
    mapping(address => bool) public authorizedOracles;   // backends that reward reporters

    // ── Events ──────────────────────────────────────────────────────────
    event WaterDispensed(address indexed user, address indexed node, uint256 tokens, uint256 litres);
    event ReportRewarded(address indexed reporter, uint256 tokens, string reportId);
    event NodeAuthorized(address indexed node, bool status);
    event OracleAuthorized(address indexed oracle, bool status);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ── Modifiers ────────────────────────────────────────────────────────
    modifier onlyOwner() { require(msg.sender == owner, "MAJI: not owner"); _; }
    modifier onlyNode()  { require(authorizedNodes[msg.sender], "MAJI: not authorised node"); _; }
    modifier onlyOracle(){ require(authorizedOracles[msg.sender], "MAJI: not authorised oracle"); _; }

    constructor() { owner = msg.sender; }

    // ── ERC-20 core ──────────────────────────────────────────────────────
    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }
    function allowance(address o, address s) external view override returns (uint256) { return _allowances[o][s]; }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        require(allowed >= amount, "MAJI: insufficient allowance");
        unchecked { _allowances[from][msg.sender] = allowed - amount; }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0) && to != address(0), "MAJI: zero address");
        require(_balances[from] >= amount, "MAJI: insufficient balance");
        unchecked {
            _balances[from] -= amount;
            _balances[to]   += amount;
        }
        emit Transfer(from, to, amount);
    }

    // ── Mint / Burn ──────────────────────────────────────────────────────
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "MAJI: zero address");
        _totalSupply    += amount;
        _balances[to]   += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == from || msg.sender == owner, "MAJI: not authorised to burn");
        require(_balances[from] >= amount, "MAJI: insufficient balance");
        unchecked {
            _balances[from] -= amount;
            _totalSupply    -= amount;
        }
        emit Transfer(from, address(0), amount);
    }

    // ── Node operations ──────────────────────────────────────────────────
    function authorizeNode(address node, bool status) external onlyOwner {
        authorizedNodes[node] = status;
        emit NodeAuthorized(node, status);
    }

    /**
     * @notice Called by an authorised IoT node when water is physically dispensed.
     *         Burns the user's MAJI tokens and returns the number of litres dispensed.
     */
    function dispenseWater(address user, uint256 tokens) external onlyNode returns (uint256 litres) {
        require(_balances[user] >= tokens, "MAJI: insufficient balance");
        litres = tokens * LITRES_PER_TOKEN;
        unchecked { _balances[user] -= tokens; _totalSupply -= tokens; }
        emit Transfer(user, address(0), tokens);
        emit WaterDispensed(user, msg.sender, tokens, litres);
    }

    // ── Oracle / reward operations ────────────────────────────────────────
    function authorizeOracle(address oracle, bool status) external onlyOwner {
        authorizedOracles[oracle] = status;
        emit OracleAuthorized(oracle, status);
    }

    /**
     * @notice Reward a citizen who submitted a verified issue report.
     *         Called by the MajiSmart backend oracle after a county officer resolves the report.
     */
    function rewardReporter(address reporter, string calldata reportId) external onlyOracle {
        require(reporter != address(0), "MAJI: zero address");
        _totalSupply          += REPORT_REWARD;
        _balances[reporter]   += REPORT_REWARD;
        emit Transfer(address(0), reporter, REPORT_REWARD);
        emit ReportRewarded(reporter, REPORT_REWARD, reportId);
    }

    // ── Views ─────────────────────────────────────────────────────────────
    function litresBalance(address user) external view returns (uint256) {
        return _balances[user] * LITRES_PER_TOKEN / 1e18;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MAJI: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
