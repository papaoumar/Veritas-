
import { User, Claim, ExpertLevel, VoteType, PaymentMethod, VoteRecord, Transaction } from './types';

const USERS_KEY = 'veritas_db_users';
const CLAIMS_KEY = 'veritas_db_claims';
const CURRENT_USER_KEY = 'veritas_db_session';

// --- MOCK DATA FOR SEEDING ---

const generateMockHistory = (votes: { [key in VoteType]: number }): VoteRecord[] => {
  const history: VoteRecord[] = [];
  const now = Date.now();
  Object.entries(votes).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      history.push({
        userId: `mock_user_${Math.random()}`,
        voteType: type as VoteType,
        timestamp: now - Math.floor(Math.random() * 10000000)
      });
    }
  });
  return history;
};

const generateMockTransactions = (balance: number): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = Date.now();
  
  // Initial deposit
  transactions.push({
    id: `tx_${Math.random()}`,
    type: 'DEPOSIT',
    amount: 50,
    description: 'Bonus de bienvenue',
    timestamp: now - 100000000
  });

  // Some earnings
  for(let i=0; i<5; i++) {
     transactions.push({
      id: `tx_${Math.random()}`,
      type: 'EARNING',
      amount: Math.floor(Math.random() * 20) + 5,
      description: 'Récompense de vérification',
      timestamp: now - Math.floor(Math.random() * 80000000)
    });
  }

  // Some votes
  for(let i=0; i<8; i++) {
     transactions.push({
      id: `tx_${Math.random()}`,
      type: 'VOTE',
      amount: -5,
      description: 'Participation au vote',
      timestamp: now - Math.floor(Math.random() * 80000000)
    });
  }

  return transactions.sort((a,b) => b.timestamp - a.timestamp);
};

const SEED_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alex D.',
    avatar: 'https://picsum.photos/100/100',
    email: 'alex@test.com',
    password: 'password123', // For demo purposes only
    bio: 'Passionné par la vérité et la data science. Je vérifie tout ce qui bouge.',
    bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    socialStats: { followers: 142, following: 28 },
    country: 'France',
    memberSince: Date.now() - 100000000,
    isExpert: false,
    expertLevel: ExpertLevel.ANALYST,
    stats: { totalVerifications: 142, correctVerifications: 125, accuracyRate: 88, currentStreak: 5, reputationPoints: 1250 },
    credibilityScore: 85,
    walletBalance: 1250,
    transactions: generateMockTransactions(1250),
    paymentConfig: { method: PaymentMethod.NONE },
    preferences: { language: 'fr', emailNotifications: true, marketingEmails: false, publicProfile: true, showBalance: true, darkMode: false, blockedCategories: [] },
    security: { twoFactorEnabled: false, lastPasswordChange: Date.now() - 10000000 },
    referralStats: { code: 'ALEX-D-88', totalReferred: 12, totalEarnings: 600, pendingEarnings: 50 }
  },
  {
    id: 'u2',
    name: 'Sarah Connor',
    avatar: 'https://picsum.photos/101/101',
    email: 'sarah@test.com',
    password: 'password123',
    bio: 'Journaliste d\'investigation indépendante. Spécialisée en Tech et IA.',
    bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    socialStats: { followers: 3500, following: 120 },
    country: 'USA',
    memberSince: Date.now() - 200000000,
    isExpert: true,
    expertLevel: ExpertLevel.EXPERT,
    stats: { totalVerifications: 1500, correctVerifications: 1380, accuracyRate: 92, currentStreak: 12, reputationPoints: 3500 },
    credibilityScore: 92,
    walletBalance: 4500,
    transactions: generateMockTransactions(4500),
    preferences: { language: 'en', emailNotifications: true, marketingEmails: true, publicProfile: true, showBalance: true, darkMode: true, blockedCategories: [] },
    referralStats: { code: 'SARAH-C-99', totalReferred: 45, totalEarnings: 2250, pendingEarnings: 150 }
  },
  {
    id: 'u4',
    name: 'Veritas Watch',
    avatar: 'https://picsum.photos/103/103',
    email: 'admin@veritas.com',
    password: 'admin',
    country: 'International',
    memberSince: Date.now() - 300000000,
    isExpert: true,
    expertLevel: ExpertLevel.MASTER,
    stats: { totalVerifications: 5000, correctVerifications: 4900, accuracyRate: 98, currentStreak: 50, reputationPoints: 8000 },
    credibilityScore: 95,
    walletBalance: 8000,
    transactions: generateMockTransactions(8000),
    preferences: { language: 'fr', emailNotifications: true, marketingEmails: false, publicProfile: true, showBalance: true, darkMode: false, blockedCategories: [] },
    referralStats: { code: 'VERITAS-ADM', totalReferred: 500, totalEarnings: 25000, pendingEarnings: 0 }
  },
  {
    id: 'u5',
    name: 'Hiroshi T.',
    avatar: 'https://picsum.photos/104/104',
    email: 'hiroshi@test.com',
    password: 'password123',
    country: 'Japon',
    memberSince: Date.now() - 50000000,
    isExpert: true,
    expertLevel: ExpertLevel.EXPERT,
    stats: { totalVerifications: 800, correctVerifications: 750, accuracyRate: 94, currentStreak: 8, reputationPoints: 2800 },
    credibilityScore: 94,
    walletBalance: 2100,
    transactions: generateMockTransactions(2100),
    preferences: { language: 'en', emailNotifications: true, marketingEmails: true, publicProfile: true, showBalance: true, darkMode: true, blockedCategories: [] },
    referralStats: { code: 'HIROSHI-77', totalReferred: 5, totalEarnings: 250, pendingEarnings: 50 }
  },
  {
    id: 'u6',
    name: 'Amara K.',
    avatar: 'https://picsum.photos/105/105',
    email: 'amara@test.com',
    password: 'password123',
    country: 'Sénégal',
    memberSince: Date.now() - 150000000,
    isExpert: false,
    expertLevel: ExpertLevel.ANALYST,
    stats: { totalVerifications: 320, correctVerifications: 290, accuracyRate: 90, currentStreak: 3, reputationPoints: 950 },
    credibilityScore: 89,
    walletBalance: 850,
    transactions: generateMockTransactions(850),
    preferences: { language: 'fr', emailNotifications: true, marketingEmails: false, publicProfile: true, showBalance: true, darkMode: false, blockedCategories: [] },
    referralStats: { code: 'AMARA-K-22', totalReferred: 2, totalEarnings: 100, pendingEarnings: 0 }
  }
];

const SEED_CLAIMS: Claim[] = [
  {
    id: 'c3',
    title: "Deepfake : Le président annonce sa démission ?",
    content: "Une vidéo très réaliste circule sur Telegram montrant le président annonçant sa démission immédiate. L'analyse labiale semble suspecte et aucune source officielle ne confirme.",
    category: 'Politique',
    author: SEED_USERS[2],
    timestamp: Date.now() - 7200000,
    votes: { TRUE: 2, FALSE: 89, MANIPULATED: 150, UNCERTAIN: 10 },
    voteHistory: [],
    comments: [],
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    bountyAmount: 100,
  },
  {
    id: 'c1',
    title: "L'intelligence artificielle a créé une nouvelle langue indéchiffrable",
    content: "Des chercheurs affirment que deux modèles d'IA ont commencé à communiquer entre eux dans une langue inconnue que les développeurs ne peuvent pas désactiver. Cela pose un risque existentiel immédiat.",
    category: 'Tech',
    author: SEED_USERS[1],
    timestamp: Date.now() - 86400000 * 2,
    votes: { TRUE: 12, FALSE: 45, MANIPULATED: 8, UNCERTAIN: 5 },
    voteHistory: [],
    comments: [
      {
        id: 'cm1',
        userId: 'u3',
        userName: 'Jean Bon',
        text: 'C\'est une vieille rumeur de 2017 concernant les bots de Facebook, ça a été debunké.',
        timestamp: Date.now() - 86000000 * 2,
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60',
    bountyAmount: 50,
  },
  {
    id: 'c2',
    title: "Le gouvernement va interdire les voitures thermiques en 2028",
    content: "Une nouvelle loi secrète serait en préparation pour avancer l'interdiction de vente de véhicules thermiques à 2028 au lieu de 2035, sans compensation pour les propriétaires actuels.",
    category: 'Politique',
    author: { ...SEED_USERS[0], id: 'u3', name: 'Jean Bon' }, // Mock separate user
    timestamp: Date.now() - 3600000 * 4,
    votes: { TRUE: 5, FALSE: 12, MANIPULATED: 30, UNCERTAIN: 2 },
    voteHistory: [],
    comments: [],
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=60',
    bountyAmount: 20,
  }
];

// Initialize history for seed claims
SEED_CLAIMS.forEach(c => {
  c.voteHistory = generateMockHistory(c.votes);
});

// --- SERVICE METHODS ---

export const StorageService = {
  // Initialize DB if empty
  init: () => {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(CLAIMS_KEY)) {
      localStorage.setItem(CLAIMS_KEY, JSON.stringify(SEED_CLAIMS));
    }
  },

  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User) => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: (userId: string) => {
    const users = StorageService.getUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  },

  getClaims: (): Claim[] => {
    const data = localStorage.getItem(CLAIMS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveClaims: (claims: Claim[]) => {
    localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
  },

  // Session Management
  getCurrentUser: (): User | null => {
    const id = localStorage.getItem(CURRENT_USER_KEY);
    if (!id) return null;
    const users = StorageService.getUsers();
    return users.find(u => u.id === id) || null;
  },

  login: (userId: string) => {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};
