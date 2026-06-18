export function getDexcomLoginUrl() {
    const params = new URLSearchParams({
      client_id: process.env.DEXCOM_CLIENT_ID,
      redirect_uri: process.env.DEXCOM_REDIRECT_URI,
      response_type: "code",
      scope: "offline_access",
      state: "projektdiab123",
    });
  
    return `https://sandbox-api.dexcom.com/v2/oauth2/login?${params.toString()}`;
  }