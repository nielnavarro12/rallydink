import Typography from './components/Typography';

export default function Footer({ siteName = "POS" }) {
  return (
    <footer className="w-full bg-gradient-to-b from-[#112850] to-[#0A1931] border-t border-[#051630] py-4 px-3 text-center text-gray-300">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center justify-center gap-1 text-center">
        <Typography
          variant="body2"
          className="font-sans text-sm font-medium tracking-wide text-gray-200"
          align="center"
        >
          {siteName}
        </Typography>

        <Typography
          variant="caption"
          className="font-sans text-xs text-gray-400"
          align="center"
        >
          Drive N Dink &copy; 2026
        </Typography>
      </div>
    </footer>
  );
}