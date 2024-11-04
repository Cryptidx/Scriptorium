import handlerCreateComment from "@/utils/comment/create-comment";

export default async function handler(req,res){
    // top level comment
    // add a comment to a given blog identified by blog id (POST)

    // for updating comments, go to specific comment handler, we only need comment id
    await handlerCreateComment(req,res,0);
}
