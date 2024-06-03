
import express from "express"
import bodyParser from 'body-parser';

//routes import
import contactRouter from './routes/contact.routes.js'

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

//routes
app.use(contactRouter)

app.get('/', (req, res) => res.send('Health ok!'));


export { app }