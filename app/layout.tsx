import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

export const metadata: Metadata = { title:{default:"知径教程",template:"%s｜知径教程"},description:"清晰、可信的教程导航与分享平台" };
export default async function RootLayout({children}:{children:React.ReactNode}) { const user=await getCurrentUser(); return <html lang="zh-CN"><body>
  <header className="site-header"><div className="shell nav"><Link className="brand" href="/"><span>知径</span>教程</Link><nav><Link href="/">发现教程</Link>{user&&<Link href="/favorites">我的收藏</Link>}{user&&<Link href="/account">账户</Link>}{user?.role==="ADMIN"&&<Link href="/admin">管理后台</Link>}{user?<form action={logout}><button className="text-button">退出</button></form>:<><Link href="/login">登录</Link><Link className="button small" href="/register">注册</Link></>}</nav></div></header>
  <main>{children}</main><footer className="site-footer"><div className="shell"><strong>知径教程</strong><p>部分链接为推广链接，用户购买时本站可能获得佣金。本站与 OpenAI 等第三方品牌不存在官方关联，不收集或保存第三方账号密码。</p></div></footer>
  </body></html>; }
