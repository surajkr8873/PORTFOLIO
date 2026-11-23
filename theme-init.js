// Apply the saved theme before the stylesheet renders to avoid a flash of the
// wrong colour scheme. Dark is the intentional default for first-time visitors.
(function () {
  try {
    var savedTheme = window.localStorage.getItem("suraj-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  } catch (error) {
    // Storage can be unavailable in strict privacy modes; the default theme
    // still works perfectly.
  }
})();
