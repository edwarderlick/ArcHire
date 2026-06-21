// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  ArcHireEscrow
 * @notice Escrow for ArcHire: buyer funds a job, agent delivers, buyer releases.
 *
 * Job flow:
 *   Buyer calls createJob()       → status: Funded
 *   Agent calls submitDelivery()  → status: Delivered
 *   Buyer calls approveAndRelease()→ status: Released  (USDC sent to agent)
 *   -- or --
 *   Buyer calls dispute()         → status: Disputed   (funds locked)
 *   Admin calls refund()          → status: Refunded   (USDC returned to buyer)
 *
 * deliveryHash stores the Supabase job UUID so the on-chain record ties back
 * to the off-chain delivery without requiring IPFS in v1.
 */
contract ArcHireEscrow is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;

    enum JobStatus {
        Funded,     // 0 — buyer funded, awaiting delivery
        InProgress, // 1 — explicitly marked in-progress (optional)
        Delivered,  // 2 — agent submitted delivery hash
        Released,   // 3 — buyer approved, USDC sent to agent
        Disputed,   // 4 — buyer raised dispute, funds locked
        Refunded    // 5 — admin refunded buyer
    }

    struct Job {
        address buyer;
        address agent;
        uint256 amount;       // USDC in ERC-20 units (read decimals() — do not hardcode 6)
        JobStatus status;
        string deliveryHash;  // Supabase job UUID or content hash
    }

    uint256 public nextJobId;
    mapping(uint256 => Job) public jobs;

    // Authorized agent signing wallets. Separate from job.agent (payout address):
    // job.agent = where funds go on release.
    // authorizedAgents[addr] = true means addr may call submitDelivery() for any job.
    // Allows each agent's backend to use its own hot wallet without sharing the deployer key.
    mapping(address => bool) public authorizedAgents;

    // ─── Events ──────────────────────────────────────────────────────────────
    event JobCreated(uint256 indexed jobId, address indexed buyer, address indexed agent, uint256 amount);
    event JobDelivered(uint256 indexed jobId, string deliveryHash);
    event JobReleased(uint256 indexed jobId, address indexed agent, uint256 amount);
    event JobDisputed(uint256 indexed jobId, address indexed buyer);
    event JobRefunded(uint256 indexed jobId, address indexed buyer, uint256 amount);
    event AgentAuthorizationUpdated(address indexed agent, bool authorized);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error JobNotFound(uint256 jobId);
    error Unauthorized();
    error InvalidStatus(uint256 jobId, JobStatus current);
    error TransferFailed();
    error InvalidAmount();
    error InvalidAgent();

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    // ─── Admin: authorize / revoke an agent signing wallet ───────────────────

    /**
     * @notice Grant or revoke submitDelivery() rights for an agent signing wallet.
     * @param agent      The hot-wallet address the agent backend will sign with.
     * @param authorized True to authorize, false to revoke.
     *
     * Separates signing key (this wallet) from payout address (job.agent),
     * so each agent keeps its own key without sharing the deployer's key.
     */
    function setAgentAddress(address agent, bool authorized) external onlyOwner {
        if (agent == address(0)) revert InvalidAgent();
        authorizedAgents[agent] = authorized;
        emit AgentAuthorizationUpdated(agent, authorized);
    }

    // ─── Buyer: fund a new job ────────────────────────────────────────────────

    /**
     * @notice Fund a new job. Caller must have called USDC.approve(escrow, amount) first.
     * @param agent  Wallet address of the AI agent's owner (will receive payment on release).
     * @param amount USDC amount in ERC-20 token units (call decimals() — typically 6 on Arc).
     * @return jobId The on-chain job ID. Store this in Supabase as onchain_job_id.
     */
    function createJob(address agent, uint256 amount)
        external
        nonReentrant
        returns (uint256 jobId)
    {
        if (agent == address(0)) revert InvalidAgent();
        if (amount == 0) revert InvalidAmount();

        bool ok = usdc.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        jobId = nextJobId++;
        jobs[jobId] = Job({
            buyer: msg.sender,
            agent: agent,
            amount: amount,
            status: JobStatus.Funded,
            deliveryHash: ""
        });

        emit JobCreated(jobId, msg.sender, agent, amount);
    }

    // ─── Agent (or admin): submit delivery ────────────────────────────────────

    /**
     * @notice Mark a job as delivered.
     * @param jobId        The on-chain job ID from createJob().
     * @param deliveryHash The Supabase job UUID (or content hash) identifying the delivery.
     */
    function submitDelivery(uint256 jobId, string calldata deliveryHash) external {
        Job storage job = jobs[jobId];
        if (job.buyer == address(0)) revert JobNotFound(jobId);
        if (msg.sender != job.agent && msg.sender != owner() && !authorizedAgents[msg.sender]) revert Unauthorized();
        if (job.status != JobStatus.Funded && job.status != JobStatus.InProgress) {
            revert InvalidStatus(jobId, job.status);
        }

        job.status = JobStatus.Delivered;
        job.deliveryHash = deliveryHash;

        emit JobDelivered(jobId, deliveryHash);
    }

    // ─── Buyer: approve and release payment ───────────────────────────────────

    /**
     * @notice Approve the delivery and release USDC to the agent.
     */
    function approveAndRelease(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        if (job.buyer == address(0)) revert JobNotFound(jobId);
        if (msg.sender != job.buyer) revert Unauthorized();
        if (job.status != JobStatus.Delivered) revert InvalidStatus(jobId, job.status);

        job.status = JobStatus.Released;
        bool ok = usdc.transfer(job.agent, job.amount);
        if (!ok) revert TransferFailed();

        emit JobReleased(jobId, job.agent, job.amount);
    }

    // ─── Buyer: raise a dispute ───────────────────────────────────────────────

    /**
     * @notice Dispute the delivery. Funds remain locked until admin resolves.
     */
    function dispute(uint256 jobId) external {
        Job storage job = jobs[jobId];
        if (job.buyer == address(0)) revert JobNotFound(jobId);
        if (msg.sender != job.buyer) revert Unauthorized();
        JobStatus s = job.status;
        if (s != JobStatus.Funded && s != JobStatus.InProgress && s != JobStatus.Delivered) {
            revert InvalidStatus(jobId, s);
        }

        job.status = JobStatus.Disputed;
        emit JobDisputed(jobId, msg.sender);
    }

    // ─── Admin: refund buyer (v1 manual dispute resolution) ──────────────────

    /**
     * @notice Admin-only escape hatch: return funds to the buyer.
     *         Use for disputed or stuck jobs. Production should add arbitration.
     */
    function refund(uint256 jobId) external onlyOwner nonReentrant {
        Job storage job = jobs[jobId];
        if (job.buyer == address(0)) revert JobNotFound(jobId);
        JobStatus s = job.status;
        if (s != JobStatus.Disputed && s != JobStatus.Funded && s != JobStatus.InProgress) {
            revert InvalidStatus(jobId, s);
        }

        job.status = JobStatus.Refunded;
        bool ok = usdc.transfer(job.buyer, job.amount);
        if (!ok) revert TransferFailed();

        emit JobRefunded(jobId, job.buyer, job.amount);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getJob(uint256 jobId) external view returns (Job memory) {
        if (jobs[jobId].buyer == address(0)) revert JobNotFound(jobId);
        return jobs[jobId];
    }
}
