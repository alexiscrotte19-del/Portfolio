class MusicPlayer extends HTMLElement {
  async connectedCallback() {
    this.tracks = [
      { title: "Battle Cry", artist: "Musique du serveur", src: "audio/morceau1.mp3" },
      { title: "Superhero", artist: "Musique du serveur", src: "audio/morceau2.mp3" },
      { title: "Azurin - Version Kelly Evenson", artist: "Musique du serveur", src: "audio/morceau3.mp3" },
      { title: "Impossible", artist: "Musique du serveur", src: "audio/morceau4.mp3" }
    ];

    this.currentIndex = 0;
    this.isShuffle = false;
    this.repeatMode = 0;
    this.toastTimeout = null;

    this.render();

    try {
      const res = await fetch('/api/tracks');
      if (res.ok) {
        const serverTracks = await res.json();
        if (Array.isArray(serverTracks) && serverTracks.length > 0) {
          this.tracks = serverTracks;
        }
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des musiques :", err);
    }

    this.bindEvents();
    this.renderPlaylist();
    this.loadTrack(0, false);
  }

  render() {
    this.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          max-width: 480px;
          margin: 0 auto 48px auto; /* Ajout d'un espace de respiration de 48px en bas du composant */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative;
          z-index: 1;
        }

        .mp-card {
          position: relative;
          background: rgba(22, 22, 29, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          color: #f4f4f5;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 48px; /* Espace de sécurité en bas de la carte */
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1); /* Ombre ajustée pour ne pas baver */
          box-sizing: border-box;
          overflow: hidden;
        }

        /* Halo néon d'ambiance */
        .mp-card::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(0, 0, 0, 0) 70%);
          pointer-events: none;
          z-index: 0;
        }

        .mp-content {
          position: relative;
          z-index: 1;
        }

        .mp__toast {
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(30, 30, 40, 0.95);
          color: #60a5fa;
          border: 1px solid rgba(96, 165, 250, 0.3);
          padding: 6px 18px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 600;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          white-space: nowrap;
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          z-index: 10;
        }

        .mp__toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(12px);
        }

        /* En-tête */
        .mp__header {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 22px;
        }

        .mp__cover-wrapper {
          position: relative;
          width: 64px;
          height: 64px;
          flex-shrink: 0;
        }

        .mp__cover {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #2563eb, #1e1b4b);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          color: #ffffff;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .mp-card.playing .mp__cover {
          animation: spinCover 12s linear infinite;
        }

        @keyframes spinCover {
          100% { transform: rotate(360deg); }
        }

        .mp__meta {
          flex: 1;
          min-width: 0;
        }

        .mp__title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mp__title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Égaliseur visuel quand en lecture */
        .mp__eq {
          display: none;
          align-items: flex-end;
          gap: 2px;
          height: 12px;
        }

        .mp-card.playing .mp__eq {
          display: flex;
        }

        .mp__eq-bar {
          width: 3px;
          background: #60a5fa;
          border-radius: 2px;
          animation: eqAnim 0.8s ease-in-out infinite alternate;
        }

        .mp__eq-bar:nth-child(1) { height: 60%; animation-delay: 0.1s; }
        .mp__eq-bar:nth-child(2) { height: 100%; animation-delay: 0.3s; }
        .mp__eq-bar:nth-child(3) { height: 40%; animation-delay: 0.2s; }

        @keyframes eqAnim {
          0% { height: 20%; }
          100% { height: 100%; }
        }

        .mp__artist {
          font-size: 0.82rem;
          color: #9ca3af;
          margin: 4px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Contrôles */
        .mp__controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          margin-bottom: 20px;
        }

        .mp__btn {
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 1.15rem;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .mp__btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
          transform: scale(1.1);
        }

        .mp__btn.active {
          color: #60a5fa;
          text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
        }

        .mp__play-btn {
          width: 48px;
          height: 48px;
          background: #ffffff;
          color: #0f172a;
          border-radius: 50%;
          font-size: 1.1rem;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

        .mp__play-btn:hover {
          background: #f8fafc;
          color: #0284c7;
          transform: scale(1.08);
          box-shadow: 0 0 25px rgba(56, 189, 248, 0.5);
        }

        /* Barre de progression */
        .mp__progress-group {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .mp__time {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          min-width: 32px;
        }

        .mp__bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          cursor: pointer;
          position: relative;
        }

        .mp__fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 10px;
          box-shadow: 0 0 12px rgba(96, 165, 250, 0.6);
          transition: width 0.1s linear;
        }

        /* Volume */
        .mp__volume-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 18px;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .mp__volume-icon {
          color: #64748b;
          font-size: 0.9rem;
        }

        .mp__volume-slider {
          width: 100px;
          height: 4px;
          accent-color: #3b82f6;
          cursor: pointer;
        }

        /* Playlist */
        .mp__playlist {
          list-style: none;
          padding: 0;
          margin: 0 0 20px 0;
          max-height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mp__playlist-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-radius: 12px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .mp__playlist-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.05);
        }

        .mp__playlist-item.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .mp__item-title {
          font-size: 0.85rem;
          font-weight: 500;
          color: #e2e8f0;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mp__playlist-item.active .mp__item-title {
          color: #60a5fa;
          font-weight: 700;
        }

        .mp__item-artist {
          font-size: 0.75rem;
          color: #64748b;
          margin-left: 12px;
          flex-shrink: 0;
        }

        .mp__playlist-item.active .mp__item-artist {
          color: #93c5fd;
        }

        /* Formulaire */
        .mp__upload-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 18px;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .mp__input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 0.85rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .mp__input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .mp__input::placeholder {
          color: #475569;
        }

        .mp__input-file {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .mp__submit-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
          transition: all 0.2s ease;
        }

        .mp__submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 20px rgba(37, 99, 235, 0.4);
        }

        .mp__submit-btn:active {
          transform: translateY(0);
        }

        .mp__playlist::-webkit-scrollbar {
          width: 4px;
        }
        .mp__playlist::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
      </style>

      <div class="mp-card" data-el="card">
        <div class="mp-content">
          <div class="mp__toast" data-el="toast"></div>

          <!-- Pochette & Titre -->
          <div class="mp__header">
            <div class="mp__cover-wrapper">
              <div class="mp__cover">🎵</div>
            </div>
            <div class="mp__meta">
              <div class="mp__title-row">
                <h3 class="mp__title" data-el="title">—</h3>
                <div class="mp__eq">
                  <div class="mp__eq-bar"></div>
                  <div class="mp__eq-bar"></div>
                  <div class="mp__eq-bar"></div>
                </div>
              </div>
              <p class="mp__artist" data-el="artist">—</p>
            </div>
          </div>

          <!-- Contrôles -->
          <div class="mp__controls">
            <button class="mp__btn" data-el="shuffle" title="Lecture aléatoire">🔀</button>
            <button class="mp__btn" data-el="prev" title="Précédent">⏮</button>
            <button class="mp__btn mp__play-btn" data-el="play" title="Lecture / Pause">▶</button>
            <button class="mp__btn" data-el="next" title="Suivant">⏭</button>
            <button class="mp__btn" data-el="repeat" title="Répéter">🔁</button>
          </div>

          <!-- Progression -->
          <div class="mp__progress-group">
            <span class="mp__time" data-el="currentTime">0:00</span>
            <div class="mp__bar" data-el="bar">
              <div class="mp__fill" data-el="fill"></div>
            </div>
            <span class="mp__time" data-el="duration">0:00</span>
          </div>

          <!-- Volume -->
          <div class="mp__volume-group">
            <span class="mp__volume-icon">🔊</span>
            <input type="range" class="mp__volume-slider" data-el="volume" min="0" max="1" step="0.01" value="1">
          </div>

          <!-- Liste des pistes -->
          <ul class="mp__playlist" data-el="playlist"></ul>

          <!-- Formulaire d'upload -->
          <form class="mp__upload-form" data-el="uploadForm">
            <input type="text" class="mp__input" data-el="inputTitle" placeholder="Titre du morceau (optionnel)">
            <input type="text" class="mp__input" data-el="inputArtist" placeholder="Artiste (optionnel)">
            <input type="file" class="mp__input-file" data-el="inputFile" accept="audio/*">
          
            <button type="submit" class="mp__submit-btn">
              <span>➕</span> AJOUTER LE MORCEAU
            </button>
          </form>
        </div>
      </div>

      <audio data-el="audio"></audio>
    `;

    this.cardEl = this.querySelector('[data-el="card"]');
    this.audio = this.querySelector('[data-el="audio"]');
    this.playBtn = this.querySelector('[data-el="play"]');
    this.prevBtn = this.querySelector('[data-el="prev"]');
    this.nextBtn = this.querySelector('[data-el="next"]');
    this.shuffleBtn = this.querySelector('[data-el="shuffle"]');
    this.repeatBtn = this.querySelector('[data-el="repeat"]');
    this.titleEl = this.querySelector('[data-el="title"]');
    this.artistEl = this.querySelector('[data-el="artist"]');
    this.barEl = this.querySelector('[data-el="bar"]');
    this.fillEl = this.querySelector('[data-el="fill"]');
    this.currentTimeEl = this.querySelector('[data-el="currentTime"]');
    this.durationEl = this.querySelector('[data-el="duration"]');
    this.volumeEl = this.querySelector('[data-el="volume"]');
    this.playlistEl = this.querySelector('[data-el="playlist"]');
    this.toastEl = this.querySelector('[data-el="toast"]');
  }

  showNotification(message) {
    clearTimeout(this.toastTimeout);
    this.toastEl.textContent = message;
    this.toastEl.classList.add("show");
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove("show");
    }, 2200);
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  renderPlaylist() {
    if (!this.playlistEl || !this.tracks) return;

    this.playlistEl.innerHTML = this.tracks
      .map(
        (track, index) => `
        <li class="mp__playlist-item ${index === this.currentIndex ? "active" : ""}" data-index="${index}">
          <span class="mp__item-title">${track.title}</span>
          <span class="mp__item-artist">${track.artist}</span>
        </li>
      `
      )
      .join("");

    this.playlistEl.querySelectorAll(".mp__playlist-item").forEach((item) => {
      item.addEventListener("click", () => {
        const index = parseInt(item.getAttribute("data-index"), 10);
        this.loadTrack(index, true);
      });
    });
  }

  loadTrack(index, autoplay) {
    if (!this.tracks || this.tracks.length === 0) return;

    this.currentIndex = (index + this.tracks.length) % this.tracks.length;
    const track = this.tracks[this.currentIndex];
    this.audio.src = track.src;
    this.titleEl.textContent = track.title;
    this.artistEl.textContent = track.artist;
    this.renderPlaylist();

    if (autoplay) {
      this.audio.play();
      this.playBtn.textContent = "⏸";
      this.cardEl.classList.add("playing");
    } else {
      this.playBtn.textContent = "▶";
      this.cardEl.classList.remove("playing");
    }
  }

  nextTrack(autoplay = true) {
    if (this.isShuffle) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * this.tracks.length);
      } while (randomIndex === this.currentIndex && this.tracks.length > 1);
      this.loadTrack(randomIndex, autoplay);
    } else {
      this.loadTrack(this.currentIndex + 1, autoplay);
    }
  }

  bindEvents() {
    this.playBtn.addEventListener("click", () => {
      if (this.audio.paused) {
        this.audio.play();
        this.playBtn.textContent = "⏸";
        this.cardEl.classList.add("playing");
      } else {
        this.audio.pause();
        this.playBtn.textContent = "▶";
        this.cardEl.classList.remove("playing");
      }
    });

    this.prevBtn.addEventListener("click", () => this.loadTrack(this.currentIndex - 1, true));
    this.nextBtn.addEventListener("click", () => this.nextTrack(true));

    this.shuffleBtn.addEventListener("click", () => {
      this.isShuffle = !this.isShuffle;
      this.shuffleBtn.classList.toggle("active", this.isShuffle);
      this.showNotification(this.isShuffle ? "Lecture aléatoire activée 🔀" : "Lecture aléatoire désactivée");
    });

    this.repeatBtn.addEventListener("click", () => {
      this.repeatMode = (this.repeatMode + 1) % 3;
      if (this.repeatMode === 0) {
        this.repeatBtn.textContent = "🔁";
        this.repeatBtn.classList.remove("active");
        this.showNotification("Répétition désactivée");
      } else if (this.repeatMode === 1) {
        this.repeatBtn.textContent = "🔁";
        this.repeatBtn.classList.add("active");
        this.showNotification("Répéter la playlist 🔁");
      } else if (this.repeatMode === 2) {
        this.repeatBtn.textContent = "🔂";
        this.repeatBtn.classList.add("active");
        this.showNotification("Répéter le morceau 🔂");
      }
    });

    this.audio.addEventListener("ended", () => {
      if (this.repeatMode === 2) {
        this.audio.currentTime = 0;
        this.audio.play();
      } else if (this.repeatMode === 1 || this.currentIndex < this.tracks.length - 1 || this.isShuffle) {
        this.nextTrack(true);
      } else {
        this.playBtn.textContent = "▶";
        this.cardEl.classList.remove("playing");
      }
    });

    this.audio.addEventListener("timeupdate", () => {
      const percent = (this.audio.currentTime / this.audio.duration) * 100 || 0;
      this.fillEl.style.width = `${percent}%`;
      this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    });

    this.audio.addEventListener("loadedmetadata", () => {
      this.durationEl.textContent = this.formatTime(this.audio.duration);
    });

    this.barEl.addEventListener("click", (event) => {
      const rect = this.barEl.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      this.audio.currentTime = ratio * this.audio.duration;
    });

    this.volumeEl.addEventListener("input", () => {
      this.audio.volume = this.volumeEl.value;
    });

    const uploadForm = this.querySelector('[data-el="uploadForm"]');

    if (uploadForm) {
      uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titleInput = this.querySelector('[data-el="inputTitle"]');
        const artistInput = this.querySelector('[data-el="inputArtist"]');
        const fileInput = this.querySelector('[data-el="inputFile"]');

        if (!fileInput.files[0]) return;

        const file = fileInput.files[0];

        // Titre par défaut : nom du fichier nettoyé d'extension et d'underscores
        const defaultTitle = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        const finalTitle = titleInput.value.trim() || defaultTitle;
        const finalArtist = artistInput.value.trim() || "Artiste inconnu";

        const formData = new FormData();
        formData.append('title', finalTitle);
        formData.append('artist', finalArtist);
        formData.append('audioTrack', file);

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          const text = await res.text();
          const data = text ? JSON.parse(text) : {};

          if (res.ok) {
            this.tracks.push({
              title: data.title || finalTitle,
              artist: data.artist || finalArtist,
              src: data.src
            });

            this.renderPlaylist();
            this.loadTrack(this.tracks.length - 1, true);
            this.showNotification("Morceau ajouté avec succès ! 🎵");
            uploadForm.reset();
          } else {
            alert(data.error || "Erreur lors de l'envoi.");
          }
        } catch (err) {
          console.error("Erreur serveur :", err);
        }
      });
    }
  }
}

customElements.define("music-player", MusicPlayer);