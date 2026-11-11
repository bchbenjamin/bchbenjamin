export function WaveDivider() {
  return (
    <div aria-hidden className="pointer-events-none py-6">
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="h-[60px] w-full"
        focusable="false"
      >
        <path
          d="M0 30 C 180 6, 360 54, 540 30 S 900 6, 1080 30 S 1350 54, 1440 30"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
