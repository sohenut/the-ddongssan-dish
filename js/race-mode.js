import { DOM } from './config.js';
import { displayResult } from './ui.js';

let racers = [];
let lanesData = []; // 각 레인의 장애물 정보를 담을 배열
let raceInterval;
let raceTickCounter = 0;

// --- 게임 밸런스 상수 정의 ---
const STAT_TOTAL_POINTS = 10;
const START_LINE_PERCENT = 5;
const FINISH_LINE_PERCENT = 95;
const HORSE_WIDTH_PX = 35;
const LANE_HEIGHT = 45;

// 각 스탯의 영향력을 조절하는 계수
const STRENGTH_START_BONUS = 1.5;
const BASE_SPEED_PER_TICK = 0.2;
const SPEED_MODIFIER = 0.05;
const ACCEL_MODIFIER = 0.0007;

// 지능 스탯 (회피 기동) 관련 상수
const INTELLIGENCE_DEFENSE = 0.01;
const PENALTY_SPEED_RATIO = 5.0;
const BASE_PENALTY_CHANCE = 0.05;
const INTELLIGENCE_LOOKAHEAD_DISTANCE = 5.0;
const LANE_CHANGE_CHANCE_PER_INTELLIGENCE = 0.10; 

// 힘 스탯 (장애물 돌파) 관련 상수
const STRENGTH_JUMP_BONUS = 0.5;

// 의외성 스탯 관련 상수
const UNEXPECTED_MODIFIER = 0.05;

// 장애물 관련 상수
const OBSTACLES_PER_LANE = 3;
const OBSTACLE_ZONE_START = 20;
const OBSTACLE_ZONE_END = 85;
const MAX_STUN_DURATION_TICKS = 20;
const STUN_REDUCTION_PER_STRENGTH = 4;

// --- 핵심 게임 로직 ---
function runRace(actualFinishPosition) {
    raceTickCounter++;

    const sortedRacers = [...racers].sort((a, b) => b.position - a.position);
    const leadPosition = sortedRacers[0].position;
    const lastPlacePosition = sortedRacers[racers.length - 1].position;

    racers.forEach((racer, index) => {
        if (racer.stunnedUntilTick && raceTickCounter < racer.stunnedUntilTick) {
            return;
        }

        const oldPosition = racer.position;

        // 지능 스탯의 '회피 기동' 로직
        const upcomingObstacle = lanesData[racer.currentLane].obstacles.find(obs => 
            !obs.cleared && obs.position > racer.position && (obs.position - racer.position) < INTELLIGENCE_LOOKAHEAD_DISTANCE
        );

        if (upcomingObstacle) {
            const changeChance = racer.stats.intelligence * LANE_CHANGE_CHANCE_PER_INTELLIGENCE;
            if (Math.random() < changeChance) {
                let clearLaneIndex = -1;
                for (let i = 0; i < lanesData.length; i++) {
                    if (i === racer.currentLane) continue;
                    const isLaneClear = !lanesData[i].obstacles.some(obs => 
                        !obs.cleared && Math.abs(obs.position - upcomingObstacle.position) < 5
                    );
                    if (isLaneClear) {
                        clearLaneIndex = i;
                        break;
                    }
                }

                if (clearLaneIndex !== -1) {
                    racer.currentLane = clearLaneIndex;
                    const horseElement = document.getElementById(`horse-${racer.originalIndex}`);
                    if (horseElement) {
                        const totalRacersHeight = racers.length * LANE_HEIGHT;
                        const verticalOffset = (DOM.camera.offsetHeight - totalRacersHeight) / 2;
                        horseElement.style.top = `${verticalOffset + (clearLaneIndex * LANE_HEIGHT) + (LANE_HEIGHT / 2)}px`;
                    }
                    // ✅ 수정: 회피한 장애물은 모두에게 '제거됨'으로 처리
                    upcomingObstacle.cleared = true; 
                }
            }
        }
        
        if (raceTickCounter === 1) {
            racer.position += racer.stats.strength * STRENGTH_START_BONUS;
        }

        let potentialMovement = 0;
        const baseMovement = BASE_SPEED_PER_TICK + racer.stats.speed * SPEED_MODIFIER;
        const accelerationBonus = raceTickCounter * racer.stats.acceleration * ACCEL_MODIFIER;
        potentialMovement = baseMovement + accelerationBonus;

        if (racer.position < leadPosition) {
            if (Math.random() < racer.stats.unexpectedness * UNEXPECTED_MODIFIER) {
                potentialMovement *= (racer.position === lastPlacePosition) ? 4 : 2;
                const horseElement = document.getElementById(`horse-${racer.originalIndex}`);
                if (horseElement) {
                    horseElement.classList.add('unexpected-boost-effect');
                    setTimeout(() => horseElement.classList.remove('unexpected-boost-effect'), 500);
                }
            }
        }
        
        racer.position += potentialMovement;
        
        lanesData[racer.currentLane].obstacles.forEach((obstacle, obsIndex) => {
            // ✅ 수정: 장애물 자체의 cleared 상태를 체크
            if (!obstacle.cleared && oldPosition < obstacle.position && racer.position >= obstacle.position) {
                const obstacleEl = document.getElementById(obstacle.id);
                
                if (racer.stats.strength >= 5) {
                    racer.position += racer.stats.strength * STRENGTH_JUMP_BONUS;
                } else {
                    racer.stunnedUntilTick = raceTickCounter + (MAX_STUN_DURATION_TICKS - (racer.stats.strength * STUN_REDUCTION_PER_STRENGTH));
                    racer.position = obstacle.position;
                }
                
                // ✅ 수정: 한번 부딪힌 장애물은 모두에게 '제거됨'으로 처리
                obstacle.cleared = true;
                if (obstacleEl) obstacleEl.style.display = 'none';
            }
        });

        if (Math.random() < Math.max(0, BASE_PENALTY_CHANCE - (racer.stats.intelligence * INTELLIGENCE_DEFENSE))) {
            racer.position -= potentialMovement * PENALTY_SPEED_RATIO;
        }
        
        const horseElement = document.getElementById(`horse-${racer.originalIndex}`);
        if(horseElement) horseElement.style.left = `${racer.position}%`;
    });

    updateRankingsDisplay(sortedRacers);
    const cameraTargetPos = (leadPosition / 100) * DOM.racetrack.offsetWidth - (DOM.camera.offsetWidth * 0.4);
    if (cameraTargetPos > 0) DOM.racetrack.style.transform = `translateX(-${cameraTargetPos}px)`;

    const winner = sortedRacers[0].position >= actualFinishPosition ? sortedRacers[0] : null;

    if (winner) {
        clearInterval(raceInterval);
        displayResult(winner, 'jackpot', 'race');
        DOM.raceAgainBtn.style.display = 'block';
    }
}

// ... 이하 코드 동일 ...
async function startCountdown(actualFinishPosition) {
    DOM.countdownDisplay.style.display = 'block';
    for (let i = 3; i > 0; i--) {
        DOM.countdownDisplay.textContent = i;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    DOM.countdownDisplay.textContent = 'GO!';
    DOM.bgm.play();
    DOM.musicBtn.textContent = '⏸️';
    DOM.musicBtn.classList.add('playing');
    await new Promise(resolve => setTimeout(resolve, 500));
    DOM.countdownDisplay.style.display = 'none';
    raceInterval = setInterval(() => runRace(actualFinishPosition), 100);
}

function updateRacersList() {
    DOM.racersList.innerHTML = '';
    racers.forEach((racer, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}번 레인: ${racer.user} - ${racer.name}`;
        DOM.racersList.appendChild(li);
    });
}

function updateRankingsDisplay(sortedRacers) {
    const rankEmojis = ['🥇', '🥈', '🥉'];
    DOM.raceRankings.innerHTML = sortedRacers.map((racer, index) => {
        const rank = index + 1;
        const emoji = rank <= 3 ? rankEmojis[index] : `${rank}등`;
        return `
            <div class="rank-item">
                ${emoji} <span class="rank-name horse-color-text-${racer.originalIndex}">${racer.name}</span> (${racer.user})
            </div>
        `;
    }).join('');
}

export function initRaceMode(menuData) {
    menuData.forEach(menu => {
        const option = document.createElement('option');
        option.value = menu.name;
        option.textContent = menu.name;
        DOM.restaurantSelect.appendChild(option);
    });

    const checkStatButtons = () => {
        let totalUsedPoints = Array.from(DOM.statInputs).reduce((sum, input) => sum + (parseInt(input.value) || 0), 0);
        const pointsLeft = STAT_TOTAL_POINTS - totalUsedPoints;
        DOM.statPointsLeft.textContent = pointsLeft;

        if (pointsLeft < 0) {
            DOM.statPointsLeft.parentElement.style.color = 'red';
        } else {
            DOM.statPointsLeft.parentElement.style.color = '';
        }

        DOM.statRows.forEach(row => {
            const statInput = row.querySelector('.stat-input');
            const plusBtn = row.querySelector('.stat-plus');
            const minusBtn = row.querySelector('.stat-minus');
            let currentStatValue = parseInt(statInput.value) || 0;

            minusBtn.disabled = currentStatValue <= 0;
            plusBtn.disabled = totalUsedPoints >= STAT_TOTAL_POINTS || currentStatValue >= 10;
        });
        
        const isReadyToRegister = totalUsedPoints === STAT_TOTAL_POINTS &&
                                  DOM.racerNameInput.value.trim() !== '' &&
                                  DOM.restaurantSelect.value !== '';
        DOM.addRacerBtn.disabled = !isReadyToRegister;
    };
    
    DOM.statRows.forEach(row => {
        const statInput = row.querySelector('.stat-input');
        const statBoxes = Array.from(row.querySelectorAll('.stat-box'));

        const updateStatVisuals = (value) => {
            statInput.value = value;
            statBoxes.forEach((box, i) => {
                box.classList.toggle('filled', i < value);
            });
            checkStatButtons();
        };

        row.querySelector('.stat-plus').addEventListener('click', () => {
            let currentStatValue = parseInt(statInput.value) || 0;
            updateStatVisuals(currentStatValue + 1);
        });

        row.querySelector('.stat-minus').addEventListener('click', () => {
            let currentStatValue = parseInt(statInput.value) || 0;
            updateStatVisuals(currentStatValue - 1);
        });
    });

    DOM.racerNameInput.addEventListener('input', checkStatButtons);
    DOM.restaurantSelect.addEventListener('change', checkStatButtons);

    checkStatButtons();

    DOM.addRacerBtn.addEventListener('click', () => {
        if (racers.length >= 6) return alert('경주마는 최대 6명까지만 등록할 수 있습니다.');

        const stats = {};
        Array.from(DOM.statInputs).forEach(inp => {
            const statName = inp.id.split('-')[1];
            stats[statName] = parseInt(inp.value) || 0;
        });

        const userName = DOM.racerNameInput.value.trim();
        const restaurantName = DOM.restaurantSelect.value;
        const restaurantData = menuData.find(r => r.name === restaurantName);

        if (userName && restaurantData) {
            racers.push({
                ...restaurantData,
                user: userName,
                position: 0,
                stats: stats,
                originalIndex: racers.length,
                currentLane: racers.length,
                stunnedUntilTick: 0,
                // ✅ 수정: 각 말이 개별적으로 장애물 통과 여부를 기록하는 것을 삭제
            });
            updateRacersList();
            DOM.racerNameInput.value = '';
            DOM.statRows.forEach(row => {
                const statInput = row.querySelector('.stat-input');
                const statBoxes = row.querySelectorAll('.stat-box');
                statInput.value = 0;
                statBoxes.forEach(box => box.classList.remove('filled'));
            });
            checkStatButtons();
            if (racers.length >= 2) DOM.startRaceBtn.style.display = 'block';
        }
    });

    DOM.startRaceBtn.addEventListener('click', () => {
        DOM.raceSetup.style.display = 'none';
        DOM.camera.style.display = 'block';
        DOM.racetrack.innerHTML = '<div id="start-line"></div><div id="finish-line"></div>';
        DOM.racetrack.style.transform = 'translateX(0px)';
        DOM.raceRankings.innerHTML = '';
        DOM.raceRankings.style.display = 'block';
        raceTickCounter = 0;

        const racetrackWidth = DOM.racetrack.offsetWidth;
        const horseWidthPercent = (HORSE_WIDTH_PX / racetrackWidth) * 100;
        const actualFinishPosition = FINISH_LINE_PERCENT - horseWidthPercent;
        const actualStartPosition = START_LINE_PERCENT - horseWidthPercent;
        const totalRacersHeight = racers.length * LANE_HEIGHT;
        const verticalOffset = (DOM.camera.offsetHeight - totalRacersHeight) / 2;
        
        lanesData = [];

        racers.forEach((racer, index) => {
            racer.position = actualStartPosition;
            racer.currentLane = index;

            const lane = document.createElement('div');
            lane.className = 'lane';
            lane.style.top = `${verticalOffset + (index * LANE_HEIGHT)}px`;
            DOM.racetrack.appendChild(lane);

            const horse = document.createElement('div');
            horse.className = `horse horse-color-${index}`;
            horse.id = `horse-${index}`;
            horse.style.top = `${verticalOffset + (index * LANE_HEIGHT) + (LANE_HEIGHT / 2)}px`;
            horse.style.left = `${racer.position}%`;
            horse.innerHTML = `<span class="horse-emoji">🐎</span><span class="horse-name-label">${racer.user}</span>`;
            DOM.racetrack.appendChild(horse);

            const obstacles = [];
            for (let i = 0; i < OBSTACLES_PER_LANE; i++) {
                const position = Math.random() * (OBSTACLE_ZONE_END - OBSTACLE_ZONE_START) + OBSTACLE_ZONE_START;
                const obstacleId = `obstacle-${index}-${i}`;
                // ✅ 수정: 장애물 자체에 cleared 상태를 포함
                obstacles.push({ id: obstacleId, position: position, cleared: false });

                const obstacleEl = document.createElement('div');
                obstacleEl.className = 'obstacle';
                obstacleEl.id = obstacleId;
                obstacleEl.style.left = `${position}%`;
                obstacleEl.style.top = `${verticalOffset + (index * LANE_HEIGHT) + (LANE_HEIGHT / 2)}px`;
                obstacleEl.innerHTML = '';
                DOM.racetrack.appendChild(obstacleEl);
            }
            lanesData.push({ obstacles: obstacles });
        });
        
        startCountdown(actualFinishPosition);
    });

    DOM.raceAgainBtn.addEventListener('click', () => {
        DOM.bgm.pause();
        DOM.bgm.currentTime = 0;
        DOM.musicBtn.textContent = '🎵';
        DOM.musicBtn.classList.remove('playing');

        const raceResultCard = document.getElementById('race-result-card');
        if (raceResultCard) {
            raceResultCard.style.display = 'none';
        }

        DOM.camera.style.display = 'none';
        DOM.raceRankings.style.display = 'none';
        DOM.raceAgainBtn.style.display = 'none';
        DOM.raceSetup.style.display = 'block';
        racers = [];
        lanesData = [];
        updateRacersList();
        DOM.startRaceBtn.style.display = 'none';
        DOM.countdownDisplay.textContent = '';
        DOM.countdownDisplay.style.display = 'none';
        
        DOM.statRows.forEach(row => {
            const statInput = row.querySelector('.stat-input');
            const statBoxes = row.querySelectorAll('.stat-box');
            statInput.value = 0;
            statBoxes.forEach(box => box.classList.remove('filled'));
        });
        checkStatButtons();
    });
}