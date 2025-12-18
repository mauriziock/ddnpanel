import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { exec } from "child_process"
import util from "util"

const execAsync = util.promisify(exec)

export async function GET(req: Request) {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        // Use lsblk to get block devices in JSON format
        // -J: JSON output
        // -o: Output columns (Name, Label, Size, Type, MountPoint)
        // -f: Output filesystems
        const { stdout } = await execAsync('lsblk -J -o NAME,LABEL,SIZE,TYPE,MOUNTPOINT,FSTYPE')

        const data = JSON.parse(stdout)

        // Filter for devices that have a mountpoint and are potentially removable or interesting
        // We typically want 'part' (partitions) or 'disk' (disks) that are mounted
        const drives = data.blockdevices
            .flatMap((device: any) => {
                // If the device has children (partitions), map them
                if (device.children) {
                    return device.children.map((child: any) => ({ ...child, parent: device.name }))
                }
                return device
            })
            .filter((device: any) => {
                // Must have a mountpoint
                if (!device.mountpoint) return false

                // Exclude system mounts ideally, but for now show everything mounted in common locations
                // Common locations for user drives: /media, /mnt, /run/media
                const isUserMount = ['/media', '/mnt', '/run/media', '/Volumes'].some(prefix =>
                    device.mountpoint.startsWith(prefix)
                )

                // Also include root if desired, but user specifically asked for "connected memories"
                // Let's include everything for now, let frontend filter
                return true
            })
            .map((device: any) => ({
                name: device.label || device.name,
                path: device.mountpoint,
                size: device.size,
                type: device.fstype,
                isRemovable: device.mountpoint.includes('/media') || device.mountpoint.includes('/run/media')
            }))

        return NextResponse.json(drives)

    } catch (error: any) {
        console.error('Failed to detect drives:', error)
        return new NextResponse("Failed to scan drives", { status: 500 })
    }
}
