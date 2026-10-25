import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();
async function main() {
  const categories = [
    ["ChatGPT", "chatgpt"], ["AI 工具", "ai-tools"], ["账号注册", "account-registration"], ["支付教程", "payments"], ["网络工具", "network-tools"],
  ];
  for (let i=0;i<categories.length;i++) await db.category.upsert({where:{slug:categories[i][1]},update:{},create:{name:categories[i][0],slug:categories[i][1],sortOrder:i}});
  for (const [name,slug] of [["新手入门","beginner"],["订阅服务","subscription"],["人工智能","ai"]]) await db.tag.upsert({where:{slug},update:{},create:{name,slug}});
  const category = await db.category.findUniqueOrThrow({where:{slug:"chatgpt"}}); const tags=await db.tag.findMany({where:{slug:{in:["beginner","subscription"]}}});
  await db.tutorial.upsert({where:{slug:"how-to-subscribe-chatgpt-plus"},update:{},create:{slug:"how-to-subscribe-chatgpt-plus",title:"如何开通 ChatGPT Plus",summary:"介绍开通 ChatGPT Plus 前需要了解的准备事项、价格变化与第三方政策提示。具体流程与价格以服务商页面为准。",coverUrl:"https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",externalUrl:"https://gpt.yayacdk.com/",isPromoted:true,promotionDisclosure:"推广链接：你通过该链接购买相关服务时，本站可能获得佣金，但不会增加你的购买价格。",notice:"本站与 OpenAI 不存在官方关联。请勿向任何第三方提供你的账号密码；价格、步骤和政策可能随时变化。",status:"PUBLISHED",featured:true,sortOrder:100,publishedAt:new Date(),categoryId:category.id,tags:{create:tags.map(tag=>({tagId:tag.id}))}}});
  const email=process.env.ADMIN_EMAIL; const password=process.env.ADMIN_PASSWORD;
  if (email && password) { if(password.length<10) throw new Error("ADMIN_PASSWORD 至少 10 位"); await db.user.upsert({where:{email:email.toLowerCase()},update:{role:"ADMIN"},create:{email:email.toLowerCase(),name:"管理员",role:"ADMIN",passwordHash:await hash(password,12)}}); console.log(`管理员已初始化：${email}`); }
  else console.log("未设置 ADMIN_EMAIL/ADMIN_PASSWORD，已跳过管理员初始化。");
}
main().finally(()=>db.$disconnect());
