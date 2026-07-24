// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WaterDAO
 * @notice Token-weighted community governance for MajiSmart water nodes.
 *
 *   MAJI token holders propose and vote on:
 *     - Water price changes
 *     - Maintenance schedules
 *     - New node additions
 *     - Emergency actions
 *     - Budget allocations
 *
 *   Voting rules:
 *     - Minimum 10 MAJI to create a proposal
 *     - Voting period: 3 days
 *     - Quorum: 100 MAJI total votes required
 *     - Simple majority (forVotes > againstVotes) to pass
 *
 *   Deployed per county or per water network.
 */

interface IMajiToken {
    function balanceOf(address account) external view returns (uint256);
}

contract WaterDAO {

    // ── Types ─────────────────────────────────────────────────────────────
    enum ProposalType {
        PriceChange,        // change water price per litre
        MaintenanceBudget,  // allocate funds for maintenance
        NodeAddition,       // add a new water node to the network
        EmergencyAction,    // urgent action (shorter vote window)
        PolicyChange,       // change platform policy/rules
        Other
    }

    enum ProposalStatus { Active, Passed, Failed, Executed, Cancelled }

    struct Proposal {
        uint256       id;
        string        title;
        string        description;
        string        ipfsHash;          // optional: full proposal document on IPFS
        address       proposer;
        ProposalType  proposalType;
        uint256       value;             // semantic value (e.g., new price in wei for PriceChange)
        uint256       forVotes;
        uint256       againstVotes;
        uint256       abstainVotes;
        uint256       startTime;
        uint256       endTime;
        ProposalStatus status;
        bool          executed;
        string        executionNote;     // set by admin when executed
    }

    // ── Constants ─────────────────────────────────────────────────────────
    uint256 public constant VOTING_PERIOD_NORMAL    = 3 days;
    uint256 public constant VOTING_PERIOD_EMERGENCY = 1 days;
    uint256 public constant MIN_TOKENS_TO_PROPOSE   = 10e18;   // 10 MAJI
    uint256 public constant QUORUM_VOTES            = 100e18;  // 100 MAJI

    // ── State ─────────────────────────────────────────────────────────────
    address    public owner;
    IMajiToken public majiToken;
    string     public countyName;  // e.g. "Nairobi" — this DAO governs one county

    Proposal[] public proposals;

    // proposalId → voter → VoteType (0=none,1=for,2=against,3=abstain)
    mapping(uint256 => mapping(address => uint8)) public votes;
    // proposalId → voter → vote weight at time of voting
    mapping(uint256 => mapping(address => uint256)) public voteWeights;

    // ── Events ────────────────────────────────────────────────────────────
    event ProposalCreated(
        uint256 indexed proposalId,
        string  title,
        address indexed proposer,
        ProposalType    proposalType,
        uint256 endTime
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8   voteType,   // 1=for 2=against 3=abstain
        uint256 weight
    );
    event ProposalFinalized(uint256 indexed proposalId, ProposalStatus status);
    event ProposalExecuted(uint256 indexed proposalId, string note);
    event ProposalCancelled(uint256 indexed proposalId);

    // ── Modifiers ─────────────────────────────────────────────────────────
    modifier onlyOwner() { require(msg.sender == owner, "DAO: not owner"); _; }

    constructor(address _majiToken, string memory _countyName) {
        require(_majiToken != address(0), "DAO: zero address");
        majiToken  = IMajiToken(_majiToken);
        countyName = _countyName;
        owner      = msg.sender;
    }

    // ── Proposal creation ─────────────────────────────────────────────────
    function createProposal(
        string    calldata title,
        string    calldata description,
        string    calldata ipfsHash,
        ProposalType       proposalType,
        uint256            value
    ) external returns (uint256 proposalId) {
        require(
            majiToken.balanceOf(msg.sender) >= MIN_TOKENS_TO_PROPOSE,
            "DAO: need >= 10 MAJI to propose"
        );
        require(bytes(title).length > 0 && bytes(title).length <= 120, "DAO: invalid title");
        require(bytes(description).length > 0, "DAO: empty description");

        uint256 duration = proposalType == ProposalType.EmergencyAction
            ? VOTING_PERIOD_EMERGENCY
            : VOTING_PERIOD_NORMAL;

        proposalId = proposals.length;
        proposals.push(Proposal({
            id:            proposalId,
            title:         title,
            description:   description,
            ipfsHash:      ipfsHash,
            proposer:      msg.sender,
            proposalType:  proposalType,
            value:         value,
            forVotes:      0,
            againstVotes:  0,
            abstainVotes:  0,
            startTime:     block.timestamp,
            endTime:       block.timestamp + duration,
            status:        ProposalStatus.Active,
            executed:      false,
            executionNote: ""
        }));

        emit ProposalCreated(proposalId, title, msg.sender, proposalType, block.timestamp + duration);
    }

    // ── Voting ────────────────────────────────────────────────────────────
    /**
     * @param proposalId  Target proposal.
     * @param voteType    1 = For, 2 = Against, 3 = Abstain.
     */
    function castVote(uint256 proposalId, uint8 voteType) external {
        require(proposalId < proposals.length,   "DAO: invalid proposal");
        require(voteType >= 1 && voteType <= 3,  "DAO: invalid vote type");

        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.Active,      "DAO: proposal not active");
        require(block.timestamp >= p.startTime,          "DAO: voting not started");
        require(block.timestamp <= p.endTime,            "DAO: voting ended");
        require(votes[proposalId][msg.sender] == 0,      "DAO: already voted");

        uint256 weight = majiToken.balanceOf(msg.sender);
        require(weight > 0, "DAO: no MAJI tokens");

        votes[proposalId][msg.sender]       = voteType;
        voteWeights[proposalId][msg.sender] = weight;

        if      (voteType == 1) p.forVotes     += weight;
        else if (voteType == 2) p.againstVotes += weight;
        else                    p.abstainVotes  += weight;

        emit VoteCast(proposalId, msg.sender, voteType, weight);
    }

    // ── Finalization ──────────────────────────────────────────────────────
    /**
     * @notice Anyone can finalize a proposal after voting ends.
     */
    function finalizeProposal(uint256 proposalId) external {
        require(proposalId < proposals.length, "DAO: invalid proposal");
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.Active, "DAO: already finalized");
        require(block.timestamp > p.endTime,        "DAO: voting still active");

        uint256 totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
        bool quorumMet     = totalVotes >= QUORUM_VOTES;
        bool majorityFor   = p.forVotes > p.againstVotes;

        p.status = (quorumMet && majorityFor) ? ProposalStatus.Passed : ProposalStatus.Failed;
        emit ProposalFinalized(proposalId, p.status);
    }

    // ── Execution (admin) ─────────────────────────────────────────────────
    function executeProposal(uint256 proposalId, string calldata note) external onlyOwner {
        require(proposalId < proposals.length, "DAO: invalid proposal");
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.Passed, "DAO: not passed");
        require(!p.executed,                        "DAO: already executed");
        p.executed      = true;
        p.status        = ProposalStatus.Executed;
        p.executionNote = note;
        emit ProposalExecuted(proposalId, note);
    }

    function cancelProposal(uint256 proposalId) external {
        require(proposalId < proposals.length, "DAO: invalid proposal");
        Proposal storage p = proposals[proposalId];
        require(
            msg.sender == p.proposer || msg.sender == owner,
            "DAO: not proposer or owner"
        );
        require(p.status == ProposalStatus.Active, "DAO: not active");
        p.status = ProposalStatus.Cancelled;
        emit ProposalCancelled(proposalId);
    }

    // ── Views ─────────────────────────────────────────────────────────────
    function getProposal(uint256 id) external view returns (Proposal memory) {
        require(id < proposals.length, "DAO: invalid id");
        return proposals[id];
    }

    function proposalsCount() external view returns (uint256) { return proposals.length; }

    function getVote(uint256 proposalId, address voter) external view
        returns (uint8 voteType, uint256 weight)
    {
        return (votes[proposalId][voter], voteWeights[proposalId][voter]);
    }

    function getActiveProposals() external view returns (uint256[] memory ids) {
        uint256 count;
        for (uint256 i = 0; i < proposals.length; i++)
            if (proposals[i].status == ProposalStatus.Active) count++;

        ids = new uint256[](count);
        uint256 j;
        for (uint256 i = 0; i < proposals.length; i++)
            if (proposals[i].status == ProposalStatus.Active) ids[j++] = i;
    }

    function quorumProgress(uint256 proposalId) external view
        returns (uint256 current, uint256 required, bool met)
    {
        require(proposalId < proposals.length, "DAO: invalid proposal");
        Proposal storage p = proposals[proposalId];
        current  = p.forVotes + p.againstVotes + p.abstainVotes;
        required = QUORUM_VOTES;
        met      = current >= required;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "DAO: zero address");
        owner = newOwner;
    }
}
