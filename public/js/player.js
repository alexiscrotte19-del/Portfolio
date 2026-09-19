class MusicPlayer extends HTMLElement {
  async connectedCallback() {
    // Possibilité d'ajouter "cover" : image URL ou Emoji
    this.tracks = [
      { title: "Battle Cry", artist: "Musique du serveur", src: "audio/morceau1.mp3", cover: "🎵" },
      { title: "Superhero", artist: "Musique du serveur", src: "audio/morceau2.mp3", cover: "⚡" },
      { title: "Azurin - Version Kelly Evenson", artist: "Musique du serveur", src: "audio/morceau3.mp3", cover: "🌊" },
      { title: "Impossible", artist: "Musique du serveur", src: "audio/morceau4.mp3", cover: "🔥" }
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
          display: flex !important;
          justify-content: center !important;
          width: 100% !important;
          margin: 20px auto !important;
        }

        .mp-card {
          position: relative;
          width: 100% !important;
          max-width: 320px !important;
          background: rgba(22, 22, 29, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: #f4f4f5;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 20px 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          box-sizing: border-box !important;
        }

        .mp-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .mp__toast {
          position: absolute;
          top: -35px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(30, 30, 40, 0.95);
          color: #60a5fa;
          border: 1px solid rgba(96, 165, 250, 0.3);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 20;
        }

        .mp__toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(5px);
        }

        .mp__cover-wrapper {
          width: 80px;
          height: 80px;
          margin-bottom: 12px;
          flex-shrink: 0;
        }

        .mp__cover {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #2563eb, #1e1b4b);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: #ffffff;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
          overflow: hidden;
        }

        .mp__cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mp__meta {
          width: 100%;
          text-align: center;
          margin-bottom: 14px;
        }

        .mp__title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mp__artist {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 3px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mp__progress-group {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          margin-bottom: 14px;
        }

        .mp__time {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 600;
          min-width: 26px;
          text-align: center;
        }

        .mp__bar {
          flex: 1;
          height: 5px;
          background: rgba(255, 255, 255, 0.1);
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
        }

        .mp__controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          margin-bottom: 14px;
        }

        .mp__btn {
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 0.95rem;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .mp__btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .mp__btn.active {
          color: #60a5fa;
        }

        .mp__play-btn {
          width: 42px;
          height: 42px;
          background: #ffffff;
          color: #0f172a;
          border-radius: 50%;
          font-size: 1rem;
        }

        .mp__play-btn:hover {
          background: #38bdf8;
          color: #ffffff;
          transform: scale(1.05);
        }

        .mp__bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding-top: 4px;
        }

        .mp__volume-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mp__volume-slider {
          width: 70px;
          height: 4px;
          accent-color: #3b82f6;
          cursor: pointer;
        }

        .mp__toggle-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #9ca3af;
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mp__toggle-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .mp__drawer {
          display: none;
          width: 100%;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .mp__drawer.open {
          display: block;
        }

        .mp__playlist {
          list-style: none;
          padding: 0;
          margin: 0 0 12px 0;
          max-height: 130px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mp__playlist-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.03);
          font-size: 0.75rem;
        }

        .mp__playlist-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .mp__playlist-item.active {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          font-weight: 600;
        }

        /* Miniature dans la playlist */
        .mp__item-icon {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          flex-shrink: 0;
          overflow: hidden;
        }

        .mp__item-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mp__item-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 1;
          min-width: 0;
        }

        .mp__item-info span:first-child {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mp__item-info span:last-child {
          white-space: nowrap;
          font-size: 0.68rem;
          opacity: 0.7;
          margin-left: 6px;
          flex-shrink: 0;
        }

        .mp__upload-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mp__input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          width: 100%;
          box-sizing: border-box;
        }

        .mp__input-file {
          font-size: 0.7rem;
          color: #94a3b8;
          width: 100%;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 4px;
          box-sizing: border-box;
        }

        .mp__input-file::file-selector-button {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
          transition: background 0.2s ease;
        }

        .mp__input-file::file-selector-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .mp__submit-btn {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          width: 100%;
          transition: background 0.2s ease;
        }

        .mp__submit-btn:hover {
          background: #3b82f6;
        }

        .mp__playlist::-webkit-scrollbar {
          width: 4px;
        }
        .mp__playlist::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
      </style>

      <div class="mp-card" data-el="card">
        <div class="mp-content">
          <div class="mp__toast" data-el="toast"></div>

          <div class="mp__cover-wrapper">
            <div class="mp__cover" data-el="cover">🎵</div>
          </div>

          <div class="mp__meta">
            <h3 class="mp__title" data-el="title">—</h3>
            <p class="mp__artist" data-el="artist">—</p>
          </div>

          <div class="mp__progress-group">
            <span class="mp__time" data-el="currentTime">0:00</span>
            <div class="mp__bar" data-el="bar">
              <div class="mp__fill" data-el="fill"></div>
            </div>
            <span class="mp__time" data-el="duration">0:00</span>
          </div>

          <div class="mp__controls">
            <button class="mp__btn" data-el="shuffle" title="Lecture aléatoire">🔀</button>
            <button class="mp__btn" data-el="prev" title="Précédent">⏮</button>
            <button class="mp__btn mp__play-btn" data-el="play" title="Lecture / Pause">▶</button>
            <button class="mp__btn" data-el="next" title="Suivant">⏭</button>
            <button class="mp__btn" data-el="repeat" title="Répéter">🔁</button>
          </div>

          <div class="mp__bottom-row">
            <div class="mp__volume-group">
              <span style="font-size:0.8rem;">🔊</span>
              <input type="range" class="mp__volume-slider" data-el="volume" min="0" max="1" step="0.01" value="1">
            </div>
            <button class="mp__toggle-btn" data-el="toggleDrawer">☰ Liste</button>
          </div>

          <div class="mp__drawer" data-el="drawer">
            <ul class="mp__playlist" data-el="playlist"></ul>

            <form class="mp__upload-form" data-el="uploadForm">
              <input type="text" class="mp__input" data-el="inputTitle" placeholder="Titre (optionnel)">
              <input type="text" class="mp__input" data-el="inputArtist" placeholder="Artiste (optionnel)">
              <input type="file" class="mp__input-file" data-el="inputFile" accept="audio/*">
              <button type="submit" class="mp__submit-btn">AJOUTER LE MORCEAU</button>
            </form>
          </div>
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
    this.coverEl = this.querySelector('[data-el="cover"]');
    this.titleEl = this.querySelector('[data-el="title"]');
    this.artistEl = this.querySelector('[data-el="artist"]');
    this.barEl = this.querySelector('[data-el="bar"]');
    this.fillEl = this.querySelector('[data-el="fill"]');
    this.currentTimeEl = this.querySelector('[data-el="currentTime"]');
    this.durationEl = this.querySelector('[data-el="duration"]');
    this.volumeEl = this.querySelector('[data-el="volume"]');
    this.playlistEl = this.querySelector('[data-el="playlist"]');
    this.toastEl = this.querySelector('[data-el="toast"]');
    this.drawerEl = this.querySelector('[data-el="drawer"]');
    this.toggleBtn = this.querySelector('[data-el="toggleDrawer"]');
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

  // Génère un élément d'affichage (image HTML ou emoji) selon le contenu de cover
  renderCoverHTML(coverVal) {
    if (coverVal && (coverVal.startsWith('http') || coverVal.startsWith('images/') || coverVal.startsWith('/'))) {
      return `<img src="${coverVal}" alt="Cover">`;
    }
    return coverVal || "🎵";
  }

  renderPlaylist() {
    if (!this.playlistEl || !this.tracks) return;

    this.playlistEl.innerHTML = this.tracks
      .map((track, index) => {
        const coverContent = this.renderCoverHTML(track.cover);
        return `
          <li class="mp__playlist-item ${index === this.currentIndex ? "active" : ""}" data-index="${index}">
            <div class="mp__item-icon">${coverContent}</div>
            <div class="mp__item-info">
              <span>${track.title}</span>
              <span>${track.artist}</span>
            </div>
          </li>
        `;
      })
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
    this.coverEl.innerHTML = this.renderCoverHTML(track.cover);
    this.renderPlaylist();

    if (autoplay) {
      this.audio.play();
      this.playBtn.textContent = "⏸";
    } else {
      this.playBtn.textContent = "▶";
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
    this.toggleBtn.addEventListener("click", () => {
      this.drawerEl.classList.toggle("open");
    });

    this.playBtn.addEventListener("click", () => {
      if (this.audio.paused) {
        this.audio.play();
        this.playBtn.textContent = "⏸";
      } else {
        this.audio.pause();
        this.playBtn.textContent = "▶";
      }
    });

    this.prevBtn.addEventListener("click", () => this.loadTrack(this.currentIndex - 1, true));
    this.nextBtn.addEventListener("click", () => this.nextTrack(true));

    this.shuffleBtn.addEventListener("click", () => {
      this.isShuffle = !this.isShuffle;
      this.shuffleBtn.classList.toggle("active", this.isShuffle);
      this.showNotification(this.isShuffle ? "Aléatoire activé 🔀" : "Aléatoire désactivé");
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
        this.showNotification("Répéter la liste 🔁");
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
              src: data.src,
              cover: data.cover || "🎵"
            });

            this.renderPlaylist();
            this.loadTrack(this.tracks.length - 1, true);
            this.showNotification("Morceau ajouté ! 🎵");
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