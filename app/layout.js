import Sidebar from "../components/Sidebar.js";
import DeskDetails from "../components/DeskDetails.js";
import "./globals.css";
import "./momentum.css";
import "./select.css";
import { themeInitScript } from "../lib/theme.js";

export const metadata = {
  title: "Spending — Expense Viewer",
  description: "A private, read-only view of household spending",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="momentum" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body>
        <div className="app-shell">
          <DeskDetails />
          <Sidebar />
          <main className="workspace">{children}</main>
        </div>
      </body>
    </html>
  );
}
