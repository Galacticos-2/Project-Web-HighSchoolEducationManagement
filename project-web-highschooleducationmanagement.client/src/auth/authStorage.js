// src/auth/authStorage.js
const KEY_TOKEN = "accessToken";
const KEY_ROLE = "role";
const KEY_FULLNAME = "fullName";
const KEY_EMAIL = "email";           // ✅ NEW
const KEY_EXPIRES = "expiresAtUtc";
const KEY_AVATAR = "avatarURL";
export const authStorage = {
    saveLogin: (res) => {
        // res từ backend login:
        // { accessToken, expiresAtUtc, role, fullName }
        localStorage.setItem(KEY_TOKEN, res.accessToken);
        localStorage.setItem(KEY_ROLE, res.role);
        localStorage.setItem(KEY_FULLNAME, res.fullName);
        localStorage.setItem(KEY_EXPIRES, res.expiresAtUtc);

        // ✅ Nếu sau này backend trả email luôn thì tự lưu:
        if (res.email) {
            localStorage.setItem(KEY_EMAIL, res.email);
        }
        if (res.avatarURL !== undefined && res.avatarURL !== null) {
            localStorage.setItem(KEY_AVATAR, res.avatarURL);
        }
    },

    // ✅ NEW: dùng khi login (vì bạn biết email từ form)
    setEmail: (email) => {
        if (!email) return;
        localStorage.setItem(KEY_EMAIL, email);
    },

    // ✅ NEW: dùng sau khi gọi /me để đồng bộ localStorage theo dữ liệu thật
    saveProfile: (profile) => {
        if (!profile) return;
        if (profile.role) localStorage.setItem(KEY_ROLE, profile.role);
        if (profile.fullName) localStorage.setItem(KEY_FULLNAME, profile.fullName);
        if (profile.email) localStorage.setItem(KEY_EMAIL, profile.email);
        if (profile.avatarURL !== undefined && profile.avatarURL !== null) {
            localStorage.setItem(KEY_AVATAR, profile.avatarURL);
        }
    },

    clear: () => {
        localStorage.removeItem(KEY_TOKEN);
        localStorage.removeItem(KEY_ROLE);
        localStorage.removeItem(KEY_FULLNAME);
        localStorage.removeItem(KEY_EMAIL);     
        localStorage.removeItem(KEY_EXPIRES);
        localStorage.removeItem(KEY_AVATAR);
    },

    getToken: () => localStorage.getItem(KEY_TOKEN),

    isLoggedIn: () => !!localStorage.getItem(KEY_TOKEN),

    getProfile: () => ({
        role: localStorage.getItem(KEY_ROLE),
        fullName: localStorage.getItem(KEY_FULLNAME),
        email: localStorage.getItem(KEY_EMAIL),         
        expiresAtUtc: localStorage.getItem(KEY_EXPIRES),
        avatarURL: localStorage.getItem(KEY_AVATAR),
    }),
};