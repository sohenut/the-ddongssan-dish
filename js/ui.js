// js/ui.js (수정)

import { displayMap } from './map-manager.js';

// 👇 함수 선언 앞에 async 키워드를 추가합니다.
export async function displayResult(item, status, mode) {
    const targetCard = document.getElementById(`${mode}-result-card`);
    if (!targetCard) return;

    targetCard.style.display = 'flex';
    targetCard.className = 'result-card';
    if (status === 'jackpot' || status === 'failure') {
        targetCard.classList.add(status);
    }

    const nameEl = targetCard.querySelector('.restaurant-name');
    const infoEl = targetCard.querySelector('.restaurant-info');
    nameEl.textContent = item.name;
    infoEl.textContent = item.info || '';

    const mapContainerId = `${mode}-map`;
    const mapContainer = document.getElementById(mapContainerId);
    
    if (item.address && mapContainer) {
        mapContainer.style.display = 'block';
        // await를 붙여주면 지도가 로딩될 때까지 기다릴 수 있지만,
        // UI가 멈추는 것을 방지하기 위해 여기서는 await 없이 호출합니다.
        displayMap(mapContainerId, item.address);
    } else if (mapContainer) {
        mapContainer.style.display = 'none';
        mapContainer.innerHTML = '';
    }
}