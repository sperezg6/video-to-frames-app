type Props = {
  onBack?: () => void;
};

export function TopNav({ onBack }: Props) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-5 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="group text-overline text-mute hover:text-ink transition-colors duration-150"
            aria-label="Back to home"
          >
            <span className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-[6px]">
              ←
            </span>{" "}
            Back
          </button>
        ) : null}
        <span className="text-display text-[14px] tracking-[0.18em]">FRAMES</span>
      </div>
    </nav>
  );
}
