import * as SimpleIcons from 'simple-icons'

export interface AppIcon {
    name: string
    slug: string
    color: string
    svg: string
}

// Popular apps for homelab/self-hosted
export const popularApps: AppIcon[] = [
    {
        name: 'Portainer',
        slug: 'portainer',
        color: '#13BEF9',
        svg: SimpleIcons.siPortainer.svg
    },
    {
        name: 'Jellyfin',
        slug: 'jellyfin',
        color: '#00A4DC',
        svg: SimpleIcons.siJellyfin.svg
    },
    {
        name: 'Home Assistant',
        slug: 'homeassistant',
        color: '#18BCF2',
        svg: SimpleIcons.siHomeassistant.svg
    },
    {
        name: 'Nginx',
        slug: 'nginx',
        color: '#009639',
        svg: SimpleIcons.siNginx.svg
    },
    {
        name: 'Docker',
        slug: 'docker',
        color: '#2496ED',
        svg: SimpleIcons.siDocker.svg
    },
    {
        name: 'Plex',
        slug: 'plex',
        color: '#EBAF00',
        svg: SimpleIcons.siPlex.svg
    },
    {
        name: 'Nextcloud',
        slug: 'nextcloud',
        color: '#0082C9',
        svg: SimpleIcons.siNextcloud.svg
    },
    {
        name: 'Pi-hole',
        slug: 'pihole',
        color: '#96060C',
        svg: SimpleIcons.siPihole.svg
    },
    {
        name: 'Grafana',
        slug: 'grafana',
        color: '#F46800',
        svg: SimpleIcons.siGrafana.svg
    },
    {
        name: 'Prometheus',
        slug: 'prometheus',
        color: '#E6522C',
        svg: SimpleIcons.siPrometheus.svg
    },
    {
        name: 'Traefik',
        slug: 'traefikproxy',
        color: '#24A1C1',
        svg: SimpleIcons.siTraefikproxy.svg
    },
    {
        name: 'Proxmox',
        slug: 'proxmox',
        color: '#E57000',
        svg: SimpleIcons.siProxmox.svg
    },
    {
        name: 'GitLab',
        slug: 'gitlab',
        color: '#FC6D26',
        svg: SimpleIcons.siGitlab.svg
    },
    {
        name: 'GitHub',
        slug: 'github',
        color: '#181717',
        svg: SimpleIcons.siGithub.svg
    },
    {
        name: 'Bitwarden',
        slug: 'bitwarden',
        color: '#175DDC',
        svg: SimpleIcons.siBitwarden.svg
    },
    {
        name: 'Sonarr',
        slug: 'sonarr',
        color: '#0B3A82',
        svg: SimpleIcons.siSonarr.svg
    },
    {
        name: 'Radarr',
        slug: 'radarr',
        color: '#FFC230',
        svg: SimpleIcons.siRadarr.svg
    },
    {
        name: 'Transmission',
        slug: 'transmission',
        color: '#DA4B4B',
        svg: SimpleIcons.siTransmission.svg
    }
]

export function getIconBySlug(slug: string): AppIcon | undefined {
    // 1. Try popular first (fastest)
    const popular = popularApps.find(app => app.slug === slug)
    if (popular) return popular

    // 2. Try to find in full catalog
    // Find the icon object in SimpleIcons exports by converting to values
    const foundIcon = Object.values(SimpleIcons).find((icon: any) =>
        icon && icon.slug === slug
    ) as any

    if (foundIcon) {
        return {
            name: foundIcon.title,
            slug: foundIcon.slug,
            color: '#' + foundIcon.hex,
            svg: foundIcon.svg
        }
    }

    return undefined
}

export function searchIcons(query: string): AppIcon[] {
    const lowerQuery = query.toLowerCase()

    // First check popular apps for efficient matches
    const popularMatches = popularApps.filter(app =>
        app.name.toLowerCase().includes(lowerQuery) ||
        app.slug.toLowerCase().includes(lowerQuery)
    )

    // If we have enough popular matches, return them to be faster
    // But if user wants specific ones, we should search all

    // Search entire catalog
    // Convert SimpleIcons exports to array
    const allIcons = Object.values(SimpleIcons)
        .filter((icon: any) => icon && icon.title && icon.slug && icon.svg)
        .map((icon: any) => ({
            name: icon.title,
            slug: icon.slug,
            color: '#' + icon.hex,
            svg: icon.svg
        }))

    const matches = allIcons.filter(icon =>
        icon.name.toLowerCase().includes(lowerQuery) ||
        icon.slug.toLowerCase().includes(lowerQuery)
    )

    // Limit results performance
    return matches.slice(0, 50)
}

export function renderIcon(svg: string, className: string = 'w-10 h-10'): JSX.Element {
    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}
