import Sidebar from "../components/Sidebar.js";
import MobileBackToTop from "../components/MobileBackToTop.js";
import MobileViewportAnimator from "../components/MobileViewportAnimator.js";
import "./globals.css";

export const metadata = {
  title: "Expense Viewer",
  description: "Read-only expense dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div data-top-sentinel aria-hidden="true" />
        <MobileViewportAnimator />
        <MobileBackToTop />
        <div className="app-shell">
          <Sidebar />
          <main className="workspace">{children}</main>
        </div>
      </body>
    </html>
  );
}
