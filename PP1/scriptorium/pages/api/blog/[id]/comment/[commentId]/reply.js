import handlerCreateComment from "@/utils/comment/create-comment";

export default async function handler(req,res){
    // reply in a comment
    await handlerCreateComment(req,res,1);
}


