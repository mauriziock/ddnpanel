import { auth } from "@/auth"
import { redirect } from "next/navigation"
import FileManager from "@/components/FileManager"

export const dynamic = 'force-dynamic'

export default async function FilesPage() {
    const session = await auth()
    if (!session) redirect("/login")

    return (
        <div className="p-0 h-screen bg-gray-50 flex flex-col">
            <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-10">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-blue-500">Files</span>
                    <span className="text-gray-300">/</span>
                    <span className="font-normal text-gray-600">Local Storage</span>
                </h1>
                <a href="/" className="text-sm text-gray-500 hover:text-gray-900">Back to Dashboard</a>
            </div>
            <div className="flex-1 overflow-hidden p-4">
                {/* 
                   We pass siteId=1 as a dummy ID since we are removing DB logic. 
               */}
                <FileManager siteId={1} />
            </div>
        </div>
    )
}
