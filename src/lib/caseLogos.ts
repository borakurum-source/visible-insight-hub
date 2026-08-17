/** Vaka galerisinde kullanilan marka logolari (slug -> CDN url). */
import filmfolk from "@/assets/logos/filmfolk.png.asset.json";
import veniceSwap from "@/assets/logos/venice-swap.png.asset.json";
import maslife from "@/assets/logos/maslife.png.asset.json";
import voicecrafters from "@/assets/logos/voicecrafters.png.asset.json";

export const CASE_LOGOS: Record<string, string> = {
  filmfolk: filmfolk.url,
  "venice-swap": veniceSwap.url,
  maslife: maslife.url,
  voicecrafters: voicecrafters.url,
};
