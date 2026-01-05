"use client";

import { useState, useEffect } from "react";
import { ToyFrame } from "./ToyFrame";

// Debug mode - set to true for unlimited claims
const DEBUG_MODE = false;

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

interface PersonalityTrait {
    trait: string;
    description: string;
}

interface Cockroach {
    id: string;
    name: string;
    species: string;
    rarity: Rarity;
    personality: PersonalityTrait[];
    collectedAt: number;
    emoji: string;
}

interface CollectedRoach extends Cockroach {
    count: number;
}

interface ClaimHistory {
    timestamp: number;
    isPaid: boolean;
}

// Cockroach database with fixed set
const COCKROACH_DATABASE: Omit<Cockroach, "id" | "collectedAt">[] = [
    // Common (50% base drop rate)
    { name: "House Dweller", species: "Blattella germanica", rarity: "common", emoji: "🪳", personality: [{ trait: "Timid", description: "Scurries away at the slightest movement" }] },
    { name: "Kitchen Crawler", species: "Periplaneta americana", rarity: "common", emoji: "🪳", personality: [{ trait: "Opportunistic", description: "Always looking for crumbs" }] },
    { name: "Basement Lurker", species: "Blatta orientalis", rarity: "common", emoji: "🪳", personality: [{ trait: "Nocturnal", description: "Only active at night" }] },
    { name: "Drain Dweller", species: "Supella longipalpa", rarity: "common", emoji: "🪳", personality: [{ trait: "Aquatic", description: "Loves damp places" }] },

    // Uncommon (30% base drop rate)
    { name: "Garden Aristocrat", species: "Parcoblatta pennsylvanica", rarity: "uncommon", emoji: "🦗", personality: [{ trait: "Refined", description: "Prefers organic matter" }, { trait: "Social", description: "Lives in small colonies" }] },
    { name: "Wall Whisperer", species: "Ectobius lapponicus", rarity: "uncommon", emoji: "🪲", personality: [{ trait: "Mysterious", description: "Appears in unexpected places" }, { trait: "Agile", description: "Incredible climbing skills" }] },
    { name: "Compost Connoisseur", species: "Eucorydia dasytoides", rarity: "uncommon", emoji: "🐛", personality: [{ trait: "Eco-friendly", description: "Helps decompose waste" }, { trait: "Colorful", description: "Vibrant exoskeleton" }] },

    // Rare (15% base drop rate)
    { name: "Hissing Gentleman", species: "Gromphadorhina portentosa", rarity: "rare", emoji: "🦂", personality: [{ trait: "Vocal", description: "Communicates through hissing" }, { trait: "Gentle Giant", description: "Large but peaceful" }, { trait: "Protective", description: "Defends territory" }] },
    { name: "Flying Phantom", species: "Megaloblatta longipennis", rarity: "rare", emoji: "🦟", personality: [{ trait: "Aerial", description: "Can actually fly well" }, { trait: "Elusive", description: "Rarely seen by humans" }] },
    { name: "Tropical Dandy", species: "Lucihormetica subcincta", rarity: "rare", emoji: "✨", personality: [{ trait: "Bioluminescent", description: "Glows in the dark" }, { trait: "Exotic", description: "From distant rainforests" }] },

    // Epic (4% base drop rate)
    { name: "Emperor Roach", species: "Macropanesthia rhinoceros", rarity: "epic", emoji: "👑", personality: [{ trait: "Regal", description: "Commands respect" }, { trait: "Long-lived", description: "Can live up to 10 years" }, { trait: "Heavy", description: "Heaviest cockroach species" }, { trait: "Wingless Warrior", description: "Powerful despite no wings" }] },
    { name: "Cyber Scuttler", species: "Roachicus digitalis", rarity: "epic", emoji: "🤖", personality: [{ trait: "Tech-savvy", description: "Lives in server rooms" }, { trait: "Electromagnetic", description: "Attracted to electronics" }, { trait: "Fast", description: "Lightning quick reflexes" }] },

    // Legendary (1% base drop rate)
    { name: "Ancient One", species: "Carboniferous immortalis", rarity: "legendary", emoji: "🦕", personality: [{ trait: "Prehistoric", description: "Unchanged for 300 million years" }, { trait: "Wise", description: "Has seen civilizations rise and fall" }, { trait: "Immortal", description: "Practically indestructible" }, { trait: "Philosopher", description: "Contemplates existence" }] },
    { name: "Roach King", species: "Imperator maximus", rarity: "legendary", emoji: "👑", personality: [{ trait: "Supreme Ruler", description: "Leader of all roachkind" }, { trait: "Strategic", description: "Master tactician" }, { trait: "Charismatic", description: "Inspires loyalty" }, { trait: "Ancient Lineage", description: "From royal bloodline" }] },
];

// Rarity weights
const RARITY_WEIGHTS: Record<Rarity, number> = {
    common: 50,
    uncommon: 30,
    rare: 15,
    epic: 4,
    legendary: 1
};

// Claims affect drop rates
const calculateAdjustedWeights = (claimsToday: number): Record<Rarity, number> => {
    const baseWeights = { ...RARITY_WEIGHTS };

    // More claims = slightly better odds for rare items
    const luckBonus = Math.min(claimsToday * 0.5, 5);

    return {
        common: Math.max(baseWeights.common - luckBonus, 30),
        uncommon: baseWeights.uncommon,
        rare: baseWeights.rare + luckBonus * 0.4,
        epic: baseWeights.epic + luckBonus * 0.1,
        legendary: baseWeights.legendary + luckBonus * 0.05
    };
};

const selectRarity = (claimsToday: number): Rarity => {
    const weights = calculateAdjustedWeights(claimsToday);
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * total;

    for (const [rarity, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) return rarity as Rarity;
    }

    return "common";
};

const generateCockroach = (claimsToday: number): Cockroach => {
    const rarity = selectRarity(claimsToday);
    const pool = COCKROACH_DATABASE.filter(r => r.rarity === rarity);
    const template = pool[Math.floor(Math.random() * pool.length)];

    return {
        ...template,
        id: `${template.name}-${Date.now()}-${Math.random()}`,
        collectedAt: Date.now()
    };
};

const HOUR_MS = DEBUG_MODE ? 5000 : 60 * 60 * 1000; // 5 seconds in debug, 1 hour normally
const DAY_MS = 24 * 60 * 60 * 1000;

export default function Minigame() {
    const [collection, setCollection] = useState<CollectedRoach[]>([]);
    const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
    const [timeUntilClaim, setTimeUntilClaim] = useState<number | null>(null);
    const [latestCatch, setLatestCatch] = useState<Cockroach | null>(null);
    const [selectedRoach, setSelectedRoach] = useState<CollectedRoach | null>(null);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("roach-collection");
        const savedHistory = localStorage.getItem("roach-claim-history");

        if (saved) {
            try {
                setCollection(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load collection", e);
            }
        }

        if (savedHistory) {
            try {
                setClaimHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (collection.length > 0) {
            localStorage.setItem("roach-collection", JSON.stringify(collection));
        }
    }, [collection]);

    useEffect(() => {
        if (claimHistory.length > 0) {
            localStorage.setItem("roach-claim-history", JSON.stringify(claimHistory));
        }
    }, [claimHistory]);

    // Update countdown timer
    useEffect(() => {
        const updateTimer = () => {
            if (DEBUG_MODE) {
                setTimeUntilClaim(0);
                return;
            }

            const lastClaim = claimHistory[claimHistory.length - 1];
            if (!lastClaim) {
                setTimeUntilClaim(0);
                return;
            }

            const timeSince = Date.now() - lastClaim.timestamp;
            const remaining = Math.max(0, HOUR_MS - timeSince);
            setTimeUntilClaim(remaining);
        };

        // Run immediately on mount/update
        updateTimer();

        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [claimHistory]);

    const canClaim = timeUntilClaim !== null && (DEBUG_MODE || timeUntilClaim === 0);

    const getClaimsToday = () => {
        const oneDayAgo = Date.now() - DAY_MS;
        return claimHistory.filter(c => c.timestamp > oneDayAgo).length;
    };

    const handleClaim = () => {
        if (!canClaim) return;

        const claimsToday = getClaimsToday();
        const newRoach = generateCockroach(claimsToday);

        setLatestCatch(newRoach);
        setSelectedRoach(null);

        // Add to collection
        setCollection(prev => {
            const existing = prev.find(r => r.name === newRoach.name && r.species === newRoach.species);
            if (existing) {
                return prev.map(r =>
                    r.name === newRoach.name && r.species === newRoach.species
                        ? { ...r, count: r.count + 1 }
                        : r
                );
            }
            return [...prev, { ...newRoach, count: 1 }];
        });

        // Add to history
        setClaimHistory(prev => [...prev, { timestamp: Date.now(), isPaid: false }]);
    };

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getRarityColor = (rarity: Rarity) => {
        const colors = {
            common: "text-gray-600",
            uncommon: "text-green-600",
            rare: "text-blue-600",
            epic: "text-purple-600",
            legendary: "text-yellow-600"
        };
        return colors[rarity];
    };

    const getRarityBg = (rarity: Rarity) => {
        const colors = {
            common: "bg-gray-100 border-gray-300",
            uncommon: "bg-green-50 border-green-300",
            rare: "bg-blue-50 border-blue-300",
            epic: "bg-purple-50 border-purple-300",
            legendary: "bg-yellow-50 border-yellow-300"
        };
        return colors[rarity];
    };

    const displayedRoach = selectedRoach || latestCatch;

    return (
        <ToyFrame>
            <div className="text-center">
                {DEBUG_MODE && <div className="text-xs text-red-600">DEBUG</div>}
            </div>
            <div className="rounded-xl w-[400px] bg-gradient-to-br from-amber-50 to-orange-100 p-3 flex flex-col gap-3">
                {/* Top Row - Inventory and Controls */}
                <div className="flex gap-3 h-[140px]">
                    {/* Left Column - Inventory */}
                    <div className="flex-1 flex flex-col">


                        {/* Scrollable 4-column Grid */}
                        <div className="flex-1 overflow-y-auto noscrollbar">
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: Math.max(8, collection.length) }).map((_, idx) => {
                                    const roach = collection[idx];
                                    return roach ? (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedRoach(roach)}
                                            className={`rounded p-1 border text-center cursor-pointer hover:opacity-80 transition-opacity ${getRarityBg(roach.rarity)}`}
                                        >
                                            <div className="text-2xl">{roach.emoji}</div>
                                            <div className="text-[8px] font-bold truncate">{roach.name}</div>
                                            <div className="text-[7px]">×{roach.count}</div>
                                        </div>
                                    ) : (
                                        <div key={idx} className="rounded border-2 border-dashed border-gray-300 bg-white/50 p-1 aspect-square" />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Controls */}
                    <div className="w-24 flex flex-col">
                        {/* Hunt Button/Timer */}
                        {timeUntilClaim === null ? (
                            <div className="bg-white rounded py-3 px-2 text-center">
                                <div className="text-sm text-gray-400">Loading...</div>
                            </div>
                        ) : canClaim ? (
                            <button
                                onClick={handleClaim}
                                className="bg-green-500 hover:bg-green-600 text-white py-3 px-2 rounded font-bold text-sm"
                            >
                                🪤<br />Hunt
                            </button>
                        ) : (
                            <div className="bg-white rounded py-3 px-2 text-center">
                                <div className="text-[9px] text-gray-600 mb-1">Next hunt</div>
                                <div className="text-sm font-bold text-orange-600">{formatTime(timeUntilClaim || 0)}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Display */}
                {displayedRoach && (
                    <div className={`rounded p-2 border-2 ${getRarityBg(displayedRoach.rarity)}`}>
                        <div className="text-center">
                            <div className="text-3xl mb-1">{displayedRoach.emoji}</div>
                            <div className={`text-[9px] font-bold ${getRarityColor(displayedRoach.rarity)}`}>
                                {displayedRoach.name}
                            </div>
                            <div className="text-[7px] italic text-gray-600 mb-1">{displayedRoach.species}</div>
                            <div className="text-[8px]">
                                {displayedRoach.personality.map((p, i) => (
                                    <div key={i} className="mb-1">
                                        <div className="font-semibold">{p.trait}</div>
                                        <div className="text-[7px]">{p.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToyFrame>
    );
}

