
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

export enum ExpertLevel {
  OBSERVER = 'Observateur',
  ANALYST = 'Analyste',
  EXPERT = 'Expert',
  MASTER = 'Maître Vérificateur'
}

export interface UserStats {
  totalVerifications: number;
  correctVerifications: number;
  accuracyRate: number; // Pourcentage
  currentStreak: number; // Série de votes corrects consécutifs
  reputationPoints: number; // Points accumulés pour monter de niveau
}

export interface ReferralStats {
  code: string;
  totalReferred: number;
  totalEarnings: number; // VXT gagnés via parrainage
  pendingEarnings: number; // En attente de validation (ex: le filleul doit faire 1 vote)
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

export interface SecurityConfig {
  twoFactorEnabled: boolean;
  lastPasswordChange: number;
}

export interface UserPreferences {
  language: 'fr' | 'en';
  emailNotifications: boolean;
  marketingEmails: boolean;
  publicProfile: boolean;
  showBalance: boolean;
  darkMode: boolean;
  blockedCategories: string[]; // Catégories que l'utilisateur ne veut pas voir
}

export interface Transaction {
  id: string;
  type: 'VOTE' | 'EARNING' | 'WITHDRAWAL' | 'DEPOSIT';
  amount: number;
  description: string;
  timestamp: number;
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
  email: string;
  password?: string;
  bio?: string; // Biographie courte
  bannerUrl?: string; // Image de couverture
  socialStats?: {
    followers: number;
    following: number;
  };
  country?: string;
  memberSince?: number;
  isExpert: boolean;
  expertLevel: ExpertLevel;
  stats: UserStats;
  referralStats?: ReferralStats; // Stats d'affiliation
  credibilityScore: number;
  walletBalance: number;
  transactions?: Transaction[];
  paymentConfig?: PaymentConfig;
  security?: SecurityConfig;
  preferences?: UserPreferences;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface VoteRecord {
  userId: string;
  voteType: VoteType;
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
  voteHistory: VoteRecord[];
  userVote?: VoteType;
  userVoteTimestamp?: number;
  aiAnalysis?: AiAnalysis;
  comments: Comment[];
  imageUrl?: string;
  videoUrl?: string;
  bountyAmount: number;
  isSubscribed?: boolean;
}

export type ViewState = 'FEED' | 'DETAIL' | 'SUBMIT' | 'PROFILE' | 'LOGIN' | 'SETTINGS';
