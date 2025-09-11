// js/kakao-map-loader.js (수정 후)

let isSdkLoaded = false;
let kakaoApiKey = null;

// 서버(Netlify Function)로부터 API 키를 비동기적으로 가져오는 함수
async function fetchKakaoApiKey() {
    // 이미 키를 가져왔다면 다시 요청하지 않음
    if (kakaoApiKey) return kakaoApiKey;

    try {
        // 3단계에서 설정한 URL로 요청을 보냅니다.
        const response = await fetch('/api/map-key');
        if (!response.ok) {
            throw new Error('API 키를 가져오는 데 실패했습니다.');
        }
        const data = await response.json();
        kakaoApiKey = data.apiKey; // 응답받은 키를 변수에 저장
        return kakaoApiKey;
    } catch (error) {
        console.error(error);
        return null; // 실패 시 null 반환
    }
}

export function loadKakaoMapSDK() {
    return new Promise(async (resolve, reject) => {
        if (isSdkLoaded) {
            resolve();
            return;
        }

        // 함수를 호출해서 API 키를 받아옵니다.
        const KAKAO_API_KEY = await fetchKakaoApiKey();

        if (!KAKAO_API_KEY) {
            reject(new Error("Kakao API 키를 불러오지 못했습니다."));
            return;
        }

        const script = document.createElement('script');
        // 받아온 키를 사용해 스크립트 주소를 동적으로 만듭니다.
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&libraries=services&autoload=false`;
        document.head.appendChild(script);

        script.onload = () => {
            kakao.maps.load(() => {
                isSdkLoaded = true;
                resolve();
            });
        };

        script.onerror = () => {
            reject(new Error("Kakao Maps SDK를 불러오는 데 실패했습니다."));
        };
    });
}