export default function AppShell({
  children,
  stickyHeader,
}: {
  children: React.ReactNode;
  stickyHeader?: React.ReactNode;
}) {
  return (
    <>
      {stickyHeader && (
        <div className="sticky top-0 z-30 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
          <div className="max-w-5xl mx-auto px-4">
            {stickyHeader}
          </div>
        </div>
      )}
      <main className="max-w-5xl mx-auto px-4 py-4">{children}</main>
    </>
  );
}
