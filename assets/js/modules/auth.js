import { api_post, setAuth, getAuthUser, getAuthToken } from './api.js';
import { showToast } from './ui.js';

async function login(email, password) {
    const data = await api_post('/auth/login', { email, password });
    setAuth(data.token, data.user);
    return data.user;
}

async function register(name, email, password, groupId) {
    const data = await api_post('/auth/register', { name, email, password, groupId });
    setAuth(data.token, data.user);
    return data.user;
}

async function fetchMe() {
    try {
        const data = await api_post('/auth/me');
        setAuth(getAuthToken(), data);
        return data;
    } catch { return null; }
}

function logout() {
    setAuth(null, null);
    document.getElementById('mobile-bottom-nav').classList.add('hidden');
    document.getElementById('mobile-header').classList.add('hidden');
    window.location.hash = 'login';
}

export { login, register, fetchMe, logout };
