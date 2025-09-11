import { DOM } from './config.js';
import { displayResult } from './ui.js';

let racers = [];
let raceInterval;
let isFirstTick = true;
let raceTickCounter = 0; // ✅ 턴을 세는 카운터 변수 추가

// --- 게임 밸런스 상수 정의 ---
const STAT_TOTAL_POINTS = 10;     // 분배 가능한 총 스탯 포인트

// 위치 관련
const LANE_HEIGHT = 45;
const START_LINE_PERCENT = 5;
const FINISH_LINE_PERCENT = 95;
const HORSE_WIDTH_PX = 35;

// 스탯 가중치
const BASE_SPEED = 0.25;
const SPEED_MODIFIER = 0.07;
const ACCEL_MODIFIER = 0.005;
const STRENGTH_MODIFIER = 1.5;      // 힘 1당 첫 턴에 추가되는 '순간 이동' 거리
const INTELLIGENCE_MODIFIER = 0.08;
const UNEXPECTED_MODIFIER = 0.03;
const PENALTY_CHANCE = 0.05;
const ACCEL_START_TICK = 50; // ✅ 가속도가 붙기 시작하는 턴 (예: 50 = 5초 후)

// --- 핵심 게임 로직 ---

function runRace(actualFinishPosition) {
    const minIntelligence = Math.min(...racers.map(r => r.stats.intelligence));
    const sortedRacersForRank = [...racers].sort((a, b) => b.position - a.position);
    const lastPlacePosition = sortedRacersForRank[sortedRacersForRank.length - 1].position;

    racers.forEach(racer => {
        const maxSpeed = BASE_SPEED + (racer.stats.speed * SPEED_MODIFIER);

        // ✅ 현재 턴이 ACCEL_START_TICK 이상일 때만 가속도를 적용
        if (raceTickCounter >= ACCEL_START_TICK) {
            racer.currentSpeed += racer.stats.acceleration * ACCEL_MODIFIER;
        }

        if (racer.currentSpeed > maxSpeed) {
            racer.currentSpeed = maxSpeed;
        }

        let movementThisTick = racer.currentSpeed;

        if (isFirstTick) {
            const strengthBoost = racer.stats.strength * STRENGTH_MODIFIER;
            movementThisTick += strengthBoost;
            
            if (racer.stats.strength > 0) {
                const horseElement = document.getElementById(`horse-${racer.originalIndex}`);
                if (horseElement) {
                    horseElement.classList.add('strength-boost-effect');
                    setTimeout(() => {
                        horseElement.classList.remove('strength-boost-effect');
                    }, 500);
                }
            }
        }

        if (racer.position === lastPlacePosition) {
            if (Math.random() < (racer.stats.unexpectedness * UNEXPECTED_MODIFIER)) {
                movementThisTick *= 2;
            }
        }

        const consistency = 1 - (Math.random() * (1 - (racer.stats.intelligence * INTELLIGENCE_MODIFIER)));
        movementThisTick *= consistency;

        const intelligence = racer.stats.intelligence;
        const isEligibleForPenalty = (intelligence < 2) || (intelligence <= 2 && intelligence === minIntelligence);
        if (isEligibleForPenalty && Math.random() < PENALTY_CHANCE) {
            movementThisTick = -3;
        }

        racer.position += movementThisTick;

        const horseElement = document.getElementById(`horse-${racer.originalIndex}`);
        if(horseElement) {
            horseElement.style.left = `${racer.position}%`;
        }
    });

    isFirstTick = false;
    raceTickCounter++; // ✅ 매 턴마다 카운터 1 증가

    updateRankingsDisplay(sortedRacersForRank);

    const leadPosition = sortedRacersForRank[0].position;
    const cameraTargetPos = (leadPosition / 100) * DOM.racetrack.offsetWidth - (DOM.camera.offsetWidth * 0.4);
    if (cameraTargetPos > 0) {
        DOM.racetrack.style.transform = `translateX(-${cameraTargetPos}px)`;
    }

    const winner = sortedRacersForRank[0].position >= actualFinishPosition ? sortedRacersForRank[0] : null;

    if (winner) {
        clearInterval(raceInterval);
        displayResult(winner, 'jackpot', 'race');
        DOM.raceAgainBtn.style.display = 'block';
    }
}


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
                currentSpeed: 0,
                stats: stats,
                originalIndex: racers.length
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

        isFirstTick = true;
        raceTickCounter = 0; // ✅ 경주 시작 시 턴 카운터 초기화

        const racetrackWidth = DOM.racetrack.offsetWidth;
        const horseWidthPercent = (HORSE_WIDTH_PX / racetrackWidth) * 100;
        const actualStartPosition = START_LINE_PERCENT - horseWidthPercent;
        const actualFinishPosition = FINISH_LINE_PERCENT - horseWidthPercent;

        const totalRacersHeight = racers.length * LANE_HEIGHT;
        const verticalOffset = (DOM.camera.offsetHeight - totalRacersHeight) / 2;

        racers.forEach((racer, index) => {
            racer.position = actualStartPosition;
            
            racer.currentSpeed = BASE_SPEED;

            const lane = document.createElement('div');
            lane.className = 'lane';
            lane.style.top = `${verticalOffset + (index * LANE_HEIGHT)}px`;
            DOM.racetrack.appendChild(lane);

            const horse = document.createElement('div');
            horse.className = `horse horse-color-${index}`;
            horse.id = `horse-${index}`;
            horse.style.top = `${verticalOffset + (index * LANE_HEIGHT) + (LANE_HEIGHT / 2)}px`;
            horse.style.left = `${actualStartPosition}%`;
            horse.innerHTML = `<span class="horse-emoji">🐎</span><span class="horse-name-label">${racer.user}</span>`;
            DOM.racetrack.appendChild(horse);
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