import Sidebar from "../components/Sidebar.js";
import "./globals.css";

export const metadata = {
  title: "Spending — Expense Viewer",
  description: "A private, read-only view of household spending",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="workspace">{children}</main>
        </div>
      </body>
    </html>
  );
}
