import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Profile, ApplicationType, type ApplicantTie } from '../types';
import { profileService } from '../services/profileService';
import { tiesService } from '../services/tiesService';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
    profile: Profile | null;
    loading: boolean;
    updateProfile: (patch: Partial<Profile>) => Promise<void>;
    /** States the applicant has a connection to besides legal residence. */
    ties: ApplicantTie[];
    /**
     * Saves `next`, sending only what changed since `loaded`: the ties the form was
     * filled from. Pass [] when the form started empty.
     */
    saveTies: (next: ApplicantTie[], loaded: ApplicantTie[]) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
    profile: null,
    loading: true,
    updateProfile: async () => { },
    ties: [],
    saveTies: async () => { },
});

export const useProfile = () => useContext(ProfileContext);

const LEGACY = {
    onboarded: (userId: string) => `wa-architect-onboarded-${userId}`,
    cycleYear: 'wa-architect-cycleYear',
    schoolTier: 'wa-architect-schoolTier',
    gpaRange: 'wa-architect-gpaRange',
    mcatRange: 'wa-architect-mcatRange',
    northStar: 'wa-architect-northstarArchetypes',
    appType: 'wa-architect-appType',
};

const read = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
};

/**
 * Onboarding state used to live in localStorage, so it didn't survive a device
 * switch. Anything already stored there is folded into the new profile row the
 * first time a pre-existing user loads the app — without this, everyone who had
 * already onboarded would be shown the wizard again.
 */
const buildLegacyPatch = (userId: string): Partial<Profile> | null => {
    const wasOnboarded = read(LEGACY.onboarded(userId)) === 'true';
    const rawCycle = read(LEGACY.cycleYear);
    const rawNorthStar = read(LEGACY.northStar);
    const rawAppType = read(LEGACY.appType);

    const anything = wasOnboarded || rawCycle || rawNorthStar || rawAppType
        || read(LEGACY.schoolTier) || read(LEGACY.gpaRange) || read(LEGACY.mcatRange);
    if (!anything) return null;

    let northStarArchetypes: string[] = [];
    try {
        const parsed = rawNorthStar ? JSON.parse(rawNorthStar) : null;
        if (Array.isArray(parsed)) northStarArchetypes = parsed.filter(x => typeof x === 'string');
    } catch { /* malformed value — just drop it */ }

    const parsedCycle = rawCycle && rawCycle !== 'auto' ? parseInt(rawCycle, 10) : NaN;

    return {
        onboarded: wasOnboarded,
        applicationType: rawAppType === ApplicationType.AACOMAS
            ? ApplicationType.AACOMAS
            : rawAppType === ApplicationType.AMCAS ? ApplicationType.AMCAS : null,
        cycleYear: Number.isNaN(parsedCycle) ? null : parsedCycle,
        schoolTier: read(LEGACY.schoolTier),
        gpaRange: read(LEGACY.gpaRange),
        mcatRange: read(LEGACY.mcatRange),
        northStarArchetypes,
    };
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    // The load below keys on the id: the user object is replaced on every token refresh, which
    // reloaded the profile and ties about once an hour.
    const userId = user?.id ?? null;
    const [profile, setProfile] = useState<Profile | null>(null);
    const [ties, setTies] = useState<ApplicantTie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!userId) {
                setProfile(null);
                setTies([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            // Ties are secondary: a failure there must not cost the user their profile.
            tiesService.fetchTies()
                .then(t => { if (!cancelled) setTies(t); })
                .catch(e => console.error('Failed to load ties:', e));
            try {
                let p = await profileService.fetchProfile();

                if (!p) {
                    const legacy = buildLegacyPatch(userId);
                    if (legacy) p = await profileService.upsertProfile(legacy);
                }

                if (!cancelled) setProfile(p);
            } catch (e) {
                console.error('Failed to load profile:', e);
                if (!cancelled) setProfile(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [userId]);

    const updateProfile = useCallback(async (patch: Partial<Profile>) => {
        const previous = profile;
        // Optimistic: the wizard advances immediately rather than waiting on a round trip.
        setProfile(prev => (prev ? { ...prev, ...patch } : prev));
        try {
            const saved = await profileService.upsertProfile(patch);
            setProfile(saved);
        } catch (e) {
            console.error('Failed to save profile:', e);
            setProfile(previous);
            throw e;
        }
    }, [profile]);

    // Not optimistic. The save is one transaction, so after a failure the stored ties are
    // exactly what they were, and after a success the database's answer is what we show.
    const saveTies = useCallback(async (next: ApplicantTie[], loaded: ApplicantTie[]) => {
        try {
            const stored = await tiesService.saveTies(next, loaded);
            if (stored) setTies(stored);
        } catch (e) {
            console.error('Failed to save ties:', e);
            throw e;
        }
    }, []);

    return (
        <ProfileContext.Provider value={{ profile, loading, updateProfile, ties, saveTies }}>
            {children}
        </ProfileContext.Provider>
    );
};
