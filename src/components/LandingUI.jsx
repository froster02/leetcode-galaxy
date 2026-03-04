import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingUI({ onSearch }) {
    const [username, setUsername] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            onSearch(username.trim());
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="flex flex-col items-center pointer-events-auto"
            >
                <h1 className="text-5xl md:text-7xl font-orbitron font-bold text-accent mb-2 tracking-wider text-center drop-shadow-[0_0_15px_rgba(0,245,212,0.8)]">
                    LEETCODE GALAXY
                </h1>

                <p className="text-gray-400 mb-8 font-mono text-sm md:text-base text-center tracking-widest">
                    VISUALIZE YOUR CODING JOURNEY AS A 3D SOLAR SYSTEM
                </p>

                <div className="mb-12 flex flex-col items-center">
                    <p className="text-xl font-mono text-easy animate-pulse mb-1">
                        4,829,142 ACTIVE CODERS
                    </p>
                    <div className="h-[1px] w-32 bg-easy opacity-50"></div>
                </div>

                <form onSubmit={handleSubmit} className="relative w-full max-w-md">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-accent opacity-20 group-hover:opacity-40 blur transition duration-500 rounded-lg"></div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="ENTER LEETCODE USERNAME"
                            className="relative w-full bg-[#0a0f18] text-white border border-accent/50 rounded-lg px-6 py-4 font-mono text-lg focus:outline-none focus:border-accent transition-colors placeholder:text-gray-600"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent/10 text-accent hover:bg-accent hover:text-background transition-colors rounded"
                        >
                            <Search size={24} />
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
