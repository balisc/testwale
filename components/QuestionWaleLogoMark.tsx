type QuestionWaleLogoMarkProps = {
  className?: string;
  size?: number;
  title?: string;
};

/**
 * Favicon-identical QuestionWale mark SVG (`/logo/questionwale-mark.svg`).
 * Used in navbar + footer so the brand mark always matches the tab icon.
 */
export default function QuestionWaleLogoMark({
  className = '',
  size = 36,
  title = 'QuestionWale',
}: QuestionWaleLogoMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/questionwale-mark.svg"
      alt={title}
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      decoding="async"
    />
  );
}
