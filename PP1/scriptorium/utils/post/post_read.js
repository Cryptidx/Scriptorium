// common functions for both blog and comment
import prisma from "@/utils/db"

export function getId(req,res){
    if(req.method !== "GET"){
        return res.status(405).json({message: "method not allowed"});
    }

}

export function getAuthor(req,res){
    if(req.method !== "GET"){
        return res.status(405).json({message: "method not allowed"});
    }
    
}

export function getReplies(req,res){
    if(req.method !== "GET"){
        return res.status(405).json({message: "method not allowed"});
    }
}

export function getUpVotes(req,res){
    if(req.method !== "GET"){
        return res.status(405).json({message: "method not allowed"});
    }
}

export function getDownVotes(req,res){
    if(req.method !== "GET"){
        return res.status(405).json({message: "method not allowed"});
    }
}

export function isInvalid(req,res){
    if(req.method !== "GET"){
        return res.status(405).json({message: "method not allowed"});
    }
}

export function getDescription(req,res){
    if(req.method !== "GET"){
        return res.status(405).json({message: "method not allowed"});
    }
}