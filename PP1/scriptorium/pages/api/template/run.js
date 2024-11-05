const { runFile } = require('../../../lib/code-run');

// runs code sent by user
// expects code and language
export default async function handler(req, res) {
    // makes sure API call is a GET request
    if (req.method !== "GET") {
        return res.status(405).json({ error: "must use GET call"} );
    }

    // destructures body
    const { language, code, inputs } = req.body;
    
    // makes sure language and body paramebers are passed
    if (!language || !code) {
        return res.status(400).json({ error: "languge and code needed" });
    }

    try {
        // runs file and returns status of exit and output of function
        const [ status, output, error ] = await runFile(language, code, inputs);

        // invalid language was sent to runFile
        if (status === -2 ) {
            return res.status(422).json({ error: "invalid language sent" });
        }

        // file ran and exited properly
        if (status === 0) {
            return res.status(200).json( { 
                status: 'pass',
                output: output,
                error: error                        
            });
        } else { // file ran and experienced an error
            return res.status(400).json( {
                status: 'fail',
                output: output,
                error: error
            })
        }

    } catch (error) {
        // general catch error
        console.error(error.message);
        return res.status(422).json({ error: "could not execute file" });
    }
}