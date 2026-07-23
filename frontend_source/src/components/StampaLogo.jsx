import React from 'react';

export default function StampaLogo({ className = '', size = 80 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} select-none`}
        >
            <defs>
                {/* Premium Gold/Amber Gradients */}
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" /> {/* amber-400 */}
                    <stop offset="30%" stopColor="#f59e0b" /> {/* amber-500 */}
                    <stop offset="70%" stopColor="#d97706" /> {/* amber-600 */}
                    <stop offset="100%" stopColor="#92400e" /> {/* amber-800 */}
                </linearGradient>
                <linearGradient id="goldLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" /> {/* yellow-200 */}
                    <stop offset="100%" stopColor="#f59e0b" /> {/* amber-500 */}
                </linearGradient>
                <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#78350f" floodOpacity="0.3" />
                </filter>
            </defs>

            {/* Outer Glow / Soft Shadow */}
            <circle cx="50" cy="50" r="45" fill="#121110" filter="url(#softShadow)" />

            {/* Teeth / Geared outer badge ring */}
            <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#goldGradient)"
                strokeWidth="1.5"
                strokeDasharray="3 2"
            />

            {/* Solid outer border ring */}
            <circle
                cx="50"
                cy="50"
                r="38"
                stroke="url(#goldGradient)"
                strokeWidth="1"
            />

            {/* Thin inner ring */}
            <circle
                cx="50"
                cy="50"
                r="35"
                stroke="url(#goldGradient)"
                strokeWidth="0.5"
                strokeOpacity="0.5"
            />

            {/* Center Emblem: Vector Stamp Press Tool Handle */}
            <g transform="translate(50, 48) scale(0.95)">
                {/* Stamp Base / Plate */}
                <path
                    d="M -16,16 L 16,16"
                    stroke="url(#goldLight)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                />
                
                {/* Bottom support shape */}
                <path
                    d="M -13,16 C -13,10 -10,8 -5,8 L 5,8 C 10,8 13,10 13,16"
                    stroke="url(#goldGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="url(#goldGradient)"
                    fillOpacity="0.1"
                />

                {/* Stamp Handle (Classic neck and round top) */}
                <path
                    d="M -4,8 C -4,0 -9,-5 -9,-11 C -9,-17 -4,-21 0,-21 C 4,-21 9,-17 9,-11 C 9,-5 4,0 4,8 Z"
                    stroke="url(#goldLight)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="url(#goldGradient)"
                    fillOpacity="0.25"
                />

                {/* Glossy light reflection on the handle */}
                <path
                    d="M -3,-14 C -3,-17 -1,-19 0,-19"
                    stroke="#fef08a"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
            </g>
        </svg>
    );
}
