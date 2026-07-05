import Sidebar from "../components/Sidebar.js";
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
        <MobileViewportAnimator />
        <div className="app-shell">
          <Sidebar />
          <main className="workspace">{children}</main>
        </div>
      </body>
    </html>
  );
}
