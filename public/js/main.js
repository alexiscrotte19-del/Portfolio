const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");

if (form) {
  // Gestion de la sélection des badges d'objet
  const tagButtons = form.querySelectorAll(".tag-btn");
  const selectedInput = document.getElementById("selectedSubject");

  tagButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault(); // Empêche la soumission du formulaire au clic sur un badge

      // Active le bouton cliqué et désactive les autres
      tagButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Met à jour la valeur du champ caché si présent
      if (selectedInput) {
        selectedInput.value = btn.dataset.value;
      }
    });
  });

  // Gestion de la soumission du formulaire
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("Formulaire soumis !");

    status.textContent = "Envoi en cours...";

    const payload = {
      sujet: selectedInput ? selectedInput.value : "Non précisé",
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

        // Réinitialise la sélection sur le premier badge par défaut
        if (tagButtons.length > 0) {
          tagButtons.forEach((b) => b.classList.remove("active"));
          tagButtons[0].classList.add("active");
          if (selectedInput) {
            selectedInput.value = tagButtons[0].dataset.value;
          }
        }
      } else {
        status.textContent = data.error || "Une erreur est survenue, réessaie.";
      }
    } catch (err) {
      console.error(err);
      status.textContent = "Impossible de contacter le serveur.";
    }
  });
}

// Logique pour le bouton de changement de thème
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
document.addEventListener("DOMContentLoaded", () => {
  const tagButtons = document.querySelectorAll(".tag-btn");
  const selectedInput = document.getElementById("selectedSubject");

  tagButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Empêche d'autres écouteurs de bloquer le clic

      // Retire la classe 'active' de tous les boutons
      tagButtons.forEach((b) => b.classList.remove("active"));

      // Ajoute la classe 'active' au bouton cliqué
      btn.classList.add("active");

      // Met à jour la valeur envoyée dans le formulaire
      if (selectedInput) {
        selectedInput.value = btn.getAttribute("data-value");
      }
    });
  });
});