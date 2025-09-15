// 1. 필요한 부품들을 각 모듈에서 가져옵니다 (import)
import { DOM } from './js/config.js';
import { handleSimpleRecommend } from './js/simple-mode.js';
import { handleSlotRecommend } from './js/slot-mode.js';
import { initRaceMode } from './js/race-mode.js';

// 👇 --- 이벤트를 추가하여 HTML이 모두 로드된 후 코드가 실행되도록 합니다. ---
window.addEventListener('DOMContentLoaded', () => {
    
    // 2. 앱의 상태를 관리하는 변수들
    let menuData = [];
    let currentCategory = '전체';

    // --- 로딩 및 앱 콘텐츠 DOM 요소를 가져옵니다. ---
    const loadingOverlay = document.getElementById('loading-overlay');
    const appContent = document.getElementById('app-content');

    // 3. 애플리케이션 초기화 및 메인 로직
    async function main() {
        // 음악 컨트롤 로직
        DOM.bgm.volume = 0.3; // 기본 볼륨 30%로 설정
        DOM.musicBtn.addEventListener('click', () => {
            if (DOM.bgm.paused) {
                DOM.bgm.play();
                DOM.musicBtn.textContent = '⏸️';
                DOM.musicBtn.classList.add('playing');
            } else {
                DOM.bgm.pause();
                DOM.musicBtn.textContent = '🎵';
                DOM.musicBtn.classList.remove('playing');
            }
        });

        try {
            const response = await fetch('restaurants.json');
            if (!response.ok) throw new Error('데이터 로딩 실패');
            menuData = await response.json();
            
            // 이벤트 리스너 설정
            setupEventListeners();

            // 경마 모드 초기화 (데이터가 필요하므로 여기서 실행)
            initRaceMode(menuData);

            // --- 모든 로딩과 설정이 끝나면 로딩 화면을 숨기고 앱을 보여줍니다. ---
            loadingOverlay.style.display = 'none';
            appContent.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert('맛집 목록을 불러오는 데 실패했습니다.');
            // --- 에러 발생 시에도 로딩 화면은 숨겨줍니다. ---
            loadingOverlay.style.display = 'none';
        }
    }

    // 4. 이벤트 리스너들을 설정하는 함수
    function setupEventListeners() {
        // 모드 전환 탭
        DOM.modeTabs.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            const mode = e.target.dataset.mode;
            document.querySelector('.mode-tab.active').classList.remove('active');
            e.target.classList.add('active');
            DOM.modeContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(`${mode}-mode-content`).classList.remove('hidden');
            DOM.categoryButtonsContainer.style.display = (mode === 'race') ? 'none' : 'flex';
        });

        // 카테고리 버튼
        DOM.categoryButtons.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            document.querySelector('.category-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
        });

        // 추천 버튼
        DOM.recommendBtn.addEventListener('click', () => handleSimpleRecommend(menuData, currentCategory));
        DOM.slotBtn.addEventListener('click', () => handleSlotRecommend(DOM.reels, menuData, currentCategory));
    }

    // 5. 앱 실행
    main();

}); // 👆 --- DOMContentLoaded 이벤트 래퍼의 닫는 부분 ---