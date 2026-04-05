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
    <div>
      <p className="label-text">{eyebrow}</p>
      <h2 className="mt-2">{title}</h2>
      {description ? <p className="mt-1">{description}</p> : null}
    </div>
  );
}
