export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="label-text">{eyebrow}</p>
      <h2 className="mt-2 text-balance text-lg font-bold leading-snug tracking-[-0.02em] text-text-primary sm:text-xl sm:leading-snug md:text-2xl md:leading-tight lg:text-3xl lg:leading-[1.15]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-pretty text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
          {description}
        </p>
      ) : null}
    </div>
  );
}
