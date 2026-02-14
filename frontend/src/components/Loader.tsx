import { Loader2 } from 'lucide-react';

const Loader = () => {
    return (
        <div className="flex h-full items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-eco-green" />
        </div>
    );
};

export default Loader;
