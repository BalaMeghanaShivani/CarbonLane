import { useCallback, useEffect, useState } from 'react';
import { useCarbonLaneData } from '../hooks/useCarbonLaneData';
import { fetchCarbonCreditsAccount, purchaseCarbonCredits } from '../api/client';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import SectionHeader from '../components/SectionHeader';
import {
    CreditCard,
    Wallet,
    TreeDeciduous,
    ExternalLink,
    CheckCircle2,
    TreePine,
} from 'lucide-react';

const TREE_PLANTING_ORGS = [
    {
        name: 'One Tree Planted',
        description: 'Plant a tree for $1. Reforestation projects across 80+ countries. Simple, transparent, impactful.',
        url: 'https://onetreeplanted.org',
        icon: TreeDeciduous,
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=400&fit=crop&q=80',
    },
    {
        name: 'Arbor Day Foundation',
        description: 'The world\'s largest membership nonprofit dedicated to planting trees. Join millions in planting trees.',
        url: 'https://www.arborday.org',
        icon: TreePine,
        image: 'https://images.unsplash.com/photo-1598902108854-10e335adac99?w=400&h=400&fit=crop&q=80',
    },
];

const GoCarbonNeutral = () => {
    const { metrics, loading, error, refetch } = useCarbonLaneData();
    const [creditsAccount, setCreditsAccount] = useState<{
        credits_balance: number;
        purchase_history: { credits: number; timestamp: string; balance_after: number }[];
    } | null>(null);
    const [purchaseAmount, setPurchaseAmount] = useState<string>('');
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

    const loadAccount = useCallback(async () => {
        try {
            const acc = await fetchCarbonCreditsAccount();
            setCreditsAccount(acc);
        } catch {
            setCreditsAccount({ credits_balance: 0, purchase_history: [] });
        }
    }, []);

    useEffect(() => {
        loadAccount();
    }, [loadAccount]);

    const handlePurchase = async () => {
        const credits = parseFloat(purchaseAmount);
        if (isNaN(credits) || credits <= 0) {
            setPurchaseError('Enter a valid number of credits');
            return;
        }
        setPurchasing(true);
        setPurchaseError(null);
        setPurchaseSuccess(null);
        try {
            const result = await purchaseCarbonCredits(credits);
            setPurchaseSuccess(`Purchased ${result.credits_purchased} credits. New balance: ${result.new_balance}`);
            setPurchaseAmount('');
            await loadAccount();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setPurchaseError(axiosErr?.response?.data?.error ?? 'Failed to purchase credits');
        } finally {
            setPurchasing(false);
        }
    };

    const totalCo2Kg = Number(metrics?.total_co2_kg ?? 0) || 0;
    const treesRequired = Number(metrics?.trees_required ?? 0) || 0;

    if (loading && !metrics) return <Loader />;
    if (error && !metrics) return <ErrorState message={error} onRetry={refetch} />;

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-semibold text-white">Go Carbon Neutral</h1>
                <p className="mt-1 text-sm text-slate-400">
                    Offset your drive-through carbon footprint. Choose carbon credits or plant trees.
                </p>
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <h3 className="text-lg font-medium text-white">Your Carbon Footprint</h3>
                <p className="mt-2 text-sm text-slate-400">
                    Total CO₂ from drive-through idle time: <span className="font-semibold text-emerald-400">{totalCo2Kg.toFixed(1)} kg</span>
                    {' '}· To offset: purchase <span className="font-semibold text-emerald-400">{Math.ceil(totalCo2Kg)}</span> carbon credits (1 kg CO₂ = 1 credit)
                    {' '}· Or plant <span className="font-semibold text-emerald-400">{Math.ceil(treesRequired)}</span> trees
                </p>
            </div>

            {/* Option 1: Cloverly Carbon Credits */}
            <section>
                <SectionHeader
                    title="Option 1: Carbon Credits (Cloverly)"
                    subtitle="Purchase carbon credits to offset emissions. Real-time retirement via Cloverly API (sandbox mode for demo)."
                />
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white">Purchase Carbon Credits</h3>
                            <p className="text-sm text-slate-400">1 CO₂ kg = 1 carbon credit. Buy credits and see them in your account.</p>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Purchase form */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-400">Credits to purchase</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={purchaseAmount}
                                    onChange={(e) => setPurchaseAmount(e.target.value)}
                                    placeholder={Math.ceil(totalCo2Kg) > 0 ? `e.g. ${Math.ceil(totalCo2Kg)}` : 'e.g. 50'}
                                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                <button
                                    onClick={handlePurchase}
                                    disabled={purchasing}
                                    className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {purchasing ? 'Purchasing…' : 'Purchase'}
                                </button>
                            </div>
                            <button
                                onClick={() => setPurchaseAmount(String(Math.ceil(totalCo2Kg)))}
                                className="mt-2 text-xs text-emerald-400 hover:underline"
                            >
                                Use full offset ({Math.ceil(totalCo2Kg)} credits)
                            </button>
                            {purchaseError && <p className="mt-2 text-sm text-amber-400">{purchaseError}</p>}
                            {purchaseSuccess && <p className="mt-2 text-sm text-emerald-400">{purchaseSuccess}</p>}
                        </div>

                        {/* Account balance */}
                        <div className="rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 shadow-inner">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-emerald-500/20 p-2">
                                    <Wallet className="h-5 w-5 text-emerald-400" />
                                </div>
                                <span className="text-base font-semibold text-white">Your Account</span>
                            </div>
                            <div className="mt-4 rounded-lg bg-slate-900/60 px-4 py-4">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Balance</p>
                                <p className="mt-1 text-4xl font-bold tabular-nums text-white">
                                    {creditsAccount?.credits_balance ?? 0}
                                </p>
                                <p className="text-sm text-slate-400">carbon credits</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Option 2: Tree Planting */}
            <section>
                <SectionHeader
                    title="Option 2: Plant Trees"
                    subtitle={`You need ~${Math.ceil(treesRequired)} trees to offset your footprint (22 kg CO₂ per tree/year). Contact these organizations to plant trees.`}
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {TREE_PLANTING_ORGS.map((org) => {
                        const Icon = org.icon;
                        return (
                            <a
                                key={org.name}
                                href={org.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg transition hover:border-emerald-500/50 hover:shadow-emerald-500/10"
                            >
                                <div className="relative mb-3 flex h-24 w-24 overflow-hidden rounded-lg bg-slate-800">
                                    <img
                                        src={org.image}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                            if (fallback) fallback.classList.remove('hidden');
                                        }}
                                    />
                                    <div className="absolute inset-0 hidden flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                                        <Icon className="h-8 w-8" />
                                    </div>
                                </div>
                                <h4 className="font-medium text-white group-hover:text-emerald-400">{org.name}</h4>
                                <p className="mt-1 flex-1 text-sm text-slate-400">{org.description}</p>
                                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-400">
                                    Visit site
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </span>
                            </a>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default GoCarbonNeutral;
