"use client"

interface IframeViewerProps {
    url: string
    name: string
}

export default function IframeViewer({ url, name }: IframeViewerProps) {
    return (
        <div className="h-full w-full bg-white rounded-lg overflow-hidden">
            <iframe
                src={url}
                className="w-full h-full border-0"
                title={name}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
        </div>
    )
}
