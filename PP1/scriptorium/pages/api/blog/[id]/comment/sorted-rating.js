import handlerSorting from "@/utils/comment/sorted-rating";

// GET request 
// not restricted to USER

/*
GET COMMENTS SORTED IN DESCENDING ORDER OF UPVOTES
*/

export default async function handler(req,res){
    // get top comments within a blog 
    await handlerSorting(req,res,1);
}