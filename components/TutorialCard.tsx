import Link from "next/link";
type Card={id:string;slug:string;title:string;summary:string;coverUrl:string|null;isPromoted:boolean;featured:boolean;category:{name:string;slug:string};tags:{tag:{name:string;slug:string}}[];_count:{favorites:number;clicks:number}};
export function TutorialCard({tutorial}:{tutorial:Card}) { return <article className="card">
  <Link href={`/tutorials/${tutorial.slug}`} className="cover">{tutorial.coverUrl?<img src={tutorial.coverUrl} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<span>教程指南</span>}</Link>
  <div className="card-body"><div className="chips"><Link className="chip" href={`/?category=${tutorial.category.slug}`}>{tutorial.category.name}</Link>{tutorial.isPromoted&&<span className="chip promo">推广链接</span>}{tutorial.featured&&<span className="chip feature">推荐</span>}</div>
  <h3><Link href={`/tutorials/${tutorial.slug}`}>{tutorial.title}</Link></h3><p>{tutorial.summary}</p><div className="tags">{tutorial.tags.map(({tag})=><Link key={tag.slug} href={`/?tag=${tag.slug}`}>#{tag.name}</Link>)}</div><footer><span>{tutorial._count.clicks} 次查看 · {tutorial._count.favorites} 人收藏</span><Link href={`/tutorials/${tutorial.slug}`}>查看详情 →</Link></footer></div>
  </article>; }
