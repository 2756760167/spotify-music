"use client"

import uniqid from 'uniqid'
import pinyin from 'pinyin'

import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';

import useUploadModal from "@/hooks/useUploadModal";
import { useUser } from "@/hooks/useUser";
import { useSupabaseClient } from '@supabase/auth-helpers-react';

import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";

/**
 * 将中文字符转换为拼音，英文字符保持不变
 * @param {string} title - 标题字符串
 * @returns {string} 转换后的拼音字符串
 */
const toPinyin = (title: string) => {
    const pinyinArray = pinyin(title, {
        style: pinyin.STYLE_NORMAL, // 普通风格，不带声调
    });
    return pinyinArray.map((word: any) => word[0]).join(''); // 取每个字的拼音首字母并连接
}

/**
 * 生成基于标题的随机字符串，同时支持中文和英文
 * @param {string} title - 标题字符串
 * @param {number} [length=6] - 随机字符串的长度，默认为6
 * @returns {string} 随机字符串
 */
const generateRandomString = (title: string, length = 6) => {
    let baseString = ''; // 基础字符串

    // 分割标题为中文和英文部分
    const parts = title.split(/([\u4e00-\u9fa5]+)/).filter(Boolean);

    parts.forEach((part) => {
        if (/^[\u4e00-\u9fa5]+$/.test(part)) {
            // 如果是中文部分，转换为拼音
            baseString += toPinyin(part);
        } else {
            // 如果是英文部分，直接添加
            baseString += part;
        }
    });

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = baseString.toLowerCase();
    const charactersLength = characters.length;

    // 生成随机字符串
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

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

            let uploadRandomStr;
            // 检查标题是否包含中文字符
            if (/[\u4e00-\u9fa5]/.test(values.title)) {
                // 根据title生成随机字符串
                uploadRandomStr = generateRandomString(values.title)
            } else {
                uploadRandomStr = values.title;
            }
            // 上传歌曲
            const { data: songData, error: songError } =
                await supabaseClient.storage
                    .from("songs")
                    .upload(
                        `song-${uploadRandomStr}-${uniqueID}`,
                        songFile,
                        {
                            // 控制缓存策略
                            cacheControl: "3600",
                            // 处理文件名冲突
                            upsert: false,
                        }
                    );

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
                .upload(`image-${uploadRandomStr}-${uniqueID}`, imageFile, {
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