"use client"

import uniqid from 'uniqid'
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";

import useUploadModal from "@/hooks/useUploadModal";
import { useUser } from "@/hooks/useUser";
import { useSupabaseClient } from '@supabase/auth-helpers-react';

import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { useRouter } from 'next/navigation';




const UploadModal = () => {
    const [isLoading, setIsLoading] = useState(false)
    const uploadModal = useUploadModal()
    const { user } = useUser()
    const supabaseClient = useSupabaseClient()
    const router = useRouter()

    const { register, handleSubmit, reset } = useForm<FieldValues>({
        defaultValues: {
            author: "",
            title: "",
            song: null,
            image: null
        }
    })

    const onChange = (open: boolean) => {
        if (!open) {
            // 重置表单
            reset()
            uploadModal.onClose()
        }
    }

    // create song and image 上传MP3
    const onSubmit: SubmitHandler<FieldValues> = async (values) => {
        try {
            console.log(values)
            setIsLoading(true)
            const imageFile = values.image?.[0]
            const songFile = values.song?.[0]

            if (!imageFile || !songFile || !user) {
                toast.error('Missing fields!')
                return
            }
            const uniqueID = uniqid()
            // 上传歌曲
            const {
                data: songData,
                error: songError
            } = await supabaseClient
                .storage
                .from('songs')
                .upload(`song-${values.title}-${uniqueID}`, songFile, {
                    // 控制缓存策略
                    cacheControl: '3600',
                    // 处理文件名冲突
                    upsert: false
                });

            if (songError) {
                setIsLoading(false)
                return toast.error('Failed song uoload.')
            }

            // 上传图片
            const {
                data: imageData,
                error: imageError
            } = await supabaseClient
                .storage
                .from('images')
                .upload(`image-${values.title}-${uniqueID}`, imageFile, {
                    // 控制缓存策略
                    cacheControl: '3600',
                    // 处理文件名冲突
                    upsert: false
                });

            if (imageError) {
                setIsLoading(false)
                return toast.error('Failed image uoload.')
            }

            const {
                error: supabaseError
            } = await supabaseClient
                .from('songs')
                .insert({
                    user_id: user.id,
                    title: values.title,
                    author: values.author,
                    image_path: imageData.path,
                    song_path: songData.path
                });

            if (supabaseError) {
                setIsLoading(false)
                return toast.error(supabaseError.message)
            }
            router.refresh()
            setIsLoading(false)
            toast.success('Song created!')
            reset()
            uploadModal.onClose()


        } catch (error) {
            toast.error('Something went wrong!')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            title="Add a song"
            description="Upload an mp3 file"
            isOpen={uploadModal.isOpen}
            onChange={onChange}
        >
            <form
                className="flex flex-col gap-y-4"
                onSubmit={handleSubmit(onSubmit)}
            >
                <Input
                    id="title"
                    disabled={isLoading}
                    {...register('title', { required: true })}
                    placeholder="Song title"

                />
                <Input
                    id="author"
                    disabled={isLoading}
                    {...register('author', { required: true })}
                    placeholder="Song author"
                />
                <div>
                    <div className="pb-1">
                        Select a song file
                    </div>
                    <Input
                        type="file"
                        id="song"
                        disabled={isLoading}
                        accept=".mp3"
                        {...register('song', { required: true })}
                    />
                </div>
                <div>
                    <div className="pb-1">
                        Select a image file
                    </div>
                    <Input
                        type="file"
                        id="song"
                        disabled={isLoading}
                        accept="image/*"
                        {...register('image', { required: true })}
                    />
                </div>
                <Button disabled={isLoading} type="submit">Create</Button>
            </form>
        </Modal>
    )
}
export default UploadModal