"use client"

import AuthModal from "@/components/AuthModal"
import UploadModal from "@/components/UploadModal"
import { useEffect, useState } from "react"

interface ModalProviderProps {
    children?: React.ReactNode
}

const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {

    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    })

    if (!isMounted) {
        return null
    }
    return (
        <>
            <UploadModal />
            <AuthModal />
        </>
    )
}
export default ModalProvider