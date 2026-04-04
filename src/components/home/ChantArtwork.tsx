import OmSymbol from '../OmSymbol';
import { getChantTheme } from '../../lib/chantThemes';
import type { Chant } from '../../types';

interface ChantArtworkProps {
  chant: Chant;
  className?: string;
  omSize?: number;
}

function ChantArtwork({ chant, className = '', omSize = 40 }: ChantArtworkProps) {
  const theme = getChantTheme(chant);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: theme.bg }}>
      {chant.background_image_url ? (
        <img
          src={chant.background_image_url}
          alt={chant.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <OmSymbol size={omSize} className="text-white opacity-[0.12]" />
        </div>
      )}
    </div>
  );
}

export default ChantArtwork;
