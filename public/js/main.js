(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    const status = document.getElementById("formStatus");
    const selectedInput = document.getElementById("selectedSubject");

    if (!form) return;

    // --- GESTION DES CLICS SUR LES BOUTONS D'OPTIONS ---
    const tagButtons = form.querySelectorAll(".tag-btn");

    tagButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        
        tagButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const val = btn.dataset.value || btn.getAttribute("data-value") || btn.textContent.trim();
        
        if (selectedInput) {
          selectedInput.value = val;
        }
        console.log("Sujet sélectionné :", val);
      });
    });

    // --- GESTION DE LA SOUMISSION DU FORMULAIRE ---
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (status) status.textContent = "Envoi en cours...";

      // Récupération automatique de TOUS les champs du formulaire par leur attribut 'name'
      const formData = new FormData(form);
      
      const payload = {
        sujet: selectedInput ? selectedInput.value : (formData.get("subject") || "Non précisé"),
        nom: (formData.get("name") || "").trim(),
        email: (formData.get("email") || "").trim(),
        message: (formData.get("message") || "").trim(),
      };

      console.log("Données envoyées au serveur :", payload);

      // Vérification côté client avant envoi
      if (!payload.nom || !payload.email || !payload.message) {
        if (status) status.textContent = "Merci de remplir tous les champs du formulaire.";
        console.warn("Champs manquants :", payload);
        return;
      }

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          if (status) status.textContent = "Message envoyé, merci !";
          form.reset();

          if (tagButtons.length > 0) {
            tagButtons.forEach((b) => b.classList.remove("active"));
            tagButtons[0].classList.add("active");
            if (selectedInput) {
              selectedInput.value = tagButtons[0].dataset.value || tagButtons[0].textContent.trim();
            }
          }
        } else {
          if (status) status.textContent = data.error || "Une erreur est survenue lors de l'envoi.";
        }
      } catch (err) {
        console.error("Erreur réseau / serveur :", err);
        if (status) status.textContent = "Impossible de contacter le serveur.";
      }
    });
  });

  // Logique du thème
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  }

  if (localStorage.getItem("theme") === "dark") {
    applyTheme("dark");
  }

  document.addEventListener("click", (event) => {
    if (event.target && event.target.id === "themeToggle") {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      applyTheme(isDark ? "light" : "dark");
      localStorage.setItem("theme", isDark ? "light" : "dark");
    }
  });
})();