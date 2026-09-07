import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { ToastContainer } from '../components/common/Toast';
import { PageTransition } from '../components/common/PageTransition';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-ink-50 transition-colors duration-200 ease-premium dark:bg-ink-950">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl">
            <PageTransition />
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
