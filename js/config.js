// DOM 요소를 선택해서 내보냅니다 (export).
export const DOM = {
    modeTabs: document.getElementById('mode-tabs'),
    modeContents: document.querySelectorAll('.mode-content'),
    categoryButtonsContainer: document.getElementById('category-buttons'),
    categoryButtons: document.getElementById('category-buttons'),
    recommendBtn: document.getElementById('recommend-btn'),
    slotBtn: document.getElementById('slot-btn'),
    reels: [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')],
    
    // 경마 모드 요소
    camera: document.getElementById('camera'),
    racetrack: document.getElementById('racetrack'),
    racerNameInput: document.getElementById('racer-name'),
    restaurantSelect: document.getElementById('restaurant-select'),
    addRacerBtn: document.getElementById('add-racer-btn'),
    racersList: document.getElementById('racers-list'),
    startRaceBtn: document.getElementById('start-race-btn'),
    raceWinner: document.getElementById('race-winner'),
    raceSetup: document.getElementById('race-setup'),
    raceRankings: document.getElementById('race-rankings'),
    raceAgainBtn: document.getElementById('race-again-btn'),
    countdownDisplay: document.getElementById('countdown-display'),

    // 👇 수정된 부분: 음악 관련 요소 추가
    bgm: document.getElementById('bgm'),
    musicBtn: document.getElementById('music-btn'),

    statspeedInput: document.getElementById('stat-speed'), // hidden input
    statAccelerationInput: document.getElementById('stat-acceleration'),
    statStrengthInput: document.getElementById('stat-strength'),
    statIntelligenceInput: document.getElementById('stat-intelligence'),
    statUnexpectednessInput: document.getElementById('stat-unexpectedness'),
    statPointsLeft: document.getElementById('stat-points-left').querySelector('span'),
    statInputs: document.querySelectorAll('.stat-input'), // 모든 hidden stat input
    
    // 새로 추가된 스탯 박스들과 버튼들
    statRows: document.querySelectorAll('.stat-row'), // 모든 스탯 라인
    statPlusBtns: document.querySelectorAll('.stat-plus'),
    statMinusBtns: document.querySelectorAll('.stat-minus'),
};