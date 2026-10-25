import { db } from "@/lib/db";
import { TutorialCard } from "@/components/TutorialCard";

export default async function Home({searchParams}:{searchParams:Promise<{q?:string;category?:string;tag?:string}>}) { const p=await searchParams; const q=(p.q||"").slice(0,100);
  const where={status:"PUBLISHED" as const,...(q?{OR:[{title:{contains:q,mode:"insensitive" as const}},{summary:{contains:q,mode:"insensitive" as const}}]}:{}),...(p.category?{category:{slug:p.category}}:{}),...(p.tag?{tags:{some:{tag:{slug:p.tag}}}}:{})};
  const [tutorials,categories,tags,featured]=await Promise.all([
    db.tutorial.findMany({where,include:{category:true,tags:{include:{tag:true}},_count:{select:{favorites:true,clicks:true}}},orderBy:[{sortOrder:"desc"},{publishedAt:"desc"}]}),
    db.category.findMany({include:{_count:{select:{tutorials:{where:{status:"PUBLISHED"}}}}},orderBy:[{sortOrder:"desc"},{name:"asc"}],take:10}),
    db.tag.findMany({orderBy:{name:"asc"},take:30}),
    db.tutorial.findMany({where:{status:"PUBLISHED",featured:true},include:{category:true,tags:{include:{tag:true}},_count:{select:{favorites:true,clicks:true}}},orderBy:[{sortOrder:"desc"},{publishedAt:"desc"}],take:3})
  ]);
  return <><section className="hero"><div className="shell hero-inner"><div className="eyebrow">持续更新 · 清楚标识推广内容</div><h1>找到靠谱教程，少走一点弯路。</h1><p>聚合值得参考的外部教程与站内指南。先了解注意事项，再前往第三方页面。</p><form className="searchbar"><input name="q" defaultValue={q} placeholder="搜索教程、工具或问题…"/><select name="category" defaultValue={p.category||""}><option value="">全部分类</option>{categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}</select><select name="tag" defaultValue={p.tag||""}><option value="">全部标签</option>{tags.map(t=><option key={t.id} value={t.slug}>{t.name}</option>)}</select><button className="button">搜索</button></form></div></section>
  {!q&&!p.category&&!p.tag&&<section className="section"><div className="shell"><div className="section-head"><div><h2>推荐教程</h2><p>经过整理、适合优先了解的内容</p></div></div><div className="grid">{featured.map(t=><TutorialCard key={t.id} tutorial={t}/>)}</div></div></section>}
  <section className="section alt"><div className="shell"><div className="section-head"><div><h2>热门分类</h2><p>从你关心的主题开始</p></div></div><div className="category-grid">{categories.map(c=><a className="category" key={c.id} href={`/?category=${c.slug}`}><strong>{c.name}</strong><span>{c._count.tutorials} 篇教程</span></a>)}</div></div></section>
  <section className="section"><div className="shell"><div className="section-head"><div><h2>{q||p.category||p.tag?"筛选结果":"最新教程"}</h2><p>{tutorials.length} 条内容</p></div></div><div className="grid">{tutorials.length?tutorials.map(t=><TutorialCard key={t.id} tutorial={t}/>):<div className="empty">没有找到匹配教程，换个关键词或筛选条件试试。</div>}</div></div></section></>;
}
