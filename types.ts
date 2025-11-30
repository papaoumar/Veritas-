export enum VoteType {
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  MANIPULATED = 'MANIPULATED',
  UNCERTAIN = 'UNCERTAIN'
}

export enum PaymentMethod {
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  NONE = 'NONE'
}

export interface PaymentConfig {
  method: PaymentMethod;
  paypalEmail?: string;
  bankDetails?: {
    iban: string;
    bic: string;
    ownerName: string;
  };
}

export interface Source {
  title: string;
  uri: string;
}

export interface AiAnalysis {
  verdict: VoteType;
  confidence: number;
  summary: string;
  sources: Source[];
  analyzedAt: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  isExpert: boolean;
  credibilityScore: number; // 0 to 100
  walletBalance: number; // Veritas Tokens (VXT)
  paymentConfig?: PaymentConfig;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Claim {
  id: string;
  title: string;
  content: string;
  author: User;
  timestamp: number;
  category: string;
  votes: {
    [key in VoteType]: number;
  };
  userVote?: VoteType; // Vote actuel de l'utilisateur
  userVoteTimestamp?: number; // Timestamp du vote de l'utilisateur
  aiAnalysis?: AiAnalysis;
  comments: Comment[];
  imageUrl?: string;
  videoUrl?: string;
  bountyAmount: number; // Récompense en VXT pour la participation
}

export type ViewState = 'FEED' | 'DETAIL' | 'SUBMIT' | 'PROFILE';