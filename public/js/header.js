// js/header.js
class SiteHeader extends HTMLElement {
  connectedCallback() {
    // Récupère le nom du fichier actuel (ex: "projets.html" ou "" pour l'accueil)
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    this.innerHTML = `
      <header>
        
        <nav>
          
          <ul>
          
           <li><a href="index.html" class="${currentPath === 'index.html' ? 'active' : ''}">Accueil</a></li>
            <li><a href="SIO.html" class="${currentPath === 'SIO.html' ? 'active' : ''}">BTS SIO</a></li>
            <li><a href="experience.html" class="${currentPath === 'experience.html' ? 'active' : ''}">Expérience</a></li>
            <li><a href="projets.html" class="${currentPath === 'projets.html' ? 'active' : ''}">Projets</a></li>
            <li><a href="actualites.html" class="${currentPath === 'actualites.html' ? 'active' : ''}">Actualités</a></li>
            <li><a href="contact.html" class="${currentPath === 'contact.html' ? 'active' : ''}">Contact</a></li>
            
          </ul>
        </nav>
           <button id="themeToggle" type="button" aria-label="Changer de thème">🌓</button>
      </header>
    `;
  }
}

customElements.define("site-header", SiteHeader);