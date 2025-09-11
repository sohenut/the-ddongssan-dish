// /netlify/functions/get-kakao-key.js

exports.handler = async function(event, context) {
  // 1단계에서 설정한 환경 변수의 Key 이름을 정확하게 입력합니다.
  const apiKey = process.env.VITE_KAKAO_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key is not set on the server.' })
    };
  }

  return {
    statusCode: 200,
    // API 키를 JSON 형태로 클라이언트에 전달합니다.
    body: JSON.stringify({ apiKey: apiKey }),
  };
};