import express from "express";

const app = express();
const PORT = 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Alive');
});

app.listen(PORT, () => {
    console.log(`Server is running http://localhost:${PORT}`);
})