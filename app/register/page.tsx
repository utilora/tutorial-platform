import Link from "next/link"; import { register } from "@/lib/actions/auth"; import { AuthForm } from "@/components/AuthForm";
export default function Register(){return <section className="auth-page"><div className="panel"><h1>创建账号</h1><p>密码至少 10 位，且同时包含字母与数字。</p><AuthForm action={register} kind="register"/><p>已有账号？<Link href="/login">登录</Link></p></div></section>}
