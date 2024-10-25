"use client"

import useLoadImage from "@/hooks/useLoadImage"
import { Song } from "@/types"
import Image from "next/image"
import PlayButton from "./PlayButton"

interface SongItemProps {
    onClick: (id: string) => void,
    data: Song
}

const SongItem: React.FC<SongItemProps> = ({
    onClick, data
}) => {
    const imagePath = useLoadImage(data)
    return (
        <div className="relative group flex flex-col items-center justify-center rounded-md overflow-hidden gap-x-4 bg-neutral-400/5 cursor-pointer hover:bg-neutral-400/10 transition p-3">
            <div className="relative aspect-square w-full h-full rounded-md overflow-hidden">
                <Image
                    className="object-cover"
                    src={imagePath || '/images/like.png'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    alt="Image"
                />
            </div>
            <div className="flex flex-col items-center w-full pt-4 gap-y-1">
                <p className="font-semibold truncate w-full">{data.title}</p>
                <p className="text-neutral-400 text-sm pb-4 w-full truncate">By {data.author}</p>
            </div>
            <div className="absolute bottom-24 right-5">
                <PlayButton />
            </div>
        </div>
    )
}

export default SongItem