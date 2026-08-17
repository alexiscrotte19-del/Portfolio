// js/header.js
class SiteHeader extends HTMLElement {
  connectedCallback() {
    // Récupère le nom du fichier actuel (ex: "projets.html" ou "" pour l'accueil)
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    this.innerHTML = `
      <header>
        <a href="index.html">Alexis Crotte</a>
        <nav>
          
          <ul>
            <li><a href="experience.html" class="${currentPath === 'experience.html' ? 'active' : ''}">Expérience</a></li>
            <li><a href="competences.html" class="${currentPath === 'competences.html' ? 'active' : ''}">Compétences</a></li>
            <li><a href="projets.html" class="${currentPath === 'projets.html' ? 'active' : ''}">Projets</a></li>
            <li><a href="formation.html" class="${currentPath === 'formation.html' ? 'active' : ''}">Formation</a></li>
            <li><a href="actualites.html" class="${currentPath === 'actualites.html' ? 'active' : ''}">Actualitéss</a></li>
            <li><a href="contact.html" class="${currentPath === 'contact.html' ? 'active' : ''}">Contact</a></li>
            <button id="themeToggle" type="button" aria-label="Changer de thème">🌓</button>
          </ul>
        </nav>
      </header>
    `;
  }
}

customElements.define("site-header", SiteHeader);