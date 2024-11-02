import prisma from "@/utils/db"

export default function handler(req,res){
    // GET handler 
    // expects: title, description, tag, and code template/empty 

    const {title, description, tag, template} = req.body;
    
    // the author is the current user 
}