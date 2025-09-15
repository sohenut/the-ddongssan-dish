import { displayResult } from './ui.js';
import { getRecommendation } from './simple-mode.js';

// --- 설정 상수 정의 ---
const JACKPOT_CHANCE = 0.2; // 당첨 확률 (20%)
const BASE_SPIN_DURATION = 1000; // 기본 릴 회전 시간 (ms)
const SPIN_DURATION_INCREMENT = 500; // 릴마다 추가되는 회전 시간 (ms)
const SPIN_ANIMATION_INTERVAL = 50; // 릴 애니메이션 간격 (ms)
// --------------------

let isSpinning = false;

function spin(reel, list, duration, target) {
    return new Promise(resolve => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const randomName = list[Math.floor(Math.random() * list.length)].name;
            reel.textContent = randomName;
            if (Date.now() - startTime > duration) {
                clearInterval(interval);
                reel.textContent = target.name;
                resolve();
            }
        }, SPIN_ANIMATION_INTERVAL); // 50을 상수로 변경
    });
}

async function spinReels(reels, menuData, currentCategory) {
    isSpinning = true;
    const isWinner = Math.random() < JACKPOT_CHANCE; // 0.2를 상수로 변경
    const filteredList = (currentCategory === '전체') ? menuData : menuData.filter(item => item.category === currentCategory);

    // 스핀 시간을 계산하는 로직을 상수로 대체
    const calculateSpinDuration = (index) => BASE_SPIN_DURATION + index * SPIN_DURATION_INCREMENT;

    if (isWinner) {
        const finalPick = getRecommendation(menuData, currentCategory);
        if (finalPick) {
            const spinPromises = reels.map((reel, i) => spin(reel, filteredList, calculateSpinDuration(i), finalPick));
            await Promise.all(spinPromises);
            displayResult(finalPick, 'jackpot', 'slot');
        }
    } else {
        // 꽝을 만들 때 필요한 식당 수가 릴의 개수보다 적으면 그냥 당첨 처리
        if (filteredList.length < reels.length) {
            const finalPick = getRecommendation(menuData, currentCategory);
            const spinPromises = reels.map((reel, i) => spin(reel, filteredList, calculateSpinDuration(i), finalPick));
            await Promise.all(spinPromises);
            displayResult(finalPick, 'jackpot', 'slot');
        } else {
            const picks = [];
            // 3 대신 릴의 개수(reels.length)만큼 다른 식당을 뽑도록 수정
            while (picks.length < reels.length) {
                const randomPick = filteredList[Math.floor(Math.random() * filteredList.length)];
                if (!picks.find(p => p.name === randomPick.name)) picks.push(randomPick);
            }
            const spinPromises = reels.map((reel, i) => spin(reel, filteredList, calculateSpinDuration(i), picks[i]));
            await Promise.all(spinPromises);
            displayResult({ name: '아쉽네요!', info: '다시 돌려보세요 꽝! 꽝! 꽝!' }, 'failure', 'slot');
        }
    }
    isSpinning = false;
}

export function handleSlotRecommend(reels, menuData, currentCategory) {
    if (isSpinning) return;
    document.getElementById('slot-result-card').style.display = 'none';
    spinReels(reels, menuData, currentCategory);
}