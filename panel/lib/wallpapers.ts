export interface Wallpaper {
    id: string;
    url: string;
    name: string;
    uploadedAt: string;
    isDefault?: boolean;
}

export const DEFAULT_WALLPAPERS: Wallpaper[] = [
    {
        id: 'default-1',
        url: '/wallpapers/wallpaper_1.png',
        name: 'Silk Flow',
        uploadedAt: new Date().toISOString(),
        isDefault: true
    },
    {
        id: 'default-2',
        url: '/wallpapers/wallpaper_2.png',
        name: 'Desert Dusk',
        uploadedAt: new Date().toISOString(),
        isDefault: true
    },
    {
        id: 'default-3',
        url: '/wallpapers/wallpaper_3.png',
        name: 'Emerald Waves',
        uploadedAt: new Date().toISOString(),
        isDefault: true
    },
    {
        id: 'default-4',
        url: '/wallpapers/wallpaper_4.png',
        name: 'Frosted Glass',
        uploadedAt: new Date().toISOString(),
        isDefault: true
    }
];
