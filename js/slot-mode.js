import { displayResult } from './ui.js';
import { getRecommendation } from './simple-mode.js';

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
        }, 50);
    });
}

async function spinReels(reels, menuData, currentCategory) {
    isSpinning = true;
    const isWinner = Math.random() < 0.2; // 20% 당첨 확률
    const filteredList = (currentCategory === '전체') ? menuData : menuData.filter(item => item.category === currentCategory);

    if (isWinner) {
        const finalPick = getRecommendation(menuData, currentCategory);
        if (finalPick) {
            const spinPromises = reels.map((reel, i) => spin(reel, filteredList, 1000 + i * 500, finalPick));
            await Promise.all(spinPromises);
            displayResult(finalPick, 'jackpot', 'slot');
        }
    } else {
        if (filteredList.length < 3) { // 꽝을 만들 수 없을 때
            const finalPick = getRecommendation(menuData, currentCategory);
            const spinPromises = reels.map((reel, i) => spin(reel, filteredList, 1000 + i * 500, finalPick));
            await Promise.all(spinPromises);
            displayResult(finalPick, 'jackpot', 'slot');
        } else {
            const picks = [];
            while (picks.length < 3) {
                const randomPick = filteredList[Math.floor(Math.random() * filteredList.length)];
                if (!picks.find(p => p.name === randomPick.name)) picks.push(randomPick);
            }
            const spinPromises = reels.map((reel, i) => spin(reel, filteredList, 1000 + i * 500, picks[i]));
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