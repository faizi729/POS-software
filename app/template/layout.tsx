export default function TemplatePreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "#000" }}>
      {children}
    </div>
  );
}
