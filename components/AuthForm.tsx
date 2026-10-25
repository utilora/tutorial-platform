"use client";
import { useActionState } from "react";
import type { ActionState } from "@/lib/forms";
import { SubmitButton } from "./SubmitButton";

export function AuthForm({action,kind,next=""}:{action:(s:ActionState,f:FormData)=>Promise<ActionState>;kind:"login"|"register";next?:string}) {
  const [state,formAction]=useActionState(action,{});
  return <form action={formAction} className="stack">
    {kind==="register"&&<label>昵称（可选）<input name="name" maxLength={50}/></label>}
    <label>邮箱<input name="email" type="email" autoComplete="email" required/></label>
    <label>密码<input name="password" type="password" autoComplete={kind==="login"?"current-password":"new-password"} minLength={kind==="login"?1:10} required/></label>
    <input type="hidden" name="next" value={next}/>{state.error&&<p className="alert error">{state.error}</p>}
    <SubmitButton>{kind==="login"?"登录":"创建账号"}</SubmitButton>
  </form>;
}
