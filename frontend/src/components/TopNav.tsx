import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Map, Leaf, SlidersHorizontal } from 'lucide-react';

const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/hotspots', label: 'Hotspots', icon: Map },
    { to: '/go-carbon-neutral', label: 'Go Carbon Neutral', icon: Leaf },
    { to: '/simulator', label: 'Simulator', icon: SlidersHorizontal },
];

const TopNav = () => {
    return (
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                {/* Brand */}
                <span className="text-xl font-bold tracking-tight text-emerald-400">
                    Carbon<span className="text-white">Lane</span>
                </span>

                {/* Nav Links */}
                <nav className="hidden items-center gap-1 md:flex">
                    {links.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`
                            }
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Live Pill */}
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Live
                </div>
            </div>

            {/* Mobile Nav */}
            <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-800 px-4 py-2 md:hidden">
                {links.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isActive
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-slate-400 hover:text-white'
                            }`
                        }
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
};

export default TopNav;
