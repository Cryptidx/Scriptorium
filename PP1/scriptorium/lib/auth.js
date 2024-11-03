import jwt from 'jsonwebtoken';
import prisma from './prisma'; 

const SECRET_KEY = process.env.JWT_SECRET;

// Middleware to verify JWT and attach userId to the request
export async function authMiddleware(req, res, { getFullUser = false } = {}) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }

  try {
    // Verify the token to get the userId
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // If only userId is needed, attach it to req and return
    if (!getFullUser) {
      req.userId = userId;
      return { userId };
    }

    // If the full user is needed, fetch it from the database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return null;
    }

    // Attach full user object to req and return it
    req.user = user;
    return user;

  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}


// Generic middleware wrapper to perform custom checks
export function performChecks(handler, checkFunction) {
  return async (req, res) => {
    // Run the check function, which returns true if allowed
    if (await checkFunction(req, res)) {
      return handler(req, res);
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
}

/*

 lightweight check for any valid token. It verifies the token 
 and attaches the userId to the request 
 if the token is valid, but it doesn’t fetch full user details.

*/
export async function isAuthenticated(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return false;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId; // Attach userId for downstream use
    return true;
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return false;
  }
}


/*

so basically a middleware is a function that wraps 
around the handler, returns a function with similar signature 
as handler (that could be used instead of the handler), 
but does some additional stuff (in this case: checks)
and now, inside protected.js or any other route,
instead of `export default handler`
you'll put `export default performChecks(handler)`
the middleware that checks for admin user 
is different than the one that checks for any kind of logged in user 


*/


// function performChecks(handler){
//    return function(req, res) {

//        // perform checks
//        if (ok){
//            return handler(req, res)

//        } else {
//            res.status(403)....
//        } 
//    }
// }''

