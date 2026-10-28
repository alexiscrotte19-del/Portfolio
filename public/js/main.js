(() => {
  // clés accès Web3Form (fallback utilisé si le serveur Render est eteint ou en veille /injoinable)
  // récupération d la clé gratuitementsur htpps://web3form.com/
  const WEB3FORMS_ACCESS_KEY = "e9827acc-9b3f-48c2-a634-4fb692650179";

  // envoie le message viaweb3form (solutioin de secours indépendant)
  async function sendViaWeb3Forms(payload) {
    const reponse = await fetch("https://api.web3forms.com/submit" , {
      method:"POST",
      headers:{"Content-type": "application/json"},
      body:JSON.stringify({
        access_key :WEB3FORMS_ACCESS_KEY,
        subject: `Nouveau message via portfolio — ${payload.sujet}`,
        name:payload.nom,
        email: payload.email,
        message:payload.message,
      }),
    });
    const data =await reponse.json();
    if (!reponse.ok || !data.success){
      throw new Error(data.message||"Echec sz l'envoi via Web3Fomrs");
      }
    }



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

    // Réinitialise le formulair après envoie  réussi (via la première méthode ou la deuxième)
    const resetFormAfterSuccess = () => {
      form.reset();
      if (tagButtons.length> 0 ) {
        tagButtons.forEach((b) => b.classList.remove("active"));
        tagButtons[0].classList.add("active");
        if (selectedInput) {
          selectedInput.value = tagButtons[0].dataset.value || tagButtons[0].textContent.trim();
        }
      }
    };

    //1 tentative via le serveur principal avec un time out de 5s au cas ou il soit eteint ou en veille 
    try{
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort() ,5000);

      const reponse = await fetch ("/api/contact",{
        method:"POST",
        headers:{"Content-type":"application/json"},
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    
      const data = await reponse.json();

      if (reponse .ok && data.ok){
        if (status) status.textContent ="Message envoyé, merci !";
      resetFormAfterSuccess();
      return;
    }

    //le serveur à répondu mais à refuser la requête pas de fallback //

    if (status) status.textContent = data.error || "une erreur est survenue lors de l'envoie";
    return;
    }catch (err){
        console.warn ("Serveur principal injoignable, tentative via Web3Forms :", err);
    }

    // 2. Fallback : le serveur principal n'a pas répondu (éteint, en veille, timeout...)
      try {
        await sendViaWeb3Forms(payload);
        if (status) status.textContent = "Message envoyé, merci !";
        resetFormAfterSuccess();
      } catch (err) {
        console.error("Échec du fallback Web3Forms :", err);
        if (status) status.textContent = "Impossible d'envoyer le message pour le moment. Contactez-moi directement par e-mail.";

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