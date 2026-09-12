export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-sm font-semibold text-white">
            E
          </div>
          <span className="text-base font-semibold text-ink-900">Email Platform</span>
        </div>
        {children}
      </div>
    </div>
  );
}
