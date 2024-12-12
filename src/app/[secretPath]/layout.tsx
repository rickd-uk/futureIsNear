// src/app/[secretPath]/layout.tsx

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No auth check needed - just render children
  return <>{children}</>;
}
