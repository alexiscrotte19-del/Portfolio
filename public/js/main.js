const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");

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