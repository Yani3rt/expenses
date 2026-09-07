export const THEME_STORAGE_KEY = "expense-viewer-theme";
export function normalizeTheme(value) {
  return value === "classic" ? "classic" : "momentum";
}

// Run before paint; no server-side access to browser preferences or data APIs.
export const themeInitScript = `(()=>{try{document.documentElement.dataset.theme=localStorage.getItem("${THEME_STORAGE_KEY}")==="classic"?"classic":"momentum"}catch{document.documentElement.dataset.theme="momentum"}})()`;
