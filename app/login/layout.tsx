// Standalone layout for the login page — overrides the root layout so no
// sidebar or top navbar are shown on the sign-in screen.
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
