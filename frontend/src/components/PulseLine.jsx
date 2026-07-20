export default function PulseLine({ className = "", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 20 H140 L155 20 L165 4 L178 36 L188 20 L200 20 L212 8 L222 32 L234 20 H400"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
