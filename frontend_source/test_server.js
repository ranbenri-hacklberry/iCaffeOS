import express from 'express';
const app = express();
const port = 8081;

app.get('/health', (req, res) => {
    res.json({ status: 'ok', msg: 'Minimal Server' });
});

app.listen(port, () => {
    console.log(`Minimal server listening on port ${port}`);
});
