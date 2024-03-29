/* eslint-disable react/prop-types */
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Input, RTE, Select } from "..";
import appwriteBlogService from "../../appWrite/BlogsOperations";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";

// eslint-disable-next-line react/prop-types
export default function PostForm ({ post }) {
    const [url, setUrl] = useState(null)
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
        defaultValues: {
            title: post?.title || "",
            slug: post?.$id || "",
            content: post?.content || "",
            status: post?.status || "active",
            genre: post?.genre || "other"
        },
    });

    const getUrl = (post) => {
        appwriteBlogService.getFilePreview(post.featuredImage)
            .then((res => setUrl(res.href)))
    }


    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData);


    const submit = async (data) => {

        if (post) {
            const file = data.image[0] ? await appwriteBlogService.uploadFile(data.image[0]) : null;

            if (file) {
                appwriteBlogService.deleteFile(post.featuredImage);
            }

            const dbPost = await appwriteBlogService.updatePost(post.$id, {
                ...data,
                featuredImage: file ? file.$id : undefined,
            });

            if (dbPost) {

                navigate(`/post/${dbPost.$id}`);
            }
        } else {
            const file = await appwriteBlogService.uploadFile(data.image[0]);

            if (file) {
                const fileId = file.$id;
                data.featuredImage = fileId;
                const dbPost = await appwriteBlogService.createPost({ ...data, userId: userData.$id });

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                }
            }
        }
    };

    const slugTransform = useCallback((value) => {
        if (value && typeof value === "string")
            return value
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z\d\s]+/g, "-")
                .replace(/\s/g, "-");

        return "";
    }, []);
    if (post) getUrl(post)

    React.useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "title") {
                setValue("slug", slugTransform(value.title), { shouldValidate: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, slugTransform, setValue]);

    return (
        <form onSubmit={ handleSubmit(submit) } className="flex mb-10 flex-wrap">
            <div className="w-2/3 px-2">
                <Input
                    label="Title :"
                    placeholder="Title"
                    className="mb-4 border w-80 "
                    { ...register("title", { required: true }) }
                />
                <Input
                    label="Slug :"
                    placeholder="Slug"
                    className="mb-4 border w-80 "
                    { ...register("slug", { required: true }) }
                    onInput={ (e) => {
                        setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
                    } }
                />
                <Input
                    label="Featured Image :"
                    type="file"
                    className="mb-4 border w-80 "
                    accept="image/png, image/jpg, image/jpeg, image/gif,image/webp"
                    { ...register("image", { required: !post }) }
                />
                { post && (
                    <div className="w-full mb-4">
                        <img
                            src={ url }
                            alt={ post.title }
                            className="rounded-lg"
                        />
                    </div>
                ) }
                <RTE label="Content :" name="content" control={ control } defaultValue={ getValues("content") } />
            </div>
            <div className="w-1/3 px-2">

                <Select
                    options={ ["active", "inactive"] }
                    label="Status"
                    className="mb-4 "
                    { ...register("status", { required: true }) }
                />
                <Select
                    options={ ["tech", "fashion", "travel", "science", "history", "horror", "lifeStyle", "Management", "Other"] }
                    label="Genre"
                    className="mb-4"
                    { ...register("genre", { required: true }) }
                />
                <button type="submit" className={ `${post ? "bg-green-500" : "bg-blue-500"} text-white px-3 py-1 rounded-sm` }>
                    { post ? "Update" : "Submit" }
                </button>
            </div>
        </form>
    );
}
