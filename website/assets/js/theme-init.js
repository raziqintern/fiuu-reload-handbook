/* Fiuu Reload Academy — applies a saved theme choice before first paint,
   to avoid a flash of the wrong theme. Loaded synchronously in <head>,
   before the stylesheet, on every page. */
(function () {
  try {
    var saved = localStorage.getItem("fra:theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {}
})();
