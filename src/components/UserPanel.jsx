import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function UserPanel({ data, onBack }) {
    if (!data) return null;

    const { profile, stats, recent, planets } = data;

    const totalSolved = stats.find(s => s.difficulty === 'All')?.count || 0;
    const easySolved = stats.find(s => s.difficulty === 'Easy')?.count || 0;
    const medSolved = stats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = stats.find(s => s.difficulty === 'Hard')?.count || 0;

    const handleShare = async () => {
        try {
            const canvas = await html2canvas(document.body);
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `${data.username}-galaxy.png`;
            link.click();
        } catch (error) {
            console.error("Failed to generate share image", error);
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none p-6 flex justify-between font-mono z-10 text-white">
            {/* Top Buttons */}
            <div className="absolute top-6 left-6 flex space-x-4 pointer-events-auto">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-2 bg-black/50 border border-accent/20 px-4 py-2 rounded text-accent hover:bg-accent hover:text-black transition-colors backdrop-blur"
                >
                    <ArrowLeft size={18} />
                    <span>BACK TO GALAXY</span>
                </button>
            </div>

            <div className="absolute top-6 right-6 pointer-events-auto">
                <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 bg-black/50 border border-accent/20 px-4 py-2 rounded text-accent hover:bg-accent hover:text-black transition-colors backdrop-blur"
                >
                    <Share2 size={18} />
                    <span>SHARE MY GALAXY</span>
                </button>
            </div>

            {/* Left Panel - Topics */}
            <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-16 w-64 bg-black/40 border border-accent/20 p-4 rounded backdrop-blur-md pointer-events-auto max-h-[70vh] overflow-y-auto"
            >
                <h3 className="text-xl font-orbitron text-accent mb-4 border-b border-accent/20 pb-2">CONSTELLATIONS</h3>
                <div className="space-y-4">
                    {planets.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="truncate pr-2" title={p.name}>{p.name}</span>
                            <span className="text-accent min-w-[30px] text-right">{p.problemsSolved}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Right Panel - Stats */}
            <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-16 w-72 bg-black/40 border border-accent/20 p-4 rounded backdrop-blur-md pointer-events-auto flex flex-col"
            >
                <div className="text-center mb-6 border-b border-accent/20 pb-4">
                    <h2 className="text-2xl font-orbitron text-accent">{data.username}</h2>
                    <p className="text-gray-400 mt-1">Rank: {profile.ranking.toLocaleString()}</p>
                </div>

                <h3 className="text-lg font-orbitron mb-3">PROBLEMS SOLVED</h3>
                <div className="text-3xl text-center mb-4 font-bold">{totalSolved}</div>

                <div className="space-y-3 mb-6">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-easy">Easy</span>
                            <span>{easySolved}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded overflow-hidden">
                            <div className="bg-easy h-full" style={{ width: `${(easySolved / totalSolved) * 100}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-medium">Medium</span>
                            <span>{medSolved}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded overflow-hidden">
                            <div className="bg-medium h-full" style={{ width: `${(medSolved / totalSolved) * 100}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-hard">Hard</span>
                            <span>{hardSolved}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded overflow-hidden">
                            <div className="bg-hard h-full" style={{ width: `${(hardSolved / totalSolved) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                <h3 className="text-lg font-orbitron mb-3 border-t border-accent/20 pt-4">RECENT ACTIVITY</h3>
                <div className="space-y-2 flex-grow overflow-y-auto max-h-48 text-xs text-gray-300">
                    {recent.map((sub, idx) => (
                        <div key={idx} className="flex justify-between items-start border-l-2 border-accent/30 pl-2">
                            <div className="truncate pr-2" title={sub.title}>{sub.title}</div>
                            <div className={sub.statusDisplay === 'Accepted' ? 'text-easy shrink-0' : 'text-hard shrink-0'}>
                                {sub.statusDisplay === 'Accepted' ? 'AC' : 'WA'}
                            </div>
                        </div>
                    ))}
                    {recent.length === 0 && <p className="text-gray-500 italic">No recent activity.</p>}
                </div>
            </motion.div>
        </div>
    );
}
