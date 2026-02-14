import CarbonHeatmap from '../components/CarbonHeatmap';

const Hotspots = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-semibold text-white">Hotspots</h1>
                <p className="mt-1 text-sm text-slate-400">Identify carbon-intense hours and days at a glance</p>
            </div>
            <CarbonHeatmap />
        </div>
    );
};

export default Hotspots;
