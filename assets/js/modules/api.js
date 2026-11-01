const API_BASE = '/api';

let authToken = localStorage.getItem('lms_token');
let authUser = JSON.parse(localStorage.getItem('lms_user') || 'null');

function setAuth(token, user) {
    authToken = token;
    authUser = user;
    if (token) localStorage.setItem('lms_token', token);
    else localStorage.removeItem('lms_token');
    if (user) localStorage.setItem('lms_user', JSON.stringify(user));
    else localStorage.removeItem('lms_user');
}

function getAuthUser() { return authUser; }
function getAuthToken() { return authToken; }

async function api(method, path, body = null) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (authToken) opts.headers['Authorization'] = `Bearer ${authToken}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Server xatosi' }));
        // `status` kerak edi — masalan ota-onaning bolasi bog'lanmagan bo'lsa
        // 404 keladi va mijoz "bo'sh" holatni boshqa xatodan ajratishi kerak.
        const e = new Error(err.error || `HTTP ${res.status}`);
        e.status = res.status;
        e.data = err;
        throw e;
    }
    return res.json();
}

const api_get = (path) => api('GET', path);
const api_post = (path, body) => api('POST', path, body);
const api_patch = (path, body) => api('PATCH', path, body);
const api_del = (path) => api('DELETE', path);

export { API_BASE, api, api_get, api_post, api_patch, api_del, setAuth, getAuthUser, getAuthToken };
