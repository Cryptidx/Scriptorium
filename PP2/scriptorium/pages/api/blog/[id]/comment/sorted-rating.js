import handlerSorting from "@/utils/comment/sorted-rating";

// GET request 
// not restricted 

// get list of comments based on rating
// so two quesries, rating(upvote/downvote), order(ascending/descending)

//I get exposed to the most valued or controversial discussions first.

// We are assuming the most valued discussion
// is the one with the most upvoted 
// we do upvoted in descending order, paginated 

/*
GET COMMENTS SORTED IN DESCENDING ORDER OF UPVOTES
*/

export default async function handler(req,res){
    // get top comments within a blog 
    await handlerSorting(req,res,1);
}