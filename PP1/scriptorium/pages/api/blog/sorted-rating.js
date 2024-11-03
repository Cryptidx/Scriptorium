import handlerSorting from "@/utils/comment/sorted-rating";

/*
GET BLOGS SORTED IN DESCENDING ORDER OF UPVOTES
*/

export default async function handler(req, res) {
    // GET request 
    // not restricted 
    await handlerSorting(req,res,0);
}
