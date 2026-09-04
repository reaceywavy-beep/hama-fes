import React from 'react';
import { HamaRankTier, getHamaRankTier } from '../types';

export interface HamaRankEmblemProps {
  tier?: HamaRankTier;
  points?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlint?: boolean;
}

export const HamaRankEmblem: React.FC<HamaRankEmblemProps> = ({
  tier,
  points,
  size = 'md',
  className = '',
  showGlint = true,
}) => {
  const activeTier: HamaRankTier = tier || (points !== undefined ? getHamaRankTier(points) : 'BRONZE');

  const dimensionMap = {
    xs: 24,
    sm: 32,
    md: 44,
    lg: 60,
    xl: 84,
  };

  const px = dimensionMap[size] || 44;

  const renderEmblem = () => {
    switch (activeTier) {
      case 'BRONZE':
        return (
          <svg
            viewBox="0 0 100 100"
            width={px}
            height={px}
            className="shrink-0 drop-shadow-md select-none"
            aria-label="BRONZE RANK EMBLEM"
          >
            <defs>
              {/* Bronze Outer Rim Gradient */}
              <linearGradient id="bronzeRim" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D99B6A" />
                <stop offset="30%" stopColor="#8C532B" />
                <stop offset="60%" stopColor="#E2A77A" />
                <stop offset="85%" stopColor="#5E3113" />
                <stop offset="100%" stopColor="#A86838" />
              </linearGradient>

              {/* Bronze Inner Plate Gradient */}
              <radialGradient id="bronzePlate" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#8C532B" />
                <stop offset="60%" stopColor="#4A260F" />
                <stop offset="100%" stopColor="#2D1507" />
              </radialGradient>

              {/* Bronze Ingot Highlight */}
              <linearGradient id="bronzeHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE0C2" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8C532B" stopOpacity="0" />
              </linearGradient>

              {/* Bevel Shadow */}
              <filter id="bronzeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.7" />
              </filter>
            </defs>

            {/* Outer Coin Rim with Chip Notches */}
            <circle cx="50" cy="50" r="47" fill="url(#bronzeRim)" stroke="#3E1E0E" strokeWidth="1.5" />

            {/* Casino Chip Edge Notches (12 decorative slots) */}
            {[...Array(12)].map((_, i) => (
              <line
                key={i}
                x1="50"
                y1="3"
                x2="50"
                y2="8"
                stroke="#2A1408"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${i * 30} 50 50)`}
              />
            ))}

            {/* Inner Ring with Beaded Filigree */}
            <circle cx="50" cy="50" r="41" fill="none" stroke="#D99B6A" strokeWidth="1" strokeDasharray="2 2" opacity="0.85" />
            <circle cx="50" cy="50" r="38" fill="url(#bronzePlate)" stroke="#1F0D04" strokeWidth="2" filter="url(#bronzeShadow)" />

            {/* Engraved Concentric Guiding Grooves */}
            <circle cx="50" cy="50" r="32" fill="none" stroke="#D99B6A" strokeWidth="0.75" opacity="0.35" />
            <circle cx="50" cy="50" r="26" fill="none" stroke="#D99B6A" strokeWidth="0.5" opacity="0.25" />

            {/* 4 Card Suits Engraved Around Perimeter */}
            <text x="50" y="20" fontSize="7" fill="#E2A77A" textAnchor="middle" fontFamily="serif" opacity="0.8">♠</text>
            <text x="80" y="52" fontSize="7" fill="#E2A77A" textAnchor="middle" fontFamily="serif" opacity="0.8">♦</text>
            <text x="50" y="85" fontSize="7" fill="#E2A77A" textAnchor="middle" fontFamily="serif" opacity="0.8">♣</text>
            <text x="20" y="52" fontSize="7" fill="#E2A77A" textAnchor="middle" fontFamily="serif" opacity="0.8">♥</text>

            {/* Central Heavy Bronze Shield / Spade Medallion */}
            <g transform="translate(50, 48)">
              {/* Bronze Star / Laurel Backing */}
              <polygon
                points="0,-16 4.5,-5 16,-4.5 7.5,3.5 10,15 0,9 -10,15 -7.5,3.5 -16,-4.5 -4.5,-5"
                fill="url(#bronzeRim)"
                stroke="#4A260F"
                strokeWidth="1"
                opacity="0.9"
              />
              {/* Center Embossed Spade */}
              <path
                d="M 0,-10 C -5,-3 -9,2 -9,6 C -9,9.5 -6,11.5 -2.5,10.5 C -1.5,10 -0.5,9.5 0,8.5 C 0.5,9.5 1.5,10 2.5,10.5 C 6,11.5 9,9.5 9,6 C 9,2 5,-3 0,-10 Z"
                fill="#FAD1A7"
                stroke="#3D1A06"
                strokeWidth="1.2"
                filter="url(#bronzeShadow)"
              />
              {/* Spade Stem */}
              <path
                d="M -1.5,8 L -3.5,14 L 3.5,14 L 1.5,8 Z"
                fill="#FAD1A7"
                stroke="#3D1A06"
                strokeWidth="0.8"
              />
            </g>

            {/* Top Gloss Curve */}
            <path
              d="M 12,38 C 18,20 32,10 50,10 C 68,10 82,20 88,38 C 76,28 62,22 50,22 C 38,22 24,28 12,38 Z"
              fill="url(#bronzeHighlight)"
              opacity="0.35"
            />
          </svg>
        );

      case 'SILVER':
        return (
          <div className="relative inline-flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              width={px}
              height={px}
              className="shrink-0 drop-shadow-lg select-none"
              aria-label="SILVER RANK EMBLEM"
            >
              <defs>
                {/* Mirror Silver Polish Rim */}
                <linearGradient id="silverRim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="25%" stopColor="#94A3B8" />
                  <stop offset="50%" stopColor="#F8FAFC" />
                  <stop offset="75%" stopColor="#64748B" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>

                {/* Silver Sunburst Plate */}
                <radialGradient id="silverPlate" cx="50%" cy="38%" r="52%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="50%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </radialGradient>

                {/* Specular White Shimmer */}
                <linearGradient id="silverSheen" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>

                <filter id="silverGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#CBD5E1" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* 12-Sided Faceted Outer Star Polygon */}
              <polygon
                points="50,2 62,6 74,13 84,24 92,36 96,49 95,62 88,75 78,86 66,93 51,96 38,94 25,87 15,77 7,65 5,51 8,37 16,25 26,14 38,6"
                fill="url(#silverRim)"
                stroke="#1E293B"
                strokeWidth="1.5"
              />

              {/* Diamond-Cut Edge Notches */}
              {[...Array(16)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="4"
                  x2="50"
                  y2="9"
                  stroke="#334155"
                  strokeWidth="2"
                  transform={`rotate(${i * 22.5} 50 50)`}
                />
              ))}

              {/* Inner Circle Border */}
              <circle cx="50" cy="50" r="39" fill="url(#silverPlate)" stroke="#E2E8F0" strokeWidth="1.5" filter="url(#silverGlow)" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="3 2" />

              {/* Guilloche Radial Rays */}
              {[...Array(8)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="15"
                  stroke="#CBD5E1"
                  strokeWidth="0.6"
                  opacity="0.3"
                  transform={`rotate(${i * 45} 50 50)`}
                />
              ))}

              {/* Central Silver 8-Point Diamond Star Badge */}
              <g transform="translate(50, 50)">
                <polygon
                  points="0,-22 5,-8 19,-8 9,1 13,15 0,7 -13,15 -9,1 -19,-8 -5,-8"
                  fill="url(#silverRim)"
                  stroke="#1E293B"
                  strokeWidth="1"
                />
                {/* Center Silver Club Crest */}
                <circle cx="0" cy="-3" r="4.5" fill="#FFFFFF" stroke="#334155" strokeWidth="0.8" />
                <circle cx="-4" cy="2" r="4.5" fill="#FFFFFF" stroke="#334155" strokeWidth="0.8" />
                <circle cx="4" cy="2" r="4.5" fill="#FFFFFF" stroke="#334155" strokeWidth="0.8" />
                <path d="M -1.5,3 L -2.5,9 L 2.5,9 L 1.5,3 Z" fill="#FFFFFF" stroke="#334155" strokeWidth="0.8" />
                {/* Tiny Center Brilliant Cut Rhinestone */}
                <polygon points="0,-1 2,0 0,1 -2,0" fill="#0EA5E9" />
              </g>

              {/* Sweeping Mirror Glint Line */}
              <path
                d="M 16,36 C 24,18 36,12 50,12 C 64,12 76,18 84,36 C 72,26 60,20 50,20 C 40,20 28,26 16,36 Z"
                fill="url(#silverRim)"
                opacity="0.4"
              />
            </svg>
            {/* Animated Shimmer Overlay */}
            {showGlint && (
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent anim-silver-shimmer" />
              </div>
            )}
          </div>
        );

      case 'GOLD':
        return (
          <div className="relative inline-flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              width={px}
              height={px}
              className="shrink-0 drop-shadow-[0_2px_8px_rgba(197,160,89,0.5)] select-none"
              aria-label="GOLD RANK EMBLEM"
            >
              <defs>
                {/* 24K Luxury Gold Metallic Rim */}
                <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF4D0" />
                  <stop offset="25%" stopColor="#D4AF37" />
                  <stop offset="50%" stopColor="#FFE082" />
                  <stop offset="75%" stopColor="#996515" />
                  <stop offset="100%" stopColor="#F5D77F" />
                </linearGradient>

                {/* Deep Royal Gold Plate */}
                <radialGradient id="goldPlate" cx="50%" cy="38%" r="52%">
                  <stop offset="0%" stopColor="#7A5813" />
                  <stop offset="55%" stopColor="#3B2A08" />
                  <stop offset="100%" stopColor="#1A1203" />
                </radialGradient>

                <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#FFE082" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#8A5A16" />
                </linearGradient>

                <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#C5A059" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Sunburst Scalloped Outer Edge */}
              <circle cx="50" cy="50" r="47" fill="url(#goldRim)" stroke="#4A3406" strokeWidth="1.8" />

              {/* Casino High-Roller Milling Edge (24 knurls) */}
              {[...Array(24)].map((_, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="4.5"
                  r="1.4"
                  fill="#4D3507"
                  transform={`rotate(${i * 15} 50 50)`}
                />
              ))}

              {/* Inner Golden Bezel Ring */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#FFF4D0" strokeWidth="1.2" />
              <circle cx="50" cy="50" r="37.5" fill="url(#goldPlate)" stroke="#4D3507" strokeWidth="2" filter="url(#goldGlow)" />

              {/* Luxury Geometric Guilloche Lines */}
              <circle cx="50" cy="50" r="31" fill="none" stroke="#F5D77F" strokeWidth="0.7" opacity="0.5" strokeDasharray="4 2" />
              <circle cx="50" cy="50" r="23" fill="none" stroke="#F5D77F" strokeWidth="0.5" opacity="0.3" />

              {/* 4 Gold Diamond Jewels at 90 deg */}
              <polygon points="50,15 52.5,18 50,21 47.5,18" fill="#FFF4D0" stroke="#7A5813" strokeWidth="0.5" />
              <polygon points="85,50 82,52.5 79,50 82,47.5" fill="#FFF4D0" stroke="#7A5813" strokeWidth="0.5" />
              <polygon points="50,85 47.5,82 50,79 52.5,82" fill="#FFF4D0" stroke="#7A5813" strokeWidth="0.5" />
              <polygon points="15,50 18,47.5 21,50 18,52.5" fill="#FFF4D0" stroke="#7A5813" strokeWidth="0.5" />

              {/* VIP Royal Crown Centerpiece */}
              <g transform="translate(50, 48)">
                {/* Crown Backing Aura */}
                <ellipse cx="0" cy="4" rx="19" ry="7" fill="#C5A059" opacity="0.3" />

                {/* Royal Crown Shape */}
                <path
                  d="M -16,8 L -18,-5 L -10,-1 L 0,-14 L 10,-1 L 18,-5 L 16,8 Z"
                  fill="url(#goldCrownGrad)"
                  stroke="#4A3406"
                  strokeWidth="1.5"
                  filter="url(#goldGlow)"
                />

                {/* 5 Crown Jewels (Rubies & Emeralds & Diamond) */}
                <circle cx="-18" cy="-5" r="2.2" fill="#FFFFFF" stroke="#996515" strokeWidth="0.6" />
                <circle cx="-10" cy="-1" r="1.8" fill="#EF4444" stroke="#7F1D1D" strokeWidth="0.5" />
                <circle cx="0" cy="-14" r="3" fill="#FFFFFF" stroke="#B45309" strokeWidth="0.8" />
                <circle cx="10" cy="-1" r="1.8" fill="#EF4444" stroke="#7F1D1D" strokeWidth="0.5" />
                <circle cx="18" cy="-5" r="2.2" fill="#FFFFFF" stroke="#996515" strokeWidth="0.6" />

                {/* Crown Velvet Headband with Gold Studs */}
                <rect x="-16" y="8" width="32" height="5" rx="1.5" fill="#881337" stroke="#4A3406" strokeWidth="1" />
                <circle cx="-10" cy="10.5" r="1.2" fill="#FFE082" />
                <circle cx="-5" cy="10.5" r="1.2" fill="#FFE082" />
                <circle cx="0" cy="10.5" r="1.4" fill="#FFFFFF" />
                <circle cx="5" cy="10.5" r="1.2" fill="#FFE082" />
                <circle cx="10" cy="10.5" r="1.2" fill="#FFE082" />
              </g>

              {/* Highlight Crescent */}
              <path
                d="M 18,34 C 26,16 38,11 50,11 C 62,11 74,16 82,34 C 70,24 58,18 50,18 C 42,18 30,24 18,34 Z"
                fill="url(#goldRim)"
                opacity="0.5"
              />
            </svg>
            {/* Ambient slow rotating gleam */}
            {showGlint && (
              <div className="absolute inset-0 rounded-full pointer-events-none opacity-40 anim-gold-sweep">
                <div className="w-1/2 h-1/2 bg-gradient-to-br from-amber-200/30 to-transparent" />
              </div>
            )}
          </div>
        );

      case 'PLATINUM':
        return (
          <div className="relative inline-flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              width={px}
              height={px}
              className="shrink-0 drop-shadow-[0_2px_10px_rgba(34,211,238,0.45)] select-none"
              aria-label="PLATINUM RANK EMBLEM"
            >
              <defs>
                {/* Platinum Metal Gradient */}
                <linearGradient id="platRim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="25%" stopColor="#67E8F9" />
                  <stop offset="50%" stopColor="#E0F2FE" />
                  <stop offset="75%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#A5F3FC" />
                </linearGradient>

                {/* Deep Cyan/Teal Obsidian Chamber */}
                <radialGradient id="platPlate" cx="50%" cy="35%" r="55%">
                  <stop offset="0%" stopColor="#0E485C" />
                  <stop offset="55%" stopColor="#07232D" />
                  <stop offset="100%" stopColor="#031015" />
                </radialGradient>

                {/* Sapphire/Cyan Gemstone Gradient */}
                <radialGradient id="platGem" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="25%" stopColor="#A5F3FC" />
                  <stop offset="60%" stopColor="#06B6D4" />
                  <stop offset="90%" stopColor="#083344" />
                </radialGradient>

                <filter id="platGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22D3EE" floodOpacity="0.7" />
                </filter>
              </defs>

              {/* Octagonal Stepped Platinum Shield Outline */}
              <polygon
                points="30,3 70,3 97,30 97,70 70,97 30,97 3,70 3,30"
                fill="url(#platRim)"
                stroke="#083344"
                strokeWidth="1.8"
              />

              {/* Platinum Coin Teeth (24 slots) */}
              {[...Array(16)].map((_, i) => (
                <rect
                  key={i}
                  x="48.5"
                  y="5"
                  width="3"
                  height="4"
                  rx="1"
                  fill="#082F49"
                  transform={`rotate(${i * 22.5} 50 50)`}
                />
              ))}

              {/* Inner Round Platinum Bezel */}
              <circle cx="50" cy="50" r="39" fill="url(#platPlate)" stroke="#A5F3FC" strokeWidth="1.5" filter="url(#platGlow)" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="#22D3EE" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.8" />

              {/* Intricate Geometric Sacred Diamond Lattice */}
              <g stroke="#67E8F9" strokeWidth="0.6" fill="none" opacity="0.4">
                <polygon points="50,15 85,50 50,85 15,50" />
                <polygon points="50,22 78,50 50,78 22,50" />
                <polygon points="25,25 75,25 75,75 25,75" />
              </g>

              {/* 4 Platinum Royal Fleurs */}
              <circle cx="50" cy="18" r="2" fill="#E0F2FE" />
              <circle cx="82" cy="50" r="2" fill="#E0F2FE" />
              <circle cx="50" cy="82" r="2" fill="#E0F2FE" />
              <circle cx="18" cy="50" r="2" fill="#E0F2FE" />

              {/* Central Cushion-Cut Cyan Gemstone in Platinum Claws */}
              <g transform="translate(50, 50)">
                {/* 4 Platinum Prongs */}
                <rect x="-14" y="-14" width="28" height="28" rx="7" fill="#0C4A6E" stroke="#E0F2FE" strokeWidth="1" />
                <circle cx="-11" cy="-11" r="1.8" fill="#FFFFFF" />
                <circle cx="11" cy="-11" r="1.8" fill="#FFFFFF" />
                <circle cx="-11" cy="11" r="1.8" fill="#FFFFFF" />
                <circle cx="11" cy="11" r="1.8" fill="#FFFFFF" />

                {/* The Faceted Sapphire/Cyan Gem */}
                <polygon
                  points="0,-12 9,-9 12,0 9,9 0,12 -9,9 -12,0 -9,-9"
                  fill="url(#platGem)"
                  stroke="#E0F2FE"
                  strokeWidth="1.2"
                />

                {/* Specular Facet Highlights */}
                <polygon points="0,-12 4,-4 0,0 -4,-4" fill="#FFFFFF" opacity="0.75" />
                <polygon points="12,0 4,-4 0,0 4,4" fill="#67E8F9" opacity="0.6" />
                <polygon points="0,12 4,4 0,0 -4,4" fill="#0891B2" opacity="0.7" />
                <polygon points="-12,0 -4,-4 0,0 -4,4" fill="#A5F3FC" opacity="0.6" />
                <circle cx="-2.5" cy="-2.5" r="1.8" fill="#FFFFFF" />
              </g>

              {/* Top Glass Arch Reflection */}
              <path
                d="M 20,32 C 28,16 40,12 50,12 C 60,12 72,16 80,32 C 70,22 58,17 50,17 C 42,17 30,22 20,32 Z"
                fill="#FFFFFF"
                opacity="0.45"
              />
            </svg>
            {/* Elegant Aura Pulse */}
            {showGlint && (
              <div className="absolute inset-0 rounded-full pointer-events-none anim-platinum-pulse" />
            )}
          </div>
        );

      case 'DIAMOND':
        return (
          <div className="relative inline-flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              width={px}
              height={px}
              className="shrink-0 drop-shadow-[0_2px_14px_rgba(192,132,252,0.6)] select-none"
              aria-label="DIAMOND RANK EMBLEM"
            >
              <defs>
                {/* Diamond Brilliant Platinum Bezel */}
                <linearGradient id="diaRim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="20%" stopColor="#C084FC" />
                  <stop offset="45%" stopColor="#F5D0FE" />
                  <stop offset="70%" stopColor="#7E22CE" />
                  <stop offset="100%" stopColor="#E9D5FF" />
                </linearGradient>

                {/* Deep Royal Midnight Purple Chamber */}
                <radialGradient id="diaPlate" cx="50%" cy="30%" r="60%">
                  <stop offset="0%" stopColor="#3B185F" />
                  <stop offset="50%" stopColor="#1C0933" />
                  <stop offset="100%" stopColor="#0B0214" />
                </radialGradient>

                {/* Diamond Prismatic Facet Gradients */}
                <linearGradient id="diaTable" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="40%" stopColor="#E0F2FE" />
                  <stop offset="70%" stopColor="#F5D0FE" />
                  <stop offset="100%" stopColor="#BAE6FD" />
                </linearGradient>

                <linearGradient id="diaPavilion" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="60%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#1E1B4B" />
                </linearGradient>

                <filter id="diaSparkleGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#E879F9" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* 16-Point Ornate Diamond Sunburst Perimeter */}
              <polygon
                points="50,1 55,8 64,4 66,13 76,11 75,20 86,22 82,31 92,36 86,44 94,51 86,58 92,66 82,71 86,80 75,82 76,91 66,89 64,98 55,94 50,101 45,94 36,98 34,89 24,91 25,82 14,80 18,71 8,66 14,58 6,51 14,44 8,36 18,31 14,22 25,20 24,11 34,13 36,4 45,8"
                fill="url(#diaRim)"
                stroke="#1E0A38"
                strokeWidth="1.2"
              />

              {/* Inner Inset Midnight Disc */}
              <circle cx="50" cy="50" r="38" fill="url(#diaPlate)" stroke="#F5D0FE" strokeWidth="1.5" filter="url(#diaSparkleGlow)" />

              {/* 8 Inset Brilliant Micro-Diamonds */}
              {[...Array(8)].map((_, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="17"
                  r="2"
                  fill="#FFFFFF"
                  stroke="#A855F7"
                  strokeWidth="0.8"
                  transform={`rotate(${i * 45} 50 50)`}
                />
              ))}

              {/* Central Giant Multi-Faceted Brilliant DIAMOND */}
              <g transform="translate(50, 50)">
                {/* Diamond Outer Shimmer Aura */}
                <circle cx="0" cy="0" r="21" fill="none" stroke="#E879F9" strokeWidth="0.75" opacity="0.4" strokeDasharray="3 2" />

                {/* Upper Crown (Trapezoid) */}
                <polygon
                  points="-17,-6 -10,-17 10,-17 17,-6"
                  fill="url(#diaTable)"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />

                {/* Lower Pavilion (Cone / Inverted Triangle) */}
                <polygon
                  points="-17,-6 17,-6 0,19"
                  fill="url(#diaPavilion)"
                  stroke="#C084FC"
                  strokeWidth="1.2"
                />

                {/* Individual Facet Lines and Specular Cuts */}
                {/* Crown Facets */}
                <polygon points="-10,-17 0,-17 -4,-6" fill="#FFFFFF" opacity="0.85" />
                <polygon points="0,-17 10,-17 4,-6" fill="#E0F2FE" opacity="0.75" />
                <polygon points="-10,-17 -4,-6 -17,-6" fill="#BAE6FD" opacity="0.7" />
                <polygon points="10,-17 4,-6 17,-6" fill="#DDD6FE" opacity="0.7" />

                {/* Pavilion Facets */}
                <polygon points="-17,-6 -7,-6 0,19" fill="#818CF8" opacity="0.65" />
                <polygon points="-7,-6 0,-6 0,19" fill="#38BDF8" opacity="0.8" />
                <polygon points="0,-6 7,-6 0,19" fill="#67E8F9" opacity="0.85" />
                <polygon points="7,-6 17,-6 0,19" fill="#C084FC" opacity="0.7" />

                {/* Diamond Center Blinding Specular Flash */}
                <circle cx="0" cy="-6" r="2" fill="#FFFFFF" />
              </g>

              {/* Top Shimmer Flare Star (4-point star) */}
              <g transform="translate(68, 28)">
                <polygon
                  points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2"
                  fill="#FFFFFF"
                  filter="url(#diaSparkleGlow)"
                  className="anim-diamond-glint"
                />
              </g>
            </svg>
            {/* Occasional Sparkle Animation */}
            {showGlint && (
              <div className="absolute top-1 right-1 w-3.5 h-3.5 pointer-events-none anim-diamond-glint">
                <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-current drop-shadow-[0_0_6px_#fff]">
                  <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
                </svg>
              </div>
            )}
          </div>
        );

      case 'BLACK':
      default:
        return (
          <div className="relative inline-flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              width={px}
              height={px}
              className="shrink-0 drop-shadow-[0_2px_16px_rgba(255,45,85,0.7)] select-none anim-black-neon"
              aria-label="BLACK SUPREME RANK EMBLEM"
            >
              <defs>
                {/* Obsidian Metallic Black Edge */}
                <linearGradient id="blackObsidian" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2A2A2A" />
                  <stop offset="25%" stopColor="#080808" />
                  <stop offset="50%" stopColor="#1C1C1C" />
                  <stop offset="75%" stopColor="#030303" />
                  <stop offset="100%" stopColor="#222222" />
                </linearGradient>

                {/* Crimson Neon Flare */}
                <linearGradient id="crimsonNeon" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF0033" />
                  <stop offset="50%" stopColor="#FF2D55" />
                  <stop offset="100%" stopColor="#990022" />
                </linearGradient>

                {/* Imperial Gold Trim */}
                <linearGradient id="blackGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFE082" />
                  <stop offset="50%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#8A5A16" />
                </linearGradient>

                {/* Deep Void Chamber */}
                <radialGradient id="voidCore" cx="50%" cy="40%" r="58%">
                  <stop offset="0%" stopColor="#1E070B" />
                  <stop offset="45%" stopColor="#0C0305" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>

                <filter id="neonRedGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#FF2D55" floodOpacity="0.9" />
                </filter>
              </defs>

              {/* Heavy Black Casino Chip Perimeter */}
              <circle cx="50" cy="50" r="47.5" fill="url(#blackObsidian)" stroke="#D4AF37" strokeWidth="1.8" />

              {/* 12 Inlaid Crimson Neon Inserts (Casino High-Roller Ceramic Chip Blocks) */}
              {[...Array(12)].map((_, i) => (
                <path
                  key={i}
                  d="M 46.5,2.5 L 53.5,2.5 L 52.5,9.5 L 47.5,9.5 Z"
                  fill="url(#crimsonNeon)"
                  stroke="#FF2D55"
                  strokeWidth="0.5"
                  filter="url(#neonRedGlow)"
                  transform={`rotate(${i * 30} 50 50)`}
                />
              ))}

              {/* Gold Filigree Ring */}
              <circle cx="50" cy="50" r="39.5" fill="none" stroke="url(#blackGold)" strokeWidth="1.4" />
              <circle cx="50" cy="50" r="37.5" fill="none" stroke="#FF2D55" strokeWidth="0.8" opacity="0.8" />

              {/* Central Deep Obsidian Void Plate */}
              <circle cx="50" cy="50" r="36" fill="url(#voidCore)" stroke="#000000" strokeWidth="2" />

              {/* 4 Golden Suits at Cardinal Points */}
              <text x="50" y="21" fontSize="6.5" fill="#FFE082" textAnchor="middle" fontFamily="serif">♠</text>
              <text x="79" y="52" fontSize="6.5" fill="#FFE082" textAnchor="middle" fontFamily="serif">♦</text>
              <text x="50" y="84" fontSize="6.5" fill="#FFE082" textAnchor="middle" fontFamily="serif">♣</text>
              <text x="21" y="52" fontSize="6.5" fill="#FFE082" textAnchor="middle" fontFamily="serif">♥</text>

              {/* Central Sovereign BLACK CROWN & Crimson Gem Core */}
              <g transform="translate(50, 49)">
                {/* Crimson Neon Aura Beneath Crown */}
                <ellipse cx="0" cy="2" rx="19" ry="8" fill="#FF2D55" opacity="0.3" filter="url(#neonRedGlow)" />

                {/* Sovereign Golden Imperial Crown */}
                <path
                  d="M -18,7 L -20,-7 L -11,-1 L 0,-16 L 11,-1 L 20,-7 L 18,7 Z"
                  fill="url(#blackGold)"
                  stroke="#1A1203"
                  strokeWidth="1.4"
                />

                {/* 5 Crimson Jewels on Crown Peaks */}
                <circle cx="-20" cy="-7" r="2.2" fill="#FF2D55" stroke="#FFE082" strokeWidth="0.7" />
                <circle cx="-11" cy="-1" r="1.8" fill="#FF0033" stroke="#FFE082" strokeWidth="0.5" />
                <circle cx="0" cy="-16" r="3.2" fill="#FFFFFF" stroke="#FF2D55" strokeWidth="1" filter="url(#neonRedGlow)" />
                <circle cx="11" cy="-1" r="1.8" fill="#FF0033" stroke="#FFE082" strokeWidth="0.5" />
                <circle cx="20" cy="-7" r="2.2" fill="#FF2D55" stroke="#FFE082" strokeWidth="0.7" />

                {/* Crown Headband in Black Titanium with Red Neon Strip */}
                <rect x="-17" y="7" width="34" height="5.5" rx="1.5" fill="#0A0A0A" stroke="#D4AF37" strokeWidth="1" />
                <line x1="-15" y1="9.75" x2="15" y2="9.75" stroke="#FF2D55" strokeWidth="1.8" strokeLinecap="round" filter="url(#neonRedGlow)" />

                {/* Center Blood Ruby / Black Diamond Core Pendant */}
                <polygon
                  points="0,3 5.5,10 0,17 -5.5,10"
                  fill="#FF0033"
                  stroke="#FFE082"
                  strokeWidth="0.8"
                  filter="url(#neonRedGlow)"
                />
                <circle cx="0" cy="10" r="1.2" fill="#FFFFFF" />
              </g>

              {/* Top Glass Bevel Glint */}
              <path
                d="M 18,34 C 26,16 38,11 50,11 C 62,11 74,16 82,34 C 70,23 58,17 50,17 C 42,17 30,23 18,34 Z"
                fill="#FFFFFF"
                opacity="0.25"
              />
            </svg>

            {/* Subtle Crimson Breathing Aura */}
            {showGlint && (
              <div className="absolute inset-0 rounded-full pointer-events-none ring-1 ring-[#FF2D55]/50 anim-black-neon" />
            )}
          </div>
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      title={`${activeTier} VIP RANK EMBLEM`}
    >
      {renderEmblem()}
    </div>
  );
};
