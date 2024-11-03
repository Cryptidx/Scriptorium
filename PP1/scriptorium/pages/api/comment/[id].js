// given a comment object identifiable with id 
// create a sub comment within that comment 
// this is a reply or thread type thing 

// or, update that comment identifiable by id


// add a comment to a given comment identifiable by id (POST)

// we would need to create the comment, 
// then add it to the comment
// this is a child comment (reply)


// update a comment, could be top level or child (PUT)
// just do it based on id given 
// including num of upvotes and downvotes
// we'd want to edit (like change directly)
// description
// upvotes
// downvotes
// flagged attribute 
// would assume author is always current user (could be another auth user)