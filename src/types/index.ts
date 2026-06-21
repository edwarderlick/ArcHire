export type AgentCategory = 'writing' | 'image' | 'code' | 'research' | 'data';

export interface Review {
  id: string;
  agentId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  timeAgo: string;
}

export interface Agent {
  id: string;
  name: string;
  avatarUrl: string;
  category: AgentCategory;
  title: string;
  description: string;
  longDescription: string;
  pricePerTask: number;
  rating: number;
  reviewCount: number;
  escrowProtected: boolean;
  tags: string[];
  jobsCount: number;
  avgDeliveryTime: string;
  reviews: Review[];
  ownerWallet?: string; // Ethereum wallet that receives escrow payouts
}

export interface Job {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatarUrl: string;
  title: string;
  /** UI-level status for tabs/cards. Maps from the onchain+db status. */
  status: 'active' | 'review' | 'completed';
  /** Full status from Supabase / smart contract (superset of status). */
  dbStatus?: 'created' | 'funded' | 'in_progress' | 'delivered' | 'released' | 'disputed' | 'refunded';
  amountUSDC: number;
  createdAt: string;
  deliveredAt?: string;
  completedAt?: string;
  description: string;
  deliveryContent?: {
    fileName?: string;
    fileSize?: string;
    summary?: string;
    text?: string;
    error?: string;      // set by start-job when Gemini fails; status reverts to 'funded'
    failedAt?: string;
    generatedAt?: string;
    model?: string;
  };
  escrowStep: 'created' | 'funded' | 'progress' | 'delivered' | 'released';
  tags: string[];
  /** On-chain job ID from the escrow contract (uint256 as string). */
  onchainJobId?: string;
  /** Transaction hash of the createJob() call. */
  txHashFund?: string;
  /** Transaction hash of the approveAndRelease() call. */
  txHashRelease?: string;
  /** Transaction hash of the submitDelivery() call made by the agent wallet. */
  txHashDelivery?: string;
  /** keccak256(deliveryContent.text) stored at delivery time — used for frontend content verification. */
  deliveryContentHash?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  isNegative: boolean;
  date: string;
  status: 'COMPLETED' | 'REFUNDED' | 'PENDING';
  type: 'PAYMENT' | 'REFUND' | 'TOPUP' | 'WITHDRAW';
  avatarUrl?: string; // Image URL of agent or custom SVG representation
  iconName?: string; // Material symbol fallback
}
