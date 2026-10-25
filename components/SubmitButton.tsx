"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({children="提交",danger=false}:{children?:React.ReactNode;danger?:boolean}) { const {pending}=useFormStatus(); return <button className={danger?"button danger":"button"} disabled={pending}>{pending?"处理中…":children}</button>; }
