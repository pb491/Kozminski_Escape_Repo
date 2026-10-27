/**
 * Kozminski Escape: Polowanie na ECTS
 * js/game.js - Główny silnik gry 2D na Canvasie
 * Akademia Leona Koźmińskiego w Warszawie
 */

// Stan gry
const GameState = {
  TITLE_MENU: 'TITLE_MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
};

class KozminskiEscapeGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Wymiary pola gry
    this.width = 800;
    this.height = 540;

    // Elementy DOM
    this.ectsCounterEl = document.getElementById('ects-counter');
    this.ectsProgressBar = document.getElementById('ects-progress-bar');
    this.staminaPercentEl = document.getElementById('stamina-percent');
    this.staminaProgressBar = document.getElementById('stamina-progress-bar');
    this.campusStatusEl = document.getElementById('campus-status');
    this.speechBubbleEl = document.getElementById('professor-speech-bubble');
    this.speechTextEl = document.getElementById('professor-speech-text');

    // Modale
    this.startModal = document.getElementById('start-modal');
    this.gameoverModal = document.getElementById('gameover-modal');
    this.victoryModal = document.getElementById('victory-modal');

    // Przyciski
    this.btnStart = document.getElementById('btn-start-game');
    this.btnRetry = document.getElementById('btn-retry-game');
    this.btnVictoryRestart = document.getElementById('btn-victory-restart');
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnPauseToggle = document.getElementById('btn-pause-toggle');
    this.pauseIcon = document.getElementById('pause-icon');
    this.btnArtillery = document.getElementById('btn-artillery');
    this.artilleryTimerEl = document.getElementById('artillery-timer');
    this.btnTouchArtillery = document.getElementById('btn-touch-artillery');
    this.touchArtilleryTextEl = document.getElementById('touch-artillery-text');

    // Statystyki do podsumowania
    this.gameoverEctsEl = document.getElementById('gameover-ects-value');
    this.gameoverTimeEl = document.getElementById('gameover-time-value');
    this.gameoverCoffeeEl = document.getElementById('gameover-coffee-value');
    this.gameoverQuoteEl = document.getElementById('gameover-professor-phrase');

    this.victoryEctsEl = document.getElementById('victory-ects-value');
    this.victoryTimeEl = document.getElementById('victory-time-value');
    this.victoryGradeEl = document.getElementById('victory-grade-value');

    // Wypowiedzi profesora
    this.professorQuotes = [
      '„Nie ma przedłużenia terminu oddania projektu!”',
      '„Gdzie jest bibliografia w standardzie APA 7?!”',
      '„Kto nie był na wykładzie o 8:00 rano?!”',
      '„Proszę natychmiast schować telefon!”',
      '„Zapraszam na egzamin komisyjny w drugim terminie!”',
      '„Ekonometria wymaga skupienia, a nie biegania!”',
      '„Czy ta praca nie została wygenerowana przez AI?!”',
      '„Widzę Pana na korytarzu, proszę nie uciekać!”',
      '„W Dziekanacie i tak nikt nie podpisze podania!”',
    ];

    // Cytaty po porażce
    this.defeatQuotes = [
      '„Niestety, brak obecności na ćwiczeniach i pusty arkusz. Do zobaczenia we wrześniu!”',
      '„Zabrakło zaledwie kilku punktów... Zapraszam na sesję poprawkową!”',
      '„Regulamin studiów jest nieubłagany. Spotkamy się na konsultacjach w nowym semestrze.”',
      '„Termin składania prac minął 15 minut temu. Widzimy się na powtarzaniu przedmiotu!”',
    ];

    // Cytaty profesora po trafieniu artylerią
    this.artilleryQuotes = [
      '„Co to za bezczelność?! Kto wydał rozkaz salwy artyleryjskiej z Dziekanatu?!”',
      '„Ała! Mój protokół ocen! Idę do kąta przemyśleć swoje zachowanie...”',
      '„Regulamin studiów nie przewidywał bombardowania! Stoję w kącie!”',
      '„Brak słów! 10 sekund w kącie na ochłonięcie... Ale poprawka i tak będzie!”',
      '„To zamach na autonomię uczelni! Spisuję Wasze nazwiska z tego kąta!”',
    ];

    // Klawisze i wejście
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false,
    };

    // Artyleria akademicka (cooldown 2 minuty = 120s)
    this.artilleryCooldown = 0;
    this.artilleryMaxCooldown = 120;
    this.examinerInCorner = false;
    this.cornerStunTimer = 0;
    this.cornerDuration = 10;
    this.designatedCorner = { x: 50, y: 50 };
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.activeStrikes = [];

    // Czas i pętla
    this.state = GameState.TITLE_MENU;
    this.lastTime = performance.now();
    this.gameStartTime = 0;
    this.elapsedSeconds = 0;
    this.bubbleTimer = 0;
    this.coffeeCount = 0;

    // Przeszkody / Ściany kampusu (Budynek A, Patio, Dziekanat)
    this.walls = [];
    this.setupCampusMap();

    // Inicjalizacja gracza, wroga i przedmiotów
    this.resetGame();

    // Event listenery
    this.initEvents();
  }

  setupCampusMap() {
    // Granice zewnętrzne
    this.walls = [
      { x: 0, y: 0, w: this.width, h: 14 },
      { x: 0, y: this.height - 14, w: this.width, h: 14 },
      { x: 0, y: 0, w: 14, h: this.height },
      { x: this.width - 14, y: 0, w: 14, h: this.height },

      // Budynek A - recepcja i ściany sal wykładowych
      { x: 140, y: 14, w: 16, h: 140 },
      { x: 140, y: 220, w: 16, h: 170 },
      { x: 14, y: 380, w: 220, h: 16 },

      // Zielone Patio (centralny obszar) - obramowanie i gazony
      { x: 300, y: 90, w: 200, h: 20 },
      { x: 300, y: 430, w: 200, h: 20 },

      // Biblioteka & Dziekanat (prawa strona)
      { x: 580, y: 80, w: 16, h: 180 },
      { x: 580, y: 320, w: 16, h: 140 },
      { x: 650, y: 220, w: 136, h: 16 },
    ];

    // Strefy kampusu dla statusu HUD
    this.zones = [
      { name: 'Budynek A · Hol Główny', x: 0, y: 0, w: 260, h: 540 },
      { name: 'Zielone Patio ALK · Lew Koźmińskiego', x: 260, y: 0, w: 280, h: 540 },
      { name: 'Budynek D · Dziekanat & Aula', x: 540, y: 0, w: 260, h: 540 },
    ];

    // Pomnik Lwa Koźmińskiego (na Patio)
    this.lionStatue = {
      x: 375,
      y: 245,
      w: 50,
      h: 50,
      active: true,
      respawnTimer: 0,
    };

    // Strefa wyjścia / Dziekanatu (dostępna po zdobyciu 30 ECTS)
    this.exitGate = {
      x: 740,
      y: 30,
      w: 44,
      h: 60,
    };
  }

  resetGame() {
    this.ects = 0;
    this.targetEcts = 30;
    this.stamina = 100;
    this.maxStamina = 100;
    this.coffeeCount = 0;
    this.elapsedSeconds = 0;
    this.gameStartTime = performance.now();
    this.isLionBoosted = false;
    this.lionBoostTime = 0;

    // Gracz (Student)
    this.player = {
      x: 60,
      y: 80,
      radius: 15,
      baseSpeed: 2.7,
      sprintSpeed: 4.8,
      facingAngle: 0,
      moving: false,
      color: '#38bdf8',
    };

    // Wróg (Surowy Egzaminator)
    this.examiner = {
      x: 720,
      y: 460,
      radius: 17,
      speed: 2.2,
      baseSpeed: 2.2,
      facingAngle: Math.PI,
      alerted: false,
      phraseCooldown: 2,
    };

    // Przedmioty ECTS i Kawy
    this.items = [];
    this.spawnInitialItems();

    // Cząsteczki efektów wizualnych
    this.particles = [];

    // Reset artylerii i kąta
    this.artilleryCooldown = 0;
    this.examinerInCorner = false;
    this.cornerStunTimer = 0;
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.activeStrikes = [];

    // Reset HUD
    this.updateHUD();
    this.hideSpeechBubble();
  }

  spawnInitialItems() {
    this.items = [];

    // Punkty ECTS (10 książek / indeksów, każdy warty 2-4 ECTS)
    const ectsLocations = [
      { x: 60, y: 200, val: 3 },
      { x: 80, y: 470, val: 3 },
      { x: 210, y: 100, val: 2 },
      { x: 210, y: 320, val: 3 },
      { x: 330, y: 50, val: 2 },
      { x: 470, y: 50, val: 2 },
      { x: 340, y: 480, val: 3 },
      { x: 460, y: 480, val: 2 },
      { x: 640, y: 120, val: 4 },
      { x: 720, y: 160, val: 3 },
      { x: 630, y: 380, val: 3 },
      { x: 720, y: 380, val: 2 },
    ];

    ectsLocations.forEach((loc, idx) => {
      this.items.push({
        id: `ects-${idx}`,
        type: 'ects',
        x: loc.x,
        y: loc.y,
        radius: 12,
        value: loc.val,
        bobOffset: Math.random() * Math.PI * 2,
      });
    });

    // Kawy z kawiarni ALK (przywracają staminę)
    const coffeeLocations = [
      { x: 70, y: 330 },
      { x: 400, y: 150 },
      { x: 400, y: 390 },
      { x: 710, y: 270 },
    ];

    coffeeLocations.forEach((loc, idx) => {
      this.items.push({
        id: `coffee-${idx}`,
        type: 'coffee',
        x: loc.x,
        y: loc.y,
        radius: 11,
        bobOffset: Math.random() * Math.PI * 2,
      });
    });
  }

  initEvents() {
    // Klawiatura
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.keys.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.down = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = true;
      if (['KeyR', 'KeyE'].includes(e.code)) {
        this.fireArtillery();
      }
      if (e.code === 'Space' || e.code === 'KeyP') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.down = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = false;
    });

    // Sterowanie dotykowe (D-pad)
    const bindTouchButton = (elemId, keyProp) => {
      const el = document.getElementById(elemId);
      if (!el) return;

      const press = (ev) => {
        ev.preventDefault();
        this.keys[keyProp] = true;
        el.classList.add('active');
      };
      const release = (ev) => {
        ev.preventDefault();
        this.keys[keyProp] = false;
        el.classList.remove('active');
      };

      el.addEventListener('touchstart', press, { passive: false });
      el.addEventListener('touchend', release, { passive: false });
      el.addEventListener('mousedown', press);
      el.addEventListener('mouseup', release);
      el.addEventListener('mouseleave', release);
    };

    bindTouchButton('btn-touch-up', 'up');
    bindTouchButton('btn-touch-down', 'down');
    bindTouchButton('btn-touch-left', 'left');
    bindTouchButton('btn-touch-right', 'right');
    bindTouchButton('btn-touch-sprint', 'sprint');

    // Przyciski artylerii (HUD oraz dotykowy)
    if (this.btnArtillery) {
      this.btnArtillery.addEventListener('click', () => {
        this.fireArtillery();
      });
    }

    if (this.btnTouchArtillery) {
      const handleTouchArtillery = (ev) => {
        ev.preventDefault();
        this.fireArtillery();
      };
      this.btnTouchArtillery.addEventListener('touchstart', handleTouchArtillery, { passive: false });
      this.btnTouchArtillery.addEventListener('mousedown', handleTouchArtillery);
    }

    // Przyciski modali
    this.btnStart.addEventListener('click', () => {
      if (window.soundManager) window.soundManager.resumeContext();
      this.startModal.classList.add('hidden');
      this.state = GameState.PLAYING;
      this.gameStartTime = performance.now();
      this.showProfessorSpeech('„Zaczynamy egzamin! Sprawdźmy, kto naprawdę uczył się w semestrze!”');
    });

    this.btnRetry.addEventListener('click', () => {
      this.gameoverModal.classList.add('hidden');
      this.resetGame();
      this.state = GameState.PLAYING;
    });

    this.btnVictoryRestart.addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      this.resetGame();
      this.state = GameState.PLAYING;
    });

    // Wyciszenie dźwięku
    this.btnSoundToggle.addEventListener('click', () => {
      if (window.soundManager) {
        const isMuted = window.soundManager.toggleMute();
        this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
      }
    });

    // Pauza
    this.btnPauseToggle.addEventListener('click', () => {
      this.togglePause();
    });

    // Rozpoczęcie pętli renderującej
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.pauseIcon.textContent = '▶️';
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.pauseIcon.textContent = '⏸️';
      this.lastTime = performance.now();
    }
  }

  showProfessorSpeech(text, durationSec = 3.5) {
    this.speechTextEl.textContent = text;
    this.speechBubbleEl.classList.remove('hidden');
    this.bubbleTimer = durationSec;
    if (window.soundManager) window.soundManager.playProfessorAlert();
  }

  hideSpeechBubble() {
    this.speechBubbleEl.classList.add('hidden');
  }

  checkCollisionWithWalls(x, y, radius) {
    for (const w of this.walls) {
      const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(y, w.y + w.h));
      const dx = x - closestX;
      const dy = y - closestY;
      if (dx * dx + dy * dy < radius * radius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Wystrzał artylerii akademickiej - odsyła wykładowcę do kąta na 10 sekund (cooldown: 120s)
   */
  fireArtillery() {
    if (this.state !== GameState.PLAYING) return;
    if (this.artilleryCooldown > 0) return;

    // Rozpoczęcie cooldownu 2 minuty (120 sekund)
    this.artilleryCooldown = this.artilleryMaxCooldown;

    // Dźwięk artylerii (gwizd + potężny wybuch)
    if (window.soundManager) {
      window.soundManager.playArtilleryStrike();
    }

    const ex = this.examiner;
    this.activeStrikes.push({
      startX: ex.x + (Math.random() - 0.5) * 40,
      startY: -40,
      targetX: ex.x,
      targetY: ex.y,
      progress: 0,
      duration: 0.35,
      exploded: false,
      fadeTimer: 0,
    });

    this.updateHUD();
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    this.elapsedSeconds += dt;

    // Cooldown artylerii
    if (this.artilleryCooldown > 0) {
      this.artilleryCooldown = Math.max(0, this.artilleryCooldown - dt);
    }

    // Wstrząs ekranu i błysk wybuchu
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 2.2);
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 3.5);
    }

    // Przetwarzanie uderzeń artylerii
    for (let i = this.activeStrikes.length - 1; i >= 0; i--) {
      const strike = this.activeStrikes[i];
      strike.progress += dt;
      if (!strike.exploded && strike.progress >= strike.duration) {
        strike.exploded = true;
        strike.fadeTimer = 0.55;
        this.screenShake = 0.55;
        this.flashAlpha = 0.65;

        // Eksplozja cząsteczek
        this.createSparkleParticles(strike.targetX, strike.targetY, '#ef4444', 24);
        this.createSparkleParticles(strike.targetX, strike.targetY, '#f59e0b', 20);
        this.createSparkleParticles(strike.targetX, strike.targetY, '#ffffff', 14);
        this.createPaperParticles(strike.targetX, strike.targetY, 14);

        // Odesłanie egzaminatora bezpośrednio do kąta w Budynku A
        this.examiner.x = this.designatedCorner.x;
        this.examiner.y = this.designatedCorner.y;
        this.examiner.facingAngle = -Math.PI * 0.75;
        this.examinerInCorner = true;
        this.cornerStunTimer = this.cornerDuration;

        // Efekt pyłu w kącie
        this.createSparkleParticles(this.designatedCorner.x, this.designatedCorner.y, '#94a3b8', 16);

        // Cytat profesora po trafieniu
        const quote = this.artilleryQuotes[Math.floor(Math.random() * this.artilleryQuotes.length)];
        this.showProfessorSpeech(quote, 4.5);
      } else if (strike.exploded) {
        strike.fadeTimer -= dt;
        if (strike.fadeTimer <= 0) {
          this.activeStrikes.splice(i, 1);
        }
      }
    }

    // Dymek profesora licznik
    if (this.bubbleTimer > 0) {
      this.bubbleTimer -= dt;
      if (this.bubbleTimer <= 0) {
        this.hideSpeechBubble();
      }
    }

    // Aura lwa (nietykalność)
    if (this.isLionBoosted) {
      this.lionBoostTime -= dt;
      if (this.lionBoostTime <= 0) {
        this.isLionBoosted = false;
      }
    }

    // 1. Aktualizacja Gracza
    let dx = 0;
    let dy = 0;
    if (this.keys.up) dy -= 1;
    if (this.keys.down) dy += 1;
    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;

    const moving = dx !== 0 || dy !== 0;
    this.player.moving = moving;

    if (moving) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      this.player.facingAngle = Math.atan2(dy, dx);
    }

    // Sprint & Stamina
    const wantsSprint = this.keys.sprint && moving;
    const canSprint = wantsSprint && this.stamina > 0;
    const speed = canSprint
      ? (this.isLionBoosted ? this.player.sprintSpeed * 1.25 : this.player.sprintSpeed)
      : (this.isLionBoosted ? this.player.baseSpeed * 1.3 : this.player.baseSpeed);

    if (canSprint) {
      this.stamina = Math.max(0, this.stamina - 26 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 14 * dt);
    }

    // Ruch gracza z kolizją
    if (moving) {
      const nextX = this.player.x + dx * speed;
      const nextY = this.player.y + dy * speed;

      if (!this.checkCollisionWithWalls(nextX, this.player.y, this.player.radius)) {
        this.player.x = nextX;
      }
      if (!this.checkCollisionWithWalls(this.player.x, nextY, this.player.radius)) {
        this.player.y = nextY;
      }
    }

    // 2. Aktualizacja Egzaminatora (Sztuczna Inteligencja)
    this.updateExaminer(dt);

    // 3. Sprawdzanie zbierania przedmiotów (ECTS, Kawa)
    this.updateItems(dt);

    // 4. Interakcja z Pomnikiem Lwa
    this.updateLionStatue(dt);

    // 5. Sprawdzenie warunku wygranej (Dziekanat po zdobyciu 30 ECTS)
    if (this.ects >= this.targetEcts) {
      const gate = this.exitGate;
      if (
        this.player.x > gate.x &&
        this.player.x < gate.x + gate.w &&
        this.player.y > gate.y &&
        this.player.y < gate.y + gate.h
      ) {
        this.triggerVictory();
        return;
      }
    }

    // 6. Cząsteczki
    this.updateParticles(dt);

    // 7. Aktualizacja wskaźników HUD
    this.updateHUD();
  }

  updateExaminer(dt) {
    const ex = this.examiner;
    const p = this.player;

    // Jeśli wykładowca został wysłany do kąta przez artylerię
    if (this.examinerInCorner) {
      this.cornerStunTimer -= dt;
      ex.x = this.designatedCorner.x;
      ex.y = this.designatedCorner.y;
      ex.facingAngle = -Math.PI * 0.75; // Stoi twarzą do narożnika

      if (this.cornerStunTimer <= 0) {
        this.examinerInCorner = false;
        this.showProfessorSpeech('„Koniec kary w kącie! Wracam po Wasze indeksy!”', 3);
      }
      return;
    }

    // Prędkość skaluje się wraz ze zdobytymi punktami ECTS (rośnie napięcie sesji!)
    const speedScale = 1 + (this.ects / this.targetEcts) * 0.45;
    ex.speed = ex.baseSpeed * speedScale;

    // Odległość od gracza
    const distToPlayer = Math.hypot(p.x - ex.x, p.y - ex.y);

    // Losowe okrzyki profesora
    ex.phraseCooldown -= dt;
    if (ex.phraseCooldown <= 0) {
      if (distToPlayer < 240) {
        const randomQuote = this.professorQuotes[Math.floor(Math.random() * this.professorQuotes.length)];
        this.showProfessorSpeech(randomQuote);
        ex.phraseCooldown = 4.5 + Math.random() * 3;
      }
    }

    // Ruch w kierunku gracza lub ucieczka jeśli student ma aurę Lwa
    let targetX = p.x;
    let targetY = p.y;

    if (this.isLionBoosted) {
      // Egzaminator cofa się przed lwem
      targetX = ex.x - (p.x - ex.x);
      targetY = ex.y - (p.y - ex.y);
    }

    const exAngle = Math.atan2(targetY - ex.y, targetX - ex.x);
    ex.facingAngle = exAngle;

    const moveStep = ex.speed;
    const nextExX = ex.x + Math.cos(exAngle) * moveStep;
    const nextExY = ex.y + Math.sin(exAngle) * moveStep;

    if (!this.checkCollisionWithWalls(nextExX, ex.y, ex.radius)) {
      ex.x = nextExX;
    }
    if (!this.checkCollisionWithWalls(ex.x, nextExY, ex.radius)) {
      ex.y = nextExY;
    }

    // Sprawdzenie kolizji z graczem (złapanie na egzamin)
    if (distToPlayer < p.radius + ex.radius) {
      if (!this.isLionBoosted) {
        this.triggerGameOver();
      } else {
        // Odepchnij profesora
        ex.x += Math.cos(exAngle + Math.PI) * 40;
        ex.y += Math.sin(exAngle + Math.PI) * 40;
      }
    }
  }

  updateItems(dt) {
    const p = this.player;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.bobOffset += dt * 3;

      const dist = Math.hypot(p.x - item.x, p.y - item.y);
      if (dist < p.radius + item.radius) {
        // Zebranie przedmiotu
        if (item.type === 'ects') {
          this.ects = Math.min(this.targetEcts, this.ects + item.value);
          if (window.soundManager) window.soundManager.playCollectEcts();
          this.createSparkleParticles(item.x, item.y, '#f59e0b', 12);

          if (this.ects >= this.targetEcts) {
            this.showProfessorSpeech('„Nie wierzę! Zdobył 30 ECTS! Szybko, zablokować Dziekanat!”', 4);
          }
        } else if (item.type === 'coffee') {
          this.stamina = this.maxStamina;
          this.coffeeCount++;
          if (window.soundManager) window.soundManager.playDrinkCoffee();
          this.createSparkleParticles(item.x, item.y, '#38bdf8', 10);
        }

        // Usunięcie zebranego przedmiotu
        this.items.splice(i, 1);
      }
    }

    // Jeśli gracz zebrał wszystkie ECTS, a jeszcze nie ma 30 (bo pojawiły się respawny)
    if (this.items.filter((it) => it.type === 'ects').length < 3 && this.ects < this.targetEcts) {
      // Zrespawnuj dodatkowe materiały do nauki
      const freeX = 80 + Math.random() * (this.width - 160);
      const freeY = 80 + Math.random() * (this.height - 160);
      if (!this.checkCollisionWithWalls(freeX, freeY, 16)) {
        this.items.push({
          id: `ects-respawn-${Date.now()}`,
          type: 'ects',
          x: freeX,
          y: freeY,
          radius: 12,
          value: 2,
          bobOffset: 0,
        });
      }
    }
  }

  updateLionStatue(dt) {
    const lion = this.lionStatue;
    if (!lion.active) {
      lion.respawnTimer -= dt;
      if (lion.respawnTimer <= 0) {
        lion.active = true;
      }
      return;
    }

    const dist = Math.hypot(this.player.x - (lion.x + lion.w / 2), this.player.y - (lion.y + lion.h / 2));
    if (dist < this.player.radius + 24) {
      // Aktywacja aury
      this.isLionBoosted = true;
      this.lionBoostTime = 5.0; // 5 sekund
      lion.active = false;
      lion.respawnTimer = 18.0;

      if (window.soundManager) window.soundManager.playLionRoar();
      this.createSparkleParticles(lion.x + lion.w / 2, lion.y + lion.h / 2, '#fbbf24', 20);
      this.showProfessorSpeech('„Lew Koźmińskiego roztacza aurę akademickiej potęgi!”', 3);
    }
  }

  createSparkleParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
      });
    }
  }

  createPaperParticles(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 4,
        color: '#ffffff',
        life: 0.9 + Math.random() * 0.5,
        maxLife: 1.4,
        isPaper: true,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 8,
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.isPaper) {
        p.angle = (p.angle || 0) + (p.vAngle || 0) * dt;
        p.vy += 35 * dt; // Lekka grawitacja dla opadających kartek egzaminacyjnych
      }
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateHUD() {
    // Licznik ECTS
    this.ectsCounterEl.textContent = this.ects;
    const ectsPercent = Math.min(100, Math.round((this.ects / this.targetEcts) * 100));
    this.ectsProgressBar.style.width = `${ectsPercent}%`;

    // Pasek Staminy
    const staminaRounded = Math.round(this.stamina);
    this.staminaPercentEl.textContent = `${staminaRounded}%`;
    this.staminaProgressBar.style.width = `${staminaRounded}%`;

    if (this.stamina < 25) {
      this.staminaProgressBar.classList.add('stamina-low');
    } else {
      this.staminaProgressBar.classList.remove('stamina-low');
    }

    // Aktualna lokalizacja kampusu na podstawie pozycji gracza
    const px = this.player.x;
    const currentZone = this.zones.find((z) => px >= z.x && px <= z.x + z.w);
    if (currentZone) {
      this.campusStatusEl.textContent = currentZone.name;
    }

    // Aktualizacja stanu przycisku artylerii w HUD
    if (this.btnArtillery && this.artilleryTimerEl) {
      if (this.artilleryCooldown <= 0) {
        this.btnArtillery.classList.add('is-ready');
        this.btnArtillery.classList.remove('is-cooldown');
        this.artilleryTimerEl.textContent = 'GOTOWA (R)';
        this.btnArtillery.title = 'Artyleria gotowa! Kliknij lub naciśnij R, by posłać wykładowcę do kąta na 10 sekund!';
      } else {
        this.btnArtillery.classList.remove('is-ready');
        this.btnArtillery.classList.add('is-cooldown');
        const mins = Math.floor(this.artilleryCooldown / 60);
        const secs = Math.floor(this.artilleryCooldown % 60);
        const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
        this.artilleryTimerEl.textContent = formatted;
        this.btnArtillery.title = `Artyleria w trakcie ładowania (pozostało: ${formatted})`;
      }
    }

    // Aktualizacja przycisku dotykowego artylerii
    if (this.btnTouchArtillery && this.touchArtilleryTextEl) {
      if (this.artilleryCooldown <= 0) {
        this.btnTouchArtillery.classList.add('is-ready');
        this.btnTouchArtillery.classList.remove('is-cooldown');
        this.touchArtilleryTextEl.textContent = 'DO KĄTA!';
      } else {
        this.btnTouchArtillery.classList.remove('is-ready');
        this.btnTouchArtillery.classList.add('is-cooldown');
        const secs = Math.ceil(this.artilleryCooldown);
        this.touchArtilleryTextEl.textContent = `${secs}s`;
      }
    }
  }

  triggerGameOver() {
    this.state = GameState.GAME_OVER;
    if (window.soundManager) window.soundManager.playGameOver();

    // Wypełnij dane podsumowania
    this.gameoverEctsEl.textContent = `${this.ects} / 30`;
    this.gameoverTimeEl.textContent = this.formatTime(this.elapsedSeconds);
    this.gameoverCoffeeEl.textContent = this.coffeeCount;

    const randomDefeat = this.defeatQuotes[Math.floor(Math.random() * this.defeatQuotes.length)];
    this.gameoverQuoteEl.textContent = randomDefeat;

    this.gameoverModal.classList.remove('hidden');
  }

  triggerVictory() {
    this.state = GameState.VICTORY;
    if (window.soundManager) window.soundManager.playVictory();

    this.victoryEctsEl.textContent = `30 / 30 ECTS`;
    this.victoryTimeEl.textContent = this.formatTime(this.elapsedSeconds);

    // Oblicz ocenę w zależności od czasu
    let grade = '5.0 (Bardzo dobry)';
    if (this.elapsedSeconds > 120) grade = '4.5 (Dobry plus)';
    if (this.elapsedSeconds > 180) grade = '4.0 (Dobry)';
    if (this.elapsedSeconds > 240) grade = '3.5 (Dostateczny plus)';
    this.victoryGradeEl.textContent = grade;

    this.victoryModal.classList.remove('hidden');
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // Efekt wstrząsu ekranu (Screen Shake) od artylerii
    if (this.screenShake > 0) {
      const shakeMag = this.screenShake * 10;
      const shakeX = (Math.random() - 0.5) * shakeMag;
      const shakeY = (Math.random() - 0.5) * shakeMag;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Tło Kampusu (3 strefy: Budynek A, Zielone Patio, Budynek D)
    this.renderCampusBackground(ctx);

    // 2. Ściany i przeszkody kampusu
    this.renderWalls(ctx);

    // 3. Statua Lwa Koźmińskiego
    this.renderLionStatue(ctx);

    // 4. Brama wyjściowa / Dziekanat (jeśli 30 ECTS)
    this.renderExitGate(ctx);

    // 5. Przedmioty (ECTS, Kawy)
    this.renderItems(ctx);

    // 6. Cząsteczki
    this.renderParticles(ctx);

    // 7. Egzaminator (Profesor)
    this.renderExaminer(ctx);

    // 8. Student (Gracz)
    this.renderPlayer(ctx);

    // 9. Salwy i fale uderzeniowe artylerii
    this.renderArtilleryStrikes(ctx);

    ctx.restore();

    // 10. Błysk eksplozji
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 11. Komunikat pauzy na canvasie
    if (this.state === GameState.PAUSED) {
      ctx.fillStyle = 'rgba(7, 21, 43, 0.7)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 28px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUZA W GRZE', this.width / 2, this.height / 2 - 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Plus Jakarta Sans, sans-serif';
      ctx.fillText('Naciśnij SPACJĘ lub ikonę pauzy, aby wznowić ucieczkę', this.width / 2, this.height / 2 + 24);
    }
  }

  renderArtilleryStrikes(ctx) {
    this.activeStrikes.forEach((strike) => {
      const tx = strike.targetX;
      const ty = strike.targetY;

      if (!strike.exploded) {
        const p = Math.min(1, strike.progress / strike.duration);

        // Czerwony celownik artyleryjski
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        const radius = 22 + Math.sin(strike.progress * 25) * 4;
        ctx.beginPath();
        ctx.arc(tx, ty, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(tx - 30, ty);
        ctx.lineTo(tx + 30, ty);
        ctx.moveTo(tx, ty - 30);
        ctx.lineTo(tx, ty + 30);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CEL: ARTYLERIA', tx, ty - 32);

        // Nadlatujący pocisk z góry
        const curX = strike.startX + (tx - strike.startX) * p;
        const curY = strike.startY + (ty - strike.startY) * p;

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(curX, curY - 35);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(curX, curY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else {
        // Fala uderzeniowa po uderzeniu
        const fade = Math.max(0, strike.fadeTimer / 0.55);
        const waveRadius = (1 - fade) * 75;

        ctx.save();
        ctx.strokeStyle = `rgba(239, 68, 68, ${fade * 0.8})`;
        ctx.lineWidth = 3 * fade;
        ctx.beginPath();
        ctx.arc(tx, ty, waveRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(245, 158, 11, ${fade * 0.9})`;
        ctx.lineWidth = 2 * fade;
        ctx.beginPath();
        ctx.arc(tx, ty, waveRadius * 0.65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  renderCampusBackground(ctx) {
    // Strefa 1: Budynek A (Hol Główny) - posadzka w szachownicę / kafelki
    ctx.fillStyle = '#101d30';
    ctx.fillRect(0, 0, 260, this.height);

    // Kącik karny / Kąt dla Egzaminatora (Budynek A, lewy górny narożnik)
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(18, 18, 66, 66);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(18, 18, 66, 66);
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 8px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KĄT DLA', 51, 38);
    ctx.fillText('WYKŁADOWCY', 51, 48);
    ctx.restore();

    // Kafelki w Holu A
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 260; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(260, y);
      ctx.stroke();
    }

    // Strefa 2: Zielone Patio ALK - trawnik i drewniane ścieżki
    ctx.fillStyle = '#0a2e1d';
    ctx.fillRect(260, 0, 280, this.height);

    // Ścieżka brukowana na Patio
    ctx.fillStyle = '#133e29';
    ctx.fillRect(360, 0, 80, this.height);
    ctx.fillRect(260, 230, 280, 80);

    // Ozdobne krzewy na patio
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(290, 70, 18, 0, Math.PI * 2);
    ctx.arc(510, 70, 18, 0, Math.PI * 2);
    ctx.arc(290, 470, 18, 0, Math.PI * 2);
    ctx.arc(510, 470, 18, 0, Math.PI * 2);
    ctx.fill();

    // Strefa 3: Budynek D (Biblioteka & Dziekanat) - elegancki ciemnoniebieski parkiet
    ctx.fillStyle = '#0c1a2c';
    ctx.fillRect(540, 0, 260, this.height);

    // Kafelki Dziekanatu
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 540; x < this.width; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    // Napisy stref na posadzce
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUDYNEK A', 130, 50);
    ctx.fillText('ZIELONE PATIO ALK', 400, 50);
    ctx.fillText('DZIEKANAT / AULA', 670, 50);
  }

  renderWalls(ctx) {
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;

    this.walls.forEach((w) => {
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    });
  }

  renderLionStatue(ctx) {
    const lion = this.lionStatue;
    const cx = lion.x + lion.w / 2;
    const cy = lion.y + lion.h / 2;

    // Cokół pomnika
    ctx.fillStyle = '#334155';
    ctx.fillRect(lion.x, lion.y, lion.w, lion.h);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(lion.x, lion.y, lion.w, lion.h);

    if (lion.active) {
      // Złoty Lew z poświatą
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;

      ctx.fillStyle = '#f59e0b';
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🦁', cx, cy - 2);

      ctx.shadowBlur = 0;

      // Etykieta
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
      ctx.fillText('LEW ALK', cx, lion.y + lion.h + 10);
    } else {
      // Uśpiony pomnik
      ctx.fillStyle = '#64748b';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏛️', cx, cy - 2);
    }
  }

  renderExitGate(ctx) {
    const gate = this.exitGate;
    const isOpen = this.ects >= this.targetEcts;

    if (isOpen) {
      // Pulsująca brama sukcesu
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(gate.x, gate.y, gate.w, gate.h);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AULA', gate.x + gate.w / 2, gate.y + 26);
      ctx.fillText('WEJDŹ!', gate.x + gate.w / 2, gate.y + 44);
    } else {
      // Zamknięty dziekanat
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(gate.x, gate.y, gate.w, gate.h);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ZAMKNIĘTE', gate.x + gate.w / 2, gate.y + 32);
      ctx.fillText('(30 ECTS)', gate.x + gate.w / 2, gate.y + 45);
    }
  }

  renderItems(ctx) {
    this.items.forEach((item) => {
      const bob = Math.sin(item.bobOffset) * 3;

      if (item.type === 'ects') {
        // Punkt ECTS - Certyfikat / Książka
        ctx.save();
        ctx.translate(item.x, item.y + bob);

        // Blask
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Ikona księgi / indeksu
        ctx.fillStyle = '#f59e0b';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎓', 0, 0);

        // Liczba ECTS
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Space Mono, monospace';
        ctx.fillText(`+${item.value}`, 0, 14);

        ctx.restore();
      } else if (item.type === 'coffee') {
        // Kawa z kawiarni ALK
        ctx.save();
        ctx.translate(item.x, item.y + bob);

        // Blask
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '17px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☕', 0, 0);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 8px Plus Jakarta Sans, sans-serif';
        ctx.fillText('KAWA', 0, 13);

        ctx.restore();
      }
    });
  }

  renderPlayer(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Tarcza Lwa jeśli aktywna
    if (this.isLionBoosted) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.fill();
    }

    // Ciało studenta (bluza ALK)
    ctx.rotate(p.facingAngle);

    // Plecak
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-p.radius - 2, -6, 6, 12);

    // Kaptur / Bluza
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Głowa
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(3, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Czapka z daszkiem studenta
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.arc(4, 0, 6, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.restore();
  }

  renderExaminer(ctx) {
    const ex = this.examiner;
    ctx.save();
    ctx.translate(ex.x, ex.y);

    // Gdy wykładowca stoi w kącie ukarany przez artylerię
    if (this.examinerInCorner) {
      // Aura stania w kącie
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, ex.radius + 12, 0, Math.PI * 2);
      ctx.fill();

      // Ciało profesora odwrócone twarzą do ściany
      ctx.save();
      ctx.rotate(ex.facingAngle);

      // Garnitur profesora
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, ex.radius, 0, Math.PI * 2);
      ctx.fill();

      // Teczka z dokumentami
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-ex.radius - 3, -7, 6, 14);

      // Koszula i krawat
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -4, 5, 8);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, -2, 4, 4);

      // Głowa profesora
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(4, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Animowane wirujące gwiazdki / oszołomienie
      const dizzyAngle = performance.now() * 0.005;
      const dX = Math.cos(dizzyAngle) * 12;
      const dY = Math.sin(dizzyAngle) * 5 - 20;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💫', dX, dY);

      // Etykieta stania w kącie z odliczaniem czasu
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-42, 22, 84, 18, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`W KĄCIE: ${Math.ceil(this.cornerStunTimer)}s`, 0, 31);

      ctx.restore();
      return;
    }

    ctx.rotate(ex.facingAngle);

    // Aura zagrożenia / egzaminatora
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, ex.radius + 8, 0, Math.PI * 2);
    ctx.fill();

    // Garnitur profesora
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, ex.radius, 0, Math.PI * 2);
    ctx.fill();

    // Teczka z dokumentami / protokołem
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-ex.radius - 3, -7, 6, 14);

    // Koszula i krawat
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -4, 5, 8);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, -2, 4, 4);

    // Głowa profesora z okularami
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(4, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Okulary
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, -4, 4, 3);
    ctx.strokeRect(6, 1, 4, 3);

    ctx.restore();
  }

  renderParticles(ctx) {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      if (p.isPaper) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-p.size, -p.size * 0.7, p.size * 2, p.size * 1.4);
        ctx.strokeStyle = 'rgba(0, 34, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-p.size, -p.size * 0.7, p.size * 2, p.size * 1.4);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  gameLoop(currentTime) {
    const dt = Math.min(0.06, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

// Inicjalizacja gry po załadowaniu drzewa DOM
function initKozminskiGame() {
  if (!window.kozminskiGame) {
    window.kozminskiGame = new KozminskiEscapeGame();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initKozminskiGame);
} else {
  initKozminskiGame();
}
