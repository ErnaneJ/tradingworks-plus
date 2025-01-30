function updateCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach(element => {
    element.textContent = new Date().getFullYear();
  });
}

document.addEventListener("DOMContentLoaded", updateCurrentYear);
