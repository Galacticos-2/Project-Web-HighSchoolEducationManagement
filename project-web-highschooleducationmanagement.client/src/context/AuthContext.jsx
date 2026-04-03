import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { authStorage } from "../auth/authStorage";
import { AuthContext } from "./auth-context";

const withCacheBust = (url) => {
    if (!url) return "";
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}t=${Date.now()}`;
};

const normalizeProfile = (profile) => {
    if (!profile) return null;

    return {
        ...profile,
        avatarURL: profile.avatarURL ? withCacheBust(profile.avatarURL) : "",
    };
};

export function AuthProvider({ children }) {
    const [profile, setProfile] = useState(() => {
        const stored = authStorage.getProfile();

        if (
            !stored?.fullName &&
            !stored?.email &&
            !stored?.role &&
            !stored?.avatarURL
        ) {
            return null;
        }

        return normalizeProfile(stored);
    });

    const [loadingProfile, setLoadingProfile] = useState(false);

    const refreshProfile = useCallback(async () => {
        if (!authStorage.getToken()) {
            setProfile(null);
            return null;
        }

        try {
            setLoadingProfile(true);

            const { data } = await authApi.getMe();
            const normalized = normalizeProfile(data);

            setProfile(normalized);  
            authStorage.saveProfile(normalized); 

            return normalized;
        } catch (error) {
            if (error?.response?.status === 401) {
                authStorage.clear();
                setProfile(null);
            }
            throw error;
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    const updateProfileState = useCallback((nextProfile) => {
        const normalized = normalizeProfile(nextProfile);
        setProfile(normalized);   //React-re-render với profile mới lại ngay
        authStorage.saveProfile(normalized);
    }, []);

    const clearAuthState = useCallback(() => {
        authStorage.clear();
        setProfile(null);
    }, []);

    useEffect(() => {
        if (authStorage.getToken()) {
            refreshProfile().catch(() => { });
        }
    }, [refreshProfile]);

    const value = useMemo(
        () => ({
            profile,
            setProfile: updateProfileState,
            refreshProfile,
            clearAuthState,
            loadingProfile,
        }),
        [profile, loadingProfile, refreshProfile, updateProfileState, clearAuthState]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}