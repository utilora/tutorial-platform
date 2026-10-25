import { toggleFavorite } from "@/lib/actions/favorites";
import { SubmitButton } from "./SubmitButton";
export function FavoriteButton({id,active}:{id:string;active:boolean}) { return <form action={toggleFavorite.bind(null,id)}><SubmitButton>{active?"取消收藏":"收藏教程"}</SubmitButton></form>; }
