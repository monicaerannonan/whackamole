/**
 * game.js - Core Game Engine & State Management
 * Handles the 3x3 mole grid state, random spawn scheduling, difficulty scaling,
 * timer countdown, combo multipliers, hit/miss detection, and game lifecycle.
 */

class WhackAMoleGame {
    constructor() {
        // Core state
        this.state = 'IDLE'; // 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
        this.score = 0;
        this.timeRemaining = 30;
        this.totalDuration = 30;
        this.difficulty = 'normal';
        this.combo = 0;
        this.maxCombo = 0;
        this.whacksCount = 0;
        this.missesCount = 0;

        // Grid tracking (9 holes: 0 to 8)
        this.totalHoles = 9;
        this.holeStates = Array(this.totalHoles).fill(null).map(() => ({
            active: false,
            type: 'normal',   // 'normal' | 'gold' | 'bomb'
            timeoutId: null,
            isWhacked: false
        }));

        // Timers & intervals
        this.gameTimerInterval = null;
        this.spawnTimerTimeout = null;

        // Difficulty profiles
        this.difficultyPresets = {
            casual: {
                baseStayTime: 1250,
                minStayTime: 800,
                baseInterval: 1100,
                minInterval: 750,
                goldChance: 0.12,
                bombChance: 0.05,
                multiMoleChance: 0.05
            },
            normal: {
                baseStayTime: 950,
                minStayTime: 520,
                baseInterval: 850,
                minInterval: 500,
                goldChance: 0.16,
                bombChance: 0.12,
                multiMoleChance: 0.20
            },
            insane: {
                baseStayTime: 700,
                minStayTime: 360,
                baseInterval: 620,
                minInterval: 380,
                goldChance: 0.20,
                bombChance: 0.20,
                multiMoleChance: 0.35
            }
        };

        // Event callbacks for UI binding
        this.onScoreUpdate = null;
        this.onTimerTick = null;
        this.onMoleSpawn = null;
        this.onMoleRetract = null;
        this.onMoleHit = null;
        this.onHoleMiss = null;
        this.onComboChange = null;
        this.onStateChange = null;
        this.onGameOver = null;
    }

    /**
     * Prepares and starts a new game round.
     * @param {Object} options - { duration: 30, difficulty: 'normal' }
     */
    start(options = {}) {
        this.cleanupTimers();

        this.totalDuration = options.duration || 30;
        this.timeRemaining = this.totalDuration;
        this.difficulty = options.difficulty || 'normal';

        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.whacksCount = 0;
        this.missesCount = 0;

        // Reset holes
        this.holeStates.forEach(h => {
            h.active = false;
            h.type = 'normal';
            h.isWhacked = false;
            if (h.timeoutId) clearTimeout(h.timeoutId);
            h.timeoutId = null;
        });

        this.state = 'PLAYING';
        if (this.onStateChange) this.onStateChange(this.state);
        if (this.onScoreUpdate) this.onScoreUpdate(this.score, 0);
        if (this.onTimerTick) this.onTimerTick(this.timeRemaining, this.totalDuration);
        if (this.onComboChange) this.onComboChange(this.combo);

        // Start countdown clock
        this.startCountdown();

        // Kick off mole spawn loop with initial delay
        this.scheduleNextSpawn(400);
    }

    /**
     * Pauses the game if currently playing.
     */
    pause() {
        if (this.state !== 'PLAYING') return;

        this.state = 'PAUSED';
        this.cleanupTimers();

        if (this.onStateChange) this.onStateChange(this.state);
    }

    /**
     * Resumes the game from pause state.
     */
    resume() {
        if (this.state !== 'PAUSED') return;

        this.state = 'PLAYING';
        if (this.onStateChange) this.onStateChange(this.state);

        this.startCountdown();
        this.scheduleNextSpawn(500);
    }

    /**
     * Force stops the game immediately.
     */
    stop() {
        this.cleanupTimers();
        this.state = 'IDLE';
        this.retractAllMoles();
        if (this.onStateChange) this.onStateChange(this.state);
    }

    /**
     * Clears all running intervals and timeouts.
     */
    cleanupTimers() {
        if (this.gameTimerInterval) {
            clearInterval(this.gameTimerInterval);
            this.gameTimerInterval = null;
        }
        if (this.spawnTimerTimeout) {
            clearTimeout(this.spawnTimerTimeout);
            this.spawnTimerTimeout = null;
        }
        this.holeStates.forEach(h => {
            if (h.timeoutId) {
                clearTimeout(h.timeoutId);
                h.timeoutId = null;
            }
        });
    }

    /**
     * Retracts all active moles without penalties.
     */
    retractAllMoles() {
        this.holeStates.forEach((h, idx) => {
            if (h.active) {
                h.active = false;
                if (this.onMoleRetract) this.onMoleRetract(idx);
            }
        });
    }

    /**
     * Handles round clock countdown every 1 second.
     */
    startCountdown() {
        this.gameTimerInterval = setInterval(() => {
            this.timeRemaining--;

            if (this.onTimerTick) {
                this.onTimerTick(this.timeRemaining, this.totalDuration);
            }

            if (this.timeRemaining <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    /**
     * Calculates dynamically scaled durations based on chosen difficulty and current score.
     */
    calculateDurations() {
        const preset = this.difficultyPresets[this.difficulty] || this.difficultyPresets.normal;
        
        // As score climbs, moles stay up for shorter time and appear faster
        const scoreFactor = Math.min(this.score * 4, 380);

        const stayTime = Math.max(preset.minStayTime, preset.baseStayTime - scoreFactor);
        const spawnDelay = Math.max(preset.minInterval, preset.baseInterval - scoreFactor * 0.7);

        return { stayTime, spawnDelay, preset };
    }

    /**
     * Schedules the next mole spawn loop iteration.
     */
    scheduleNextSpawn(delay) {
        if (this.state !== 'PLAYING') return;

        this.spawnTimerTimeout = setTimeout(() => {
            if (this.state !== 'PLAYING') return;

            this.spawnMoles();

            const { spawnDelay } = this.calculateDurations();
            this.scheduleNextSpawn(spawnDelay);
        }, delay);
    }

    /**
     * Spawns one or occasionally two moles in unoccupied holes.
     */
    spawnMoles() {
        const { stayTime, preset } = this.calculateDurations();

        // Get list of available (empty) hole indices
        const availableIndices = [];
        for (let i = 0; i < this.totalHoles; i++) {
            if (!this.holeStates[i].active) {
                availableIndices.push(i);
            }
        }

        if (availableIndices.length === 0) return;

        // Determine how many moles to spawn (1 or 2 if multi-mole triggered)
        const spawnCount = (Math.random() < preset.multiMoleChance && availableIndices.length >= 2) ? 2 : 1;

        for (let s = 0; s < spawnCount; s++) {
            if (availableIndices.length === 0) break;

            const randomIdx = Math.floor(Math.random() * availableIndices.length);
            const holeIndex = availableIndices.splice(randomIdx, 1)[0];

            // Decide mole type (gold, bomb, or normal)
            const roll = Math.random();
            let type = 'normal';
            if (roll < preset.goldChance) {
                type = 'gold';
            } else if (roll < preset.goldChance + preset.bombChance) {
                type = 'bomb';
            }

            this.activateMole(holeIndex, type, stayTime);
        }
    }

    /**
     * Pops up a mole at the specified hole index.
     */
    activateMole(holeIndex, type, stayDuration) {
        const hole = this.holeStates[holeIndex];
        hole.active = true;
        hole.type = type;
        hole.isWhacked = false;

        if (this.onMoleSpawn) {
            this.onMoleSpawn(holeIndex, type);
        }

        // Set automatic retraction timeout if player doesn't whack it
        hole.timeoutId = setTimeout(() => {
            if (hole.active && !hole.isWhacked) {
                this.retractMole(holeIndex);
            }
        }, stayDuration);
    }

    /**
     * Retracts an unwhacked mole naturally.
     */
    retractMole(holeIndex) {
        const hole = this.holeStates[holeIndex];
        if (!hole.active) return;

        hole.active = false;
        hole.type = 'normal';
        hole.isWhacked = false;
        if (hole.timeoutId) {
            clearTimeout(hole.timeoutId);
            hole.timeoutId = null;
        }

        if (this.onMoleRetract) {
            this.onMoleRetract(holeIndex);
        }
    }

    /**
     * Called when a player clicks or taps on a mole.
     * @param {number} holeIndex 
     * @param {MouseEvent|TouchEvent} event 
     * @returns {Object} hit result details
     */
    whack(holeIndex, event) {
        if (this.state !== 'PLAYING') return null;

        const hole = this.holeStates[holeIndex];
        if (!hole.active || hole.isWhacked) return null;

        hole.isWhacked = true;
        if (hole.timeoutId) {
            clearTimeout(hole.timeoutId);
            hole.timeoutId = null;
        }

        const type = hole.type;
        let points = 0;
        let comboMultiplier = 1;

        if (type === 'normal') {
            this.whacksCount++;
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            // Combo multiplier tier
            if (this.combo >= 8) comboMultiplier = 3;
            else if (this.combo >= 5) comboMultiplier = 2;
            else if (this.combo >= 3) comboMultiplier = 1.5;

            points = Math.round(10 * comboMultiplier);
            this.score += points;
        } else if (type === 'gold') {
            this.whacksCount++;
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            if (this.combo >= 8) comboMultiplier = 3;
            else if (this.combo >= 5) comboMultiplier = 2;
            else if (this.combo >= 3) comboMultiplier = 1.5;

            points = Math.round(30 * comboMultiplier);
            this.score += points;
        } else if (type === 'bomb') {
            // Hazard mole: penalty and combo breaker
            this.combo = 0;
            points = -10;
            this.score = Math.max(0, this.score + points);
        }

        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score, points);
        }
        if (this.onComboChange) {
            this.onComboChange(this.combo);
        }

        const hitResult = {
            holeIndex,
            type,
            points,
            combo: this.combo,
            comboMultiplier,
            event
        };

        if (this.onMoleHit) {
            this.onMoleHit(hitResult);
        }

        // Delay retraction slightly so the whacked animation renders clearly
        setTimeout(() => {
            hole.active = false;
            hole.isWhacked = false;
            if (this.onMoleRetract) {
                this.onMoleRetract(holeIndex);
            }
        }, 300);

        return hitResult;
    }

    /**
     * Called when a player clicks on a hole that has NO active mole.
     * @param {number} holeIndex 
     * @param {MouseEvent|TouchEvent} event 
     */
    miss(holeIndex, event) {
        if (this.state !== 'PLAYING') return;

        const hole = this.holeStates[holeIndex];
        // If hole currently has an active mole, it's not an empty miss
        if (hole.active) return;

        this.missesCount++;
        const prevCombo = this.combo;
        this.combo = 0; // Combo reset on miss

        const penalty = -2;
        this.score = Math.max(0, this.score + penalty);

        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score, penalty);
        }
        if (prevCombo > 0 && this.onComboChange) {
            this.onComboChange(0);
        }

        if (this.onHoleMiss) {
            this.onHoleMiss({
                holeIndex,
                penalty,
                event
            });
        }
    }

    /**
     * Terminates round and emits final statistics.
     */
    endGame() {
        this.cleanupTimers();
        this.retractAllMoles();
        this.state = 'GAME_OVER';

        const totalAttempts = this.whacksCount + this.missesCount;
        const accuracy = totalAttempts > 0 
            ? Math.round((this.whacksCount / totalAttempts) * 100) 
            : 0;

        const summary = {
            score: this.score,
            difficulty: this.difficulty,
            totalWhacks: this.whacksCount,
            totalMisses: this.missesCount,
            accuracy: accuracy,
            maxCombo: this.maxCombo
        };

        if (this.onStateChange) this.onStateChange(this.state);
        if (this.onGameOver) this.onGameOver(summary);
    }
}

// Export instance
window.WhackAMoleGame = WhackAMoleGame;
