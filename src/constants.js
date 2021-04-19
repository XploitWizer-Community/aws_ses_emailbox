export const ADDRESS_DELIM = ",";
export const EMAIL_ADDRESS_DELIM = "@";
export const ORIGIN = (new URL(document.location)).origin;
export const HOST = (new URL(document.location)).host;
export const PATHNAME = (new URL(document.location)).pathname.replace(/\/+$/, '');
export const API_GW_URL = 'https://api.zeer0.com/v001';
export const EMAIL_CONTENT_URL = `${API_GW_URL}/moogle/email`;
export const EMAILS_LIST_URL = `${API_GW_URL}/moogle/email/list`;
export const COMMENT_POST_URL = `${API_GW_URL}/moogle/email/comments`;
export const DEFAULT_FQDN = HOST.startsWith('localhost') ? 'moogle.cc' : HOST;
export const LOGIN_REDIRECT_URL = `${ORIGIN}${PATHNAME}`;
// export const LOGOUT_REDIRECT_URL = `${ORIGIN}${PATHNAME}`;
export const COGNITO_URL = 'https://moogle.auth.ap-south-1.amazoncognito.com/';
export const CLIENT_ID = '365ebnulu59p2fkp1m6dl0v6gd';
export const RESPONSE_TYPE = 'token';
export const SCOPE = 'email+openid';
export const NEW_EMAIL_CHECKOUT_TIME = 300000;
export const COGNITO_LOGIN_URL = `${COGNITO_URL}/login?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}&redirect_uri=${LOGIN_REDIRECT_URL}`;
// export const COGNITO_LOGOUT_URL = `${COGNITO_URL}/logout?client_id=${CLIENT_ID}&logout_uri=${LOGOUT_REDIRECT_URL}`;