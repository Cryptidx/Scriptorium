import prisma from "@/utils/db"

// GET request 
// not restricted 

// get list of comments based on rating
// so two quesries, rating(upvote/downvote), order(ascending/descending)

//I get exposed to the most valued or controversial discussions first.

// We are assuming the most valued discussion
// is the one with the most upvoted 
// we do upvoted in descending order, paginated 

export default async function handler(req,res){
    if(req.method !== "GET"){
        return res.status(405).json({message: "method not allowed"});
    }
    

}