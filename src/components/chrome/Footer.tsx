export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="px-6 md:px-10 py-6 flex items-center justify-between text-overline text-mute">
      <span>© {year} — built by Timeless Studio</span>
      <span className="hidden md:inline">runs locally · no upload</span>
    </footer>
  );
}
