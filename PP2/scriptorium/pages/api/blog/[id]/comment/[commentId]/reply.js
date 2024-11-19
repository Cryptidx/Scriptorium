import handlerCreateComment from "@/utils/comment/create-comment";

export default async function handler(req,res){
    await handlerCreateComment(req,res,1);
}


