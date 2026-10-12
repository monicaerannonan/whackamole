/**
 * script.js - Whack-a-Mole Application Bootstrap & UI Controller
 * Integrates game engine, Web Audio SFX, storage, particles, and custom hammer interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. DOM REFERENCES
    // =========================================================================
    const hammer = document.getElementById('custom-hammer');
    const arcadeStage = document.querySelector('.arcade-stage');
    const gridContainer = document.getElementById('grid-container');

    // HUD Elements
    const scoreVal = document.getElementById('score-val');
    const timerVal = document.getElementById('timer-val');
    const timerCard = document.getElementById('hud-timer-card');
    const timerProgressBar = document.getElementById('timer-progress-bar');
    const comboVal = document.getElementById('combo-val');
    const comboCard = document.getElementById('hud-combo-card');
    const highScoreVal = document.getElementById('high-score-val');
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const soundIcon = document.getElementById('sound-icon');
    const btnPauseToggle = document.getElementById('btn-pause-toggle');

    // Modals
    const overlayStart = document.getElementById('overlay-start');
    const overlayPause = document.getElementById('overlay-pause');
    const overlayGameOver = document.getElementById('overlay-game-over');

    // Start Screen Controls
    const btnStartGame = document.getElementById('btn-start-game');
    const durationPills = document.querySelectorAll('#group-duration .pill-btn');
    const difficultyPills = document.querySelectorAll('#group-difficulty .pill-btn');

    // Pause Screen Controls
    const btnResumeGame = document.getElementById('btn-resume-game');
    const btnRestartFromPause = document.getElementById('btn-restart-from-pause');
    const btnMenuFromPause = document.getElementById('btn-menu-from-pause');

    // Game Over Controls & Stats
    const btnPlayAgain = document.getElementById('btn-play-again');
    const btnMenuFromGameOver = document.getElementById('btn-menu-from-gameover');
    const finalScoreVal = document.getElementById('final-score-val');
    const statWhacks = document.getElementById('stat-whacks');
    const statMisses = document.getElementById('stat-misses');
    const statAccuracy = document.getElementById('stat-accuracy');
    const statCombo = document.getElementById('stat-combo');
    const newHighBadge = document.getElementById('new-high-badge');

    // =========================================================================
    // 2. SVG MOLE TEMPLATES GENERATOR
    // =========================================================================
    /**
     * Injects detailed cartoon SVG artwork for Normal, Gold, and Bomb moles.
     * Each SVG has separate paths for normal and whacked expressions.
     */
    function generateMoleSvg() {
        return `
            <svg viewBox="0 0 120 120" class="mole-svg">
                <defs>
                    <!-- Body Gradients -->
                    <linearGradient id="moleBrownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#a16207" />
                        <stop offset="100%" stop-color="#713f12" />
                    </linearGradient>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fef08a" />
                        <stop offset="50%" stop-color="#fbbf24" />
                        <stop offset="100%" stop-color="#d97706" />
                    </linearGradient>
                    <linearGradient id="bombGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#475569" />
                        <stop offset="100%" stop-color="#0f172a" />
                    </linearGradient>
                </defs>

                <!-- Dazed Orbiting Stars (Visible on Hit) -->
                <g class="stars-dazed">
                    <polygon points="50,12 53,20 62,20 55,25 58,33 50,28 42,33 45,25 38,20 47,20" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
                    <polygon points="80,18 82,24 88,24 83,28 85,34 80,30 75,34 77,28 72,24 78,24" fill="#fde047" stroke="#ca8a04" stroke-width="1"/>
                </g>

                <!-- Mole Rounded Ears -->
                <ellipse cx="28" cy="38" rx="10" ry="12" fill="#713f12" />
                <ellipse cx="28" cy="38" rx="6" ry="8" fill="#fda4af" />
                <ellipse cx="92" cy="38" rx="10" ry="12" fill="#713f12" />
                <ellipse cx="92" cy="38" rx="6" ry="8" fill="#fda4af" />

                <!-- Mole Main Body / Head -->
                <path d="M 24 110 C 20 50, 40 26, 60 26 C 80 26, 100 50, 96 110 Z" fill="url(#moleBrownGrad)" stroke="#451a03" stroke-width="3" class="mole-body-path"/>

                <!-- Construction Hard Hat for Normal Mole -->
                <g class="hat-normal">
                    <path d="M 32 38 Q 60 20 88 38 L 92 42 Q 60 30 28 42 Z" fill="#eab308" stroke="#854d0e" stroke-width="2"/>
                    <rect x="42" y="24" width="36" height="12" rx="4" fill="#facc15" stroke="#854d0e" stroke-width="1.5"/>
                </g>

                <!-- Golden Crown for Gold Mole (Hidden by default, shown via CSS) -->
                <g class="crown-gold" style="display: none;">
                    <polygon points="34,36 44,14 60,26 76,14 86,36" fill="url(#goldGrad)" stroke="#b45309" stroke-width="2"/>
                    <circle cx="44" cy="14" r="3" fill="#ef4444" />
                    <circle cx="60" cy="26" r="3" fill="#3b82f6" />
                    <circle cx="76" cy="14" r="3" fill="#ef4444" />
                </g>

                <!-- Bomb Fuse & Spark for Bomb Mole (Hidden by default) -->
                <g class="bomb-fuse" style="display: none;">
                    <path d="M 60 26 Q 66 10 78 12" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
                    <polygon points="78,12 84,10 82,16 88,18 80,18" fill="#f97316"/>
                </g>

                <!-- Normal Eyes -->
                <g class="eyes-normal">
                    <ellipse cx="44" cy="54" rx="6" ry="8" fill="#0f172a" />
                    <circle cx="42" cy="51" r="2.5" fill="#ffffff" />
                    <ellipse cx="76" cy="54" rx="6" ry="8" fill="#0f172a" />
                    <circle cx="74" cy="51" r="2.5" fill="#ffffff" />
                </g>

                <!-- Whacked Spiral / Cross Eyes -->
                <g class="eyes-whacked">
                    <!-- Left X eye -->
                    <line x1="39" y1="49" x2="49" y2="59" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
                    <line x1="49" y1="49" x2="39" y2="59" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
                    <!-- Right X eye -->
                    <line x1="71" y1="49" x2="81" y2="59" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
                    <line x1="81" y1="49" x2="71" y2="59" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
                </g>

                <!-- Rosy Cheek Blushes -->
                <circle cx="34" cy="65" r="5" fill="#fb7185" opacity="0.6"/>
                <circle cx="86" cy="65" r="5" fill="#fb7185" opacity="0.6"/>

                <!-- Snout Area -->
                <ellipse cx="60" cy="68" rx="16" ry="11" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
                <!-- Nose -->
                <ellipse cx="60" cy="64" rx="8" ry="5.5" fill="#e11d48"/>
                <ellipse cx="58" cy="63" rx="2" ry="1.2" fill="#ffffff" opacity="0.7"/>

                <!-- Whiskers -->
                <line x1="26" y1="67" x2="42" y2="69" stroke="#451a03" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="25" y1="73" x2="42" y2="72" stroke="#451a03" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="78" y1="69" x2="94" y2="67" stroke="#451a03" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="78" y1="72" x2="95" y2="73" stroke="#451a03" stroke-width="1.5" stroke-linecap="round"/>

                <!-- Normal Mouth -->
                <g class="mouth-normal">
                    <path d="M 54 73 Q 60 78 66 73" fill="none" stroke="#451a03" stroke-width="2" stroke-linecap="round"/>
                </g>

                <!-- Whacked Mouth (Ouch O) -->
                <g class="mouth-whacked">
                    <ellipse cx="60" cy="74" rx="4" ry="5.5" fill="#881337" stroke="#451a03" stroke-width="1.5"/>
                </g>

                <!-- Cute Paws Peeking over hole rim -->
                <g class="mole-paws">
                    <path d="M 28 92 C 26 84, 42 84, 40 92 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
                    <path d="M 80 92 C 78 84, 94 84, 92 92 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
                </g>
            </svg>
        `;
    }

    // Populate all 9 mole elements with the SVG artwork
    for (let i = 0; i < 9; i++) {
        const moleEl = document.getElementById(`mole-${i}`);
        if (moleEl) {
            moleEl.innerHTML = generateMoleSvg();
        }
    }

    // =========================================================================
    // 3. SETTINGS & LOCALSTORAGE INITIALIZATION
    // =========================================================================
    const initialSettings = window.storageManager.getSettings();
    let selectedDuration = initialSettings.duration || 30;
    let selectedDifficulty = initialSettings.difficulty || 'normal';

    // Apply stored sound preference
    window.soundController.setMuted(initialSettings.isMuted);
    updateSoundButtonUI(initialSettings.isMuted);

    // Update High Score Display for initial difficulty
    updateHighScoreDisplay(selectedDifficulty);

    // Reflect saved settings onto UI pills
    durationPills.forEach(pill => {
        const d = parseInt(pill.dataset.duration, 10);
        pill.classList.toggle('active', d === selectedDuration);
    });
    difficultyPills.forEach(pill => {
        pill.classList.toggle('active', pill.dataset.difficulty === selectedDifficulty);
    });

    function updateHighScoreDisplay(diff) {
        const high = window.storageManager.getHighScore(diff);
        highScoreVal.textContent = high;
    }

    function updateSoundButtonUI(isMuted) {
        soundIcon.textContent = isMuted ? '🔇' : '🔊';
        btnSoundToggle.title = isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)';
    }

    // =========================================================================
    // 4. CUSTOM HAMMER CURSOR TRACKING
    // =========================================================================
    let isTouchDevice = false;

    window.addEventListener('touchstart', () => {
        isTouchDevice = true;
        if (hammer) hammer.style.display = 'none';
    }, { once: true, passive: true });

    window.addEventListener('mousemove', (e) => {
        if (isTouchDevice || !hammer) return;
        hammer.classList.add('active');
        hammer.style.left = `${e.clientX}px`;
        hammer.style.top = `${e.clientY}px`;
    });

    window.addEventListener('mousedown', () => {
        if (isTouchDevice || !hammer) return;
        hammer.classList.add('swing');
    });

    window.addEventListener('mouseup', () => {
        if (isTouchDevice || !hammer) return;
        hammer.classList.remove('swing');
    });

    // =========================================================================
    // 5. GAME ENGINE INSTANTIATION & EVENT CALLBACKS
    // =========================================================================
    const game = new window.WhackAMoleGame();

    // Score Update Callback
    game.onScoreUpdate = (currentScore, delta) => {
        scoreVal.textContent = currentScore;
        scoreVal.classList.remove('pop');
        void scoreVal.offsetWidth;
        scoreVal.classList.add('pop');
    };

    // Timer Countdown Callback
    game.onTimerTick = (timeRemaining, totalDuration) => {
        timerVal.textContent = timeRemaining;
        const pct = Math.max(0, (timeRemaining / totalDuration) * 100);
        timerProgressBar.style.width = `${pct}%`;

        // Urgent warning state when <= 8 seconds remain
        if (timeRemaining <= 8 && timeRemaining > 0) {
            timerCard.classList.add('urgent');
            window.soundController.playTick();
        } else {
            timerCard.classList.remove('urgent');
        }
    };

    // Mole Spawn Callback
    game.onMoleSpawn = (holeIndex, type) => {
        const moleEl = document.getElementById(`mole-${holeIndex}`);
        if (!moleEl) return;

        // Reset classes
        moleEl.className = 'mole up';
        moleEl.classList.add(`type-${type}`);

        // Toggle SVG type-specific elements
        const hatNormal = moleEl.querySelector('.hat-normal');
        const crownGold = moleEl.querySelector('.crown-gold');
        const bombFuse = moleEl.querySelector('.bomb-fuse');
        const bodyPath = moleEl.querySelector('.mole-body-path');

        if (hatNormal) hatNormal.style.display = (type === 'normal') ? 'block' : 'none';
        if (crownGold) crownGold.style.display = (type === 'gold') ? 'block' : 'none';
        if (bombFuse) bombFuse.style.display = (type === 'bomb') ? 'block' : 'none';

        if (bodyPath) {
            if (type === 'gold') bodyPath.setAttribute('fill', 'url(#goldGrad)');
            else if (type === 'bomb') bodyPath.setAttribute('fill', 'url(#bombGrad)');
            else bodyPath.setAttribute('fill', 'url(#moleBrownGrad)');
        }

        window.soundController.playPop();
    };

    // Mole Retract Callback
    game.onMoleRetract = (holeIndex) => {
        const moleEl = document.getElementById(`mole-${holeIndex}`);
        if (!moleEl) return;
        moleEl.classList.remove('up');
        moleEl.classList.remove('hit');
    };

    // Mole Hit / Whack Callback
    game.onMoleHit = ({ holeIndex, type, points, combo, comboMultiplier, event }) => {
        const moleEl = document.getElementById(`mole-${holeIndex}`);
        if (moleEl) {
            moleEl.classList.add('hit');
        }

        // Get coordinates for particles & floating score
        let clientX = window.innerWidth / 2;
        let clientY = window.innerHeight / 2;
        if (event) {
            clientX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : clientX);
            clientY = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : clientY);
        } else if (moleEl) {
            const rect = moleEl.getBoundingClientRect();
            clientX = rect.left + rect.width / 2;
            clientY = rect.top + rect.height / 2;
        }

        // Trigger appropriate SFX and particle visuals
        if (type === 'normal') {
            window.soundController.playWhack();
            window.particleEngine.burst(clientX, clientY, 'normal');
            const bonusText = comboMultiplier > 1 ? `+${points} (${comboMultiplier}x!)` : `+${points}`;
            window.particleEngine.showFloatingText(clientX, clientY, bonusText, 'text-whack');
            window.particleEngine.shake(arcadeStage, 'light');
        } else if (type === 'gold') {
            window.soundController.playGoldenWhack();
            window.particleEngine.burst(clientX, clientY, 'gold');
            window.particleEngine.showFloatingText(clientX, clientY, `GOLD! +${points}`, 'text-gold');
            window.particleEngine.shake(arcadeStage, 'medium');
        } else if (type === 'bomb') {
            window.soundController.playBombWhack();
            window.particleEngine.burst(clientX, clientY, 'bomb');
            window.particleEngine.showFloatingText(clientX, clientY, `BOOM! ${points}`, 'text-bomb');
            window.particleEngine.shake(arcadeStage, 'medium');
        }
    };

    // Hole Miss Callback
    game.onHoleMiss = ({ holeIndex, penalty, event }) => {
        window.soundController.playMiss();

        let clientX = window.innerWidth / 2;
        let clientY = window.innerHeight / 2;
        if (event) {
            clientX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : clientX);
            clientY = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : clientY);
        }

        window.particleEngine.burst(clientX, clientY, 'miss');
        window.particleEngine.showFloatingText(clientX, clientY, `MISS ${penalty}`, 'text-miss');
    };

    // Combo Change Callback
    game.onComboChange = (combo) => {
        comboVal.textContent = `${combo}x`;
        if (combo >= 3) {
            comboCard.classList.add('combo-active');
            window.soundController.playCombo(combo);
        } else {
            comboCard.classList.remove('combo-active');
        }
    };

    // Game Over Callback
    game.onGameOver = (summary) => {
        const isNewRecord = window.storageManager.updateHighScore(summary.difficulty, summary.score);
        window.storageManager.recordStats(summary.totalWhacks, summary.maxCombo);

        // Update High Score Card
        updateHighScoreDisplay(summary.difficulty);

        // Populate Game Over Modal
        finalScoreVal.textContent = summary.score;
        statWhacks.textContent = summary.totalWhacks;
        statMisses.textContent = summary.totalMisses;
        statAccuracy.textContent = `${summary.accuracy}%`;
        statCombo.textContent = `${summary.maxCombo}x`;

        if (isNewRecord && summary.score > 0) {
            newHighBadge.classList.remove('hidden');
            window.soundController.playGameOver(true);
            window.particleEngine.celebrateConfetti();
        } else {
            newHighBadge.classList.add('hidden');
            window.soundController.playGameOver(false);
        }

        // Show Game Over Overlay
        switchModal('gameover');
    };

    // State Change Callback
    game.onStateChange = (state) => {
        if (state === 'IDLE') {
            switchModal('start');
        } else if (state === 'PAUSED') {
            switchModal('pause');
        } else if (state === 'PLAYING') {
            switchModal('none');
        }
    };

    // Modal Switcher Helper
    function switchModal(modalName) {
        overlayStart.classList.toggle('active', modalName === 'start');
        overlayPause.classList.toggle('active', modalName === 'pause');
        overlayGameOver.classList.toggle('active', modalName === 'gameover');
    }

    // =========================================================================
    // 6. GRID CLICK & TAP EVENT LISTENERS
    // =========================================================================
    // Attach click and touch pointer handlers to all 9 hole wrappers
    const holeWrappers = document.querySelectorAll('.hole-wrapper');
    holeWrappers.forEach(wrapper => {
        const holeIndex = parseInt(wrapper.dataset.index, 10);

        wrapper.addEventListener('pointerdown', (e) => {
            window.soundController.ensureContext();
            if (game.state !== 'PLAYING') return;

            const hole = game.holeStates[holeIndex];
            if (hole.active && !hole.isWhacked) {
                // Mole is currently active: whack it!
                game.whack(holeIndex, e);
            } else if (!hole.active) {
                // Hole is empty: trigger miss penalty
                game.miss(holeIndex, e);
            }
        });
    });

    // =========================================================================
    // 7. USER CONTROLS & UI EVENT LISTENERS
    // =========================================================================

    // Start Game Button
    btnStartGame.addEventListener('click', () => {
        window.soundController.init();
        window.soundController.playClick();
        game.start({
            duration: selectedDuration,
            difficulty: selectedDifficulty
        });
    });

    // Duration Selector Pills
    durationPills.forEach(pill => {
        pill.addEventListener('click', () => {
            window.soundController.playClick();
            durationPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedDuration = parseInt(pill.dataset.duration, 10);
            window.storageManager.saveSettings({ duration: selectedDuration });
        });
    });

    // Difficulty Selector Pills
    difficultyPills.forEach(pill => {
        pill.addEventListener('click', () => {
            window.soundController.playClick();
            difficultyPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedDifficulty = pill.dataset.difficulty;
            window.storageManager.saveSettings({ difficulty: selectedDifficulty });
            updateHighScoreDisplay(selectedDifficulty);
        });
    });

    // Pause / Resume Toggle
    btnPauseToggle.addEventListener('click', () => {
        window.soundController.playClick();
        if (game.state === 'PLAYING') {
            game.pause();
        } else if (game.state === 'PAUSED') {
            game.resume();
        }
    });

    btnResumeGame.addEventListener('click', () => {
        window.soundController.playClick();
        game.resume();
    });

    btnRestartFromPause.addEventListener('click', () => {
        window.soundController.playClick();
        game.start({
            duration: selectedDuration,
            difficulty: selectedDifficulty
        });
    });

    btnMenuFromPause.addEventListener('click', () => {
        window.soundController.playClick();
        game.stop();
    });

    // Play Again Button (from Game Over screen)
    btnPlayAgain.addEventListener('click', () => {
        window.soundController.playClick();
        game.start({
            duration: selectedDuration,
            difficulty: selectedDifficulty
        });
    });

    btnMenuFromGameOver.addEventListener('click', () => {
        window.soundController.playClick();
        game.stop();
    });

    // Sound Mute Toggle
    btnSoundToggle.addEventListener('click', () => {
        const isMuted = window.soundController.toggleMute();
        updateSoundButtonUI(isMuted);
        window.storageManager.saveSettings({ isMuted });
        if (!isMuted) {
            window.soundController.playClick();
        }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        // Toggle Mute with 'M'
        if (e.key === 'm' || e.key === 'M') {
            const isMuted = window.soundController.toggleMute();
            updateSoundButtonUI(isMuted);
            window.storageManager.saveSettings({ isMuted });
            return;
        }

        // Pause/Resume with 'Escape' or Spacebar
        if (e.key === 'Escape' || e.key === ' ') {
            if (game.state === 'PLAYING') {
                e.preventDefault();
                game.pause();
            } else if (game.state === 'PAUSED') {
                e.preventDefault();
                game.resume();
            }
            return;
        }

        // Enter to start when on Start Screen or Game Over
        if (e.key === 'Enter') {
            if (game.state === 'IDLE' || game.state === 'GAME_OVER') {
                window.soundController.init();
                game.start({
                    duration: selectedDuration,
                    difficulty: selectedDifficulty
                });
            }
        }
    });
});
