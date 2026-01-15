export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Автобус (основа) */}
      <rect
        x="12"
        y="42"
        width="76"
        height="38"
        rx="5"
        fill="url(#busGradient)"
        stroke="url(#busStroke)"
        strokeWidth="2.5"
      />
      
      {/* Верхняя часть автобуса (как палуба корабля) */}
      <rect
        x="12"
        y="42"
        width="76"
        height="8"
        rx="5"
        fill="url(#deckGradient)"
        opacity="0.8"
      />
      
      {/* Окна автобуса */}
      <rect x="18" y="52" width="14" height="14" rx="2" fill="url(#windowGradient)" />
      <rect x="35" y="52" width="14" height="14" rx="2" fill="url(#windowGradient)" />
      <rect x="52" y="52" width="14" height="14" rx="2" fill="url(#windowGradient)" />
      <rect x="69" y="52" width="14" height="14" rx="2" fill="url(#windowGradient)" />
      
      {/* Дверь автобуса */}
      <rect x="42" y="58" width="16" height="20" rx="2" fill="url(#doorGradient)" stroke="url(#doorStroke)" strokeWidth="1.5" />
      <line x1="50" y1="58" x2="50" y2="78" stroke="url(#doorStroke)" strokeWidth="1.5" />
      
      {/* Колеса */}
      <circle cx="28" cy="85" r="9" fill="#0a0a0a" stroke="url(#wheelStroke)" strokeWidth="2.5" />
      <circle cx="28" cy="85" r="5" fill="url(#wheelInner)" />
      <circle cx="72" cy="85" r="9" fill="#0a0a0a" stroke="url(#wheelStroke)" strokeWidth="2.5" />
      <circle cx="72" cy="85" r="5" fill="url(#wheelInner)" />
      
      {/* Пиратский флаг (череп и кости) */}
      <g transform="translate(78, 15)">
        {/* Флагшток */}
        <line x1="0" y1="0" x2="0" y2="22" stroke="url(#flagpoleStroke)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Флаг */}
        <path
          d="M 0 0 L 18 6 L 0 12 Z"
          fill="url(#flagGradient)"
          stroke="url(#flagStroke)"
          strokeWidth="2"
        />
        {/* Череп */}
        <circle cx="6" cy="4.5" r="3" fill="url(#skullGradient)" />
        <ellipse cx="5" cy="5" rx="1" ry="1.2" fill="#0a0a0a" />
        <ellipse cx="7" cy="5" rx="1" ry="1.2" fill="#0a0a0a" />
        {/* Улыбка */}
        <path d="M 4.5 6.5 Q 6 7.5 7.5 6.5" stroke="#0a0a0a" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Кости (крест) */}
        <rect x="4.5" y="7.5" width="3" height="2" rx="0.5" fill="url(#boneGradient)" />
        <rect x="2.5" y="8.5" width="2" height="3.5" rx="0.5" fill="url(#boneGradient)" />
        <rect x="7.5" y="8.5" width="2" height="3.5" rx="0.5" fill="url(#boneGradient)" />
      </g>
      
      {/* Пиратская шляпа на автобусе (как паруса) */}
      <path
        d="M 15 42 Q 50 25 85 42"
        stroke="url(#hatStroke)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="50" cy="28" r="5" fill="url(#hatGradient)" />
      
      {/* Пиратские пушки (каноны) по бокам */}
      <g transform="translate(8, 58)">
        {/* Левая пушка */}
        <rect x="0" y="0" width="6" height="4" rx="1" fill="url(#cannonGradient)" stroke="url(#cannonStroke)" strokeWidth="1" />
        <circle cx="3" cy="2" r="1.5" fill="#0a0a0a" />
        <line x1="6" y1="2" x2="8" y2="2" stroke="url(#cannonStroke)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <g transform="translate(86, 58)">
        {/* Правая пушка */}
        <rect x="0" y="0" width="6" height="4" rx="1" fill="url(#cannonGradient)" stroke="url(#cannonStroke)" strokeWidth="1" />
        <circle cx="3" cy="2" r="1.5" fill="#0a0a0a" />
        <line x1="0" y1="2" x2="-2" y2="2" stroke="url(#cannonStroke)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      
      {/* Пиратские шпаги/сабли */}
      <g transform="translate(30, 45)">
        {/* Левая шпага */}
        <path d="M 0 0 L 2 8 L 0 10 L -2 8 Z" fill="url(#swordGradient)" stroke="url(#swordStroke)" strokeWidth="0.5" />
        <line x1="0" y1="10" x2="0" y2="18" stroke="url(#swordHandle)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="0" cy="18" r="1.5" fill="url(#swordHandle)" />
      </g>
      <g transform="translate(70, 45)">
        {/* Правая шпага */}
        <path d="M 0 0 L 2 8 L 0 10 L -2 8 Z" fill="url(#swordGradient)" stroke="url(#swordStroke)" strokeWidth="0.5" />
        <line x1="0" y1="10" x2="0" y2="18" stroke="url(#swordHandle)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="0" cy="18" r="1.5" fill="url(#swordHandle)" />
      </g>
      
      {/* Пиратская повязка на глазу (на окне) */}
      <g transform="translate(35, 52)">
        <circle cx="7" cy="7" r="6" fill="url(#eyePatchGradient)" stroke="url(#eyePatchStroke)" strokeWidth="1.5" />
        <line x1="2" y1="7" x2="12" y2="7" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
        <line x1="7" y1="2" x2="7" y2="12" stroke="#0a0a0a" strokeWidth="1" strokeLinecap="round" />
      </g>
      
      {/* Пиратский попугай на крыше */}
      <g transform="translate(60, 30)">
        {/* Тело попугая */}
        <ellipse cx="0" cy="0" rx="4" ry="5" fill="url(#parrotGradient)" />
        {/* Крыло */}
        <ellipse cx="-2" cy="1" rx="2" ry="3" fill="url(#parrotWingGradient)" />
        {/* Голова */}
        <circle cx="0" cy="-3" r="2.5" fill="url(#parrotHeadGradient)" />
        {/* Клюв */}
        <path d="M 2 -3 L 4 -2 L 2 -1 Z" fill="url(#parrotBeakGradient)" />
        {/* Хвост */}
        <path d="M 0 5 L 3 8 L 0 7 Z" fill="url(#parrotTailGradient)" />
      </g>
      
      {/* Пиратский сундук с сокровищами */}
      <g transform="translate(75, 60)">
        {/* Сундук */}
        <rect x="0" y="0" width="8" height="6" rx="1" fill="url(#chestGradient)" stroke="url(#chestStroke)" strokeWidth="1" />
        <line x1="0" y1="2" x2="8" y2="2" stroke="url(#chestStroke)" strokeWidth="1" />
        {/* Замок */}
        <circle cx="4" cy="1" r="1" fill="url(#lockGradient)" />
        {/* Сокровища (монеты) */}
        <circle cx="2" cy="4" r="0.8" fill="url(#coinGradient)" />
        <circle cx="6" cy="4" r="0.8" fill="url(#coinGradient)" />
        <circle cx="4" cy="5" r="0.8" fill="url(#coinGradient)" />
      </g>
      
      {/* Якорь на боку автобуса */}
      <g transform="translate(20, 55)">
        <path
          d="M 0 0 L 0 8 M -2 8 L 2 8 M 0 8 L -3 12 M 0 8 L 3 12"
          stroke="url(#anchorStroke)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="0" cy="0" r="1.5" fill="url(#anchorStroke)" />
      </g>
      
      {/* Пиратские рейлинги/перила на палубе */}
      <g>
        <line x1="15" y1="45" x2="15" y2="50" stroke="url(#railingStroke)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="25" y1="45" x2="25" y2="50" stroke="url(#railingStroke)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="75" y1="45" x2="75" y2="50" stroke="url(#railingStroke)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="85" y1="45" x2="85" y2="50" stroke="url(#railingStroke)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="15" y1="48" x2="25" y2="48" stroke="url(#railingStroke)" strokeWidth="1" />
        <line x1="75" y1="48" x2="85" y2="48" stroke="url(#railingStroke)" strokeWidth="1" />
      </g>
      
      {/* Пиратский череп на передней части */}
      <g transform="translate(12, 52)">
        <circle cx="3" cy="3" r="2.5" fill="url(#skullGradient)" />
        <ellipse cx="2.2" cy="3" rx="0.6" ry="0.8" fill="#0a0a0a" />
        <ellipse cx="3.8" cy="3" rx="0.6" ry="0.8" fill="#0a0a0a" />
        <path d="M 1.5 4 Q 3 4.8 4.5 4" stroke="#0a0a0a" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </g>
      
      {/* Градиенты */}
      <defs>
        <linearGradient id="busGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="busStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="deckGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="doorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="doorStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="wheelStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="wheelInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="flagpoleStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="flagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <linearGradient id="flagStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="skullGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="boneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="hatStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="hatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="anchorStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="cannonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="cannonStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="swordGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="swordStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="swordHandle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="eyePatchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="eyePatchStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="parrotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="parrotWingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="parrotHeadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="parrotBeakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="parrotTailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="chestGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="chestStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="railingStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
