import { Link } from "@tanstack/react-router";
import logoHorizontal from "@/assets/logo-horizontal.png";
import logoIcon from "@/assets/logo-icon.png";

export type BrandLogoProps = {
  variant?: "horizontal" | "icon";
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  className?: string;
  linkTo?: string;
};

const SIZE_CLASSES = {
  horizontal: { sm: "w-[160px] h-auto", md: "w-[184px] h-auto", lg: "w-[220px] h-auto" },
  icon: { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-10 w-10" },
} as const;

export default function BrandLogo({
  variant = "horizontal",
  size = "md",
  tone = "light",
  className = "",
  linkTo,
}: BrandLogoProps) {
  const src = variant === "horizontal" ? logoHorizontal : logoIcon;
  const image =
    tone === "dark" && variant === "horizontal" ? (
      <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
        <img
          src={logoIcon}
          alt=""
          aria-hidden="true"
          className={`block shrink-0 object-contain ${SIZE_CLASSES.icon[size]}`}
        />
        <span
          className={`font-sans font-extrabold tracking-[-0.055em] text-white ${
            size === "sm" ? "text-[1.05rem]" : size === "md" ? "text-[1.25rem]" : "text-[1.55rem]"
          }`}
        >
          OneCite
        </span>
      </span>
    ) : (
      <img
        src={src}
        alt="OneCite"
        className={`block shrink-0 object-contain ${SIZE_CLASSES[variant][size]} ${className}`.trim()}
      />
    );

  if (!linkTo) return image;

  return (
    <Link to={linkTo} aria-label="OneCite ana sayfa" className="inline-flex shrink-0">
      {image}
    </Link>
  );
}
