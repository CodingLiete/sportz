import express from "express";
import { matchRouter } from "./routes/matches.js";

const app = express();
const PORT = 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Alive');
});

app.use('/matches', matchRouter);

app.listen(PORT, () => {
    console.log(`Server is running http://localhost:${PORT}`);
});