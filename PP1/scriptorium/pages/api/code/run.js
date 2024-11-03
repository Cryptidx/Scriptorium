import prisma from '../../../lib/prisma'; // Adjust path as necessary
const { runFile } = require('../../../lib/code-run');

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "must use POST call"} );
    }

    const { lang, code, inputs } = req.body;

    if (!lang || !code) {
        return res.status(400).json({ error: 'languge and code needed' });
    }

    try {
        const { status, output, error } = await runFile(lang, code, inputs);

        if (status === -2 ) {
            return res.status(400).json({ error: 'invalid language sent' });
        }

        if (status === 0) {
            return res.status(200).json( { 
                status: 'pass',
                output: output,
                error: error                        
            });
        } else {
            return res.status(422).json( {
                status: 'fail',
                error: error
            })
        }

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}