import { loadKakaoMapSDK } from './kakao-map-loader.js'; // 👈 1. 새로운 로더 함수를 가져옵니다.

export async function displayMap(mapContainerId, address) {
    try {
        // 👇 2. 스크립트 로딩이 완료될 때까지 기다립니다.
        await loadKakaoMapSDK();

        const mapContainer = document.getElementById(mapContainerId);
        const geocoder = new kakao.maps.services.Geocoder();

        geocoder.addressSearch(address, function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
                const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

                const options = {
                    center: coords,
                    level: 3
                };

                const map = new kakao.maps.Map(mapContainer, options);
                const marker = new kakao.maps.Marker({
                    map: map,
                    position: coords
                });

            } else {
                mapContainer.innerHTML = "<div style='padding-top: 70px;'>지도 정보를 불러오는 데 실패했습니다.</div>";
            }
        });

    } catch (error) {
        console.error(error);
        const mapContainer = document.getElementById(mapContainerId);
        mapContainer.innerHTML = "<div style='padding-top: 70px;'>지도 SDK 로딩에 실패했습니다.</div>";
    }
}