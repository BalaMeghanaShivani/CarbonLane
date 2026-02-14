import { Outlet } from 'react-router-dom';
import TopNav from '../components/TopNav';

const TopNavLayout = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <TopNav />
            <main className="mx-auto max-w-6xl px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default TopNavLayout;
