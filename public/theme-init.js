(() => {
  const savedTheme = localStorage.getItem("theme") || "system";
  const dark = savedTheme === "dark"
    || (savedTheme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute("content", dark ? "#04141a" : "#0b3d4a");

  const language = localStorage.getItem("shonjibon.lang");
  if (language === "bn" || language === "en") document.documentElement.lang = language;
})();
