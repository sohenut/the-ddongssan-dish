import { displayResult } from './ui.js';

let lastRestaurant = null;

// 공통 추천 로직 (다른 모드에서도 사용 가능하도록 export)
export function getRecommendation(menuData, currentCategory) {
    const filteredList = (currentCategory === '전체')
        ? menuData
        : menuData.filter(item => item.category === currentCategory);

    if (filteredList.length === 0) {
        return null;
    }

    let randomPick;
    do {
        const randomIndex = Math.floor(Math.random() * filteredList.length);
        randomPick = filteredList[randomIndex];
    } while (filteredList.length > 1 && randomPick === lastRestaurant);

    lastRestaurant = randomPick;
    return randomPick;
}


export function handleSimpleRecommend(menuData, currentCategory) {
    const result = getRecommendation(menuData, currentCategory);
    if (result) {
        displayResult(result, 'normal', 'simple');
    } else {
        displayResult({ name: '앗, 맛집이 없어요!', info: '다른 카테고리를 선택해주세요.' }, 'failure', 'simple');
    }
}