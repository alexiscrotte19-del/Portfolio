const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("Formulaire soumis !");

    status.textContent = "Envoi en cours...";

    const payload = {
      nom: form.nom.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        status.textContent = "Message envoyé, merci !";
        form.reset();
      } else {
        status.textContent = data.error || "Une erreur est survenue, réessaie.";
      }
    } catch (err) {
      console.error(err);
      status.textContent = "Impossible de contacter le serveur.";
    }
  });
}

// logique pour le bouton de changement de thème
// (délégation d'événements : fonctionne même si #themeToggle est injecté
// après coup par le composant <site-header>, quel que soit l'ordre de chargement)

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  applyTheme("dark");
}

document.addEventListener("click", (event) => {
  if (event.target && event.target.id === "themeToggle") {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  }
});