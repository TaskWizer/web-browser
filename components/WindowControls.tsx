import React from 'react';
import { ICONS } from '../constants';

export const WindowControls: React.FC = () => {
    return (
        <div className="flex items-center gap-2 px-4 flex-shrink-0">
            <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full">
                {ICONS.WINDOW_MINIMIZE}
            </button>
            <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full">
                {ICONS.WINDOW_MAXIMIZE}
            </button>
            <button className="p-1.5 text-white bg-red-600/80 hover:bg-red-500 rounded-full">
                {ICONS.WINDOW_CLOSE}
            </button>
        </div>
    );
};
