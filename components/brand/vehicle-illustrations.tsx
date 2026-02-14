import { type VehicleType } from "@prisma/client";

type IllustrationProps = {
  className?: string;
};

const shadowStyle = { filter: "drop-shadow(0px 8px 10px rgba(103, 78, 201, 0.22))" };

export function SwiftIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Swift pickup truck"
    >
      <g style={shadowStyle}>
        <rect x="18" y="68" width="160" height="36" rx="12" fill="#7C3AED" />
        <rect x="94" y="44" width="70" height="30" rx="10" fill="#8B5CF6" />
        <rect x="27" y="60" width="58" height="18" rx="8" fill="#A78BFA" />
        <rect x="106" y="52" width="24" height="14" rx="4" fill="#EEF2FF" />
        <rect x="136" y="52" width="20" height="14" rx="4" fill="#DDD6FE" />
        <circle cx="58" cy="108" r="16" fill="#1F2937" />
        <circle cx="58" cy="108" r="8" fill="#CBD5E1" />
        <circle cx="152" cy="108" r="16" fill="#1F2937" />
        <circle cx="152" cy="108" r="8" fill="#CBD5E1" />
      </g>
      <line x1="24" y1="24" x2="182" y2="24" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 4" />
      <text x="103" y="18" textAnchor="middle" fontSize="11" fill="#4F46E5">
        6.5 ft bed
      </text>
      <text x="188" y="86" fontSize="11" fill="#6D28D9">
        H: 4.8 ft
      </text>
    </svg>
  );
}

export function FlexIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Flex cargo van"
    >
      <g style={shadowStyle}>
        <rect x="20" y="52" width="182" height="52" rx="16" fill="#6D28D9" />
        <rect x="34" y="60" width="80" height="30" rx="8" fill="#A78BFA" />
        <rect x="120" y="62" width="32" height="26" rx="5" fill="#EDE9FE" />
        <rect x="156" y="62" width="36" height="26" rx="5" fill="#DDD6FE" />
        <circle cx="66" cy="108" r="16" fill="#1F2937" />
        <circle cx="66" cy="108" r="8" fill="#CBD5E1" />
        <circle cx="166" cy="108" r="16" fill="#1F2937" />
        <circle cx="166" cy="108" r="8" fill="#CBD5E1" />
      </g>
      <line x1="20" y1="24" x2="204" y2="24" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 4" />
      <text x="112" y="18" textAnchor="middle" fontSize="11" fill="#4F46E5">
        10 ft cargo
      </text>
      <text x="206" y="74" fontSize="11" fill="#6D28D9">
        H: 5.6 ft
      </text>
    </svg>
  );
}

export function ElevateIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Elevate high roof van"
    >
      <g style={shadowStyle}>
        <rect x="18" y="42" width="188" height="62" rx="16" fill="#5B21B6" />
        <rect x="32" y="56" width="86" height="34" rx="8" fill="#8B5CF6" />
        <rect x="126" y="58" width="34" height="28" rx="5" fill="#F5F3FF" />
        <rect x="165" y="58" width="30" height="28" rx="5" fill="#DDD6FE" />
        <circle cx="68" cy="108" r="16" fill="#1F2937" />
        <circle cx="68" cy="108" r="8" fill="#CBD5E1" />
        <circle cx="170" cy="108" r="16" fill="#1F2937" />
        <circle cx="170" cy="108" r="8" fill="#CBD5E1" />
      </g>
      <line x1="18" y1="20" x2="206" y2="20" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 4" />
      <text x="112" y="14" textAnchor="middle" fontSize="11" fill="#4F46E5">
        11.5 ft cargo
      </text>
      <text x="210" y="68" fontSize="11" fill="#6D28D9">
        H: 6.9 ft
      </text>
    </svg>
  );
}

export function TitanIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Titan box truck"
    >
      <g style={shadowStyle}>
        <rect x="16" y="38" width="124" height="64" rx="12" fill="#4C1D95" />
        <rect x="140" y="58" width="72" height="44" rx="10" fill="#7C3AED" />
        <rect x="152" y="66" width="24" height="18" rx="4" fill="#F5F3FF" />
        <rect x="180" y="66" width="24" height="18" rx="4" fill="#DDD6FE" />
        <circle cx="56" cy="108" r="16" fill="#1F2937" />
        <circle cx="56" cy="108" r="8" fill="#CBD5E1" />
        <circle cx="174" cy="108" r="16" fill="#1F2937" />
        <circle cx="174" cy="108" r="8" fill="#CBD5E1" />
      </g>
      <line x1="14" y1="20" x2="210" y2="20" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 4" />
      <text x="110" y="14" textAnchor="middle" fontSize="11" fill="#4F46E5">
        16 ft box
      </text>
      <text x="214" y="70" fontSize="11" fill="#6D28D9">
        H: 7.5 ft
      </text>
    </svg>
  );
}

export function VehicleIllustration({
  vehicleType,
  className,
}: {
  vehicleType: VehicleType;
  className?: string;
}) {
  if (vehicleType === "SWIFT") return <SwiftIllustration className={className} />;
  if (vehicleType === "FLEX") return <FlexIllustration className={className} />;
  if (vehicleType === "ELEVATE") return <ElevateIllustration className={className} />;
  return <TitanIllustration className={className} />;
}
