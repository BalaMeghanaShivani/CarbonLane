interface SectionHeaderProps {
    title: string;
    subtitle?: string;
}

const SectionHeader = ({ title, subtitle }: SectionHeaderProps) => (
    <div className="mb-5">
        <h2 className="text-xl font-medium text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
);

export default SectionHeader;
