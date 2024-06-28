const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors({
    origin: ["http://localhost:5173","http://localhost:3007", "https://pakar-paling-baru-admin.vercel.app", "https://pakar-paling-baru-public.vercel.app"],
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    key: "userId",
    secret: "atanu",
    resave: false,
    saveUninitialized: false,
}));

app.use('/', userRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
