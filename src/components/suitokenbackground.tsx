import React, { useEffect, useState, useMemo } from 'react';

const SUI_PROTOCOLS = [
  { name: 'Sui', logo: 'https://cryptologos.cc/logos/sui-sui-logo.png' },
  { name: 'Cetus', logo: 'https://raw.githubusercontent.com/sui-ecosystem/logos/main/cetus.png' },
  { name: 'DeepBook', logo: 'https://raw.githubusercontent.com/sui-ecosystem/logos/main/deepbook.png' },
  { name: 'Navi', logo: 'https://raw.githubusercontent.com/sui-ecosystem/logos/main/navi.png' },
  { name: 'Scallop', logo: 'https://raw.githubusercontent.com/sui-ecosystem/logos/main/scallop.png' },
];

const FlipToken = ({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlipped(prev => !prev);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % SUI_PROTOCOLS.length);
      }, 500);
    }, 4000 + delay);
    return () => clearInterval(timer);
  }, [delay]);

  return (
    <div 
      className="absolute transition-all duration-[3000ms] ease-in-out"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div 
        className="relative transition-transform duration-1000"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {[0, 180].map((rotation) => (
          <div
            key={rotation}
            className={`
              absolute inset-0 rounded-full flex items-center justify-center p-2
              backdrop-blur-sm border shadow-xl transition-colors duration-700
              /* Utility class for 3D visibility */
              [backface-visibility:hidden] [-webkit-backface-visibility:hidden]
              /* Light Mode */
              bg-white/60 border-blue-200 shadow-blue-200/50
              /* Dark Mode */
              dark:bg-blue-950/40 dark:border-cyan-500/30 dark:shadow-cyan-500/20
            `}
            style={{ 
              transform: `rotateY(${rotation}deg)` 
            }}
          >
            <img 
              src={SUI_PROTOCOLS[(index + (rotation === 180 ? 1 : 0)) % SUI_PROTOCOLS.length].logo} 
              alt="token" 
              className="w-3/4 h-3/4 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const Sui3DBackground = () => {
  const tokens = useMemo(() => Array.from({ length: 18 }).map((_, i) => ({
    id: i,
    x: Math.random() * 90,
    y: Math.random() * 90,
    size: Math.random() * 30 + 50, // Slightly larger for visibility
    delay: Math.random() * 3000,
  })), []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-1000 bg-slate-50 dark:bg-[#020b14]">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 opacity-40 dark:opacity-20 bg-[radial-gradient(circle_at_50%_50%,#0ea5e9_0%,transparent_70%)]" />
      
      <div className="relative w-full h-full">
        {tokens.map(t => (
          <FlipToken key={t.id} {...t} />
        ))}
      </div>
    </div>
  );
};

export default Sui3DBackground;