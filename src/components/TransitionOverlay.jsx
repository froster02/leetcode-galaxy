import React from 'react';
import { motion } from 'framer-motion';

export default function TransitionOverlay({ stage }) {
    // stage: 0 (not transitioning), 1 (locating), 2 (entering)
    if (stage === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === 2 ? 1 : 0.8 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 ${stage === 2 ? 'bg-black' : 'bg-transparent'}`}
        >
            <div className="flex flex-col items-center bg-black/50 p-8 rounded-lg border border-accent/20 backdrop-blur-md">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-orbitron font-bold text-accent tracking-widest animate-pulse">
                    {stage === 1 ? 'LOCATING YOUR STAR...' : 'ENTERING SOLAR SYSTEM...'}
                </h2>
            </div>
        </motion.div>
    );
}
