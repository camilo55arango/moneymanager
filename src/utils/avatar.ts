const DICEBEAR_URL = 'https://api.dicebear.com/7.x/avataaars/svg';
// Lila claro de la paleta (#ead9fd), sin "#" como lo pide DiceBear
const AVATAR_BACKGROUND = 'ead9fd';

export const dicebearAvatar = (seed: string) =>
  `${DICEBEAR_URL}?seed=${encodeURIComponent(seed)}&backgroundColor=${AVATAR_BACKGROUND}`;

// URL para mostrar un avatar: a los de DiceBear guardados antes sin color de fondo se les añade
// el de la paleta; las fotos subidas por el usuario se dejan igual
export const avatarSrc = (url?: string | null, fallbackSeed = 'MoneyManagerUser') => {
  if (!url) return dicebearAvatar(fallbackSeed);
  if (url.startsWith(DICEBEAR_URL) && !url.includes('backgroundColor=')) {
    return `${url}&backgroundColor=${AVATAR_BACKGROUND}`;
  }
  return url;
};
