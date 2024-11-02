import nextConnect from 'next-connect';

const handler = () => {
  return nextConnect({
    onError(error, req, res) {
      console.error(error);
      res.status(500).json({ error: 'An unexpected error occurred' });
    },
    onNoMatch(req, res) {
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    },
  });
};

export default handler;
