const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

mongoose.connect("mongodb+srv://rkarimova17347:TimeToShine24@cluster0.ajcbpxo.mongodb.net/database", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function (callback) {
    console.log("connection succeeded");
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


app.use(express.static(path.join(__dirname, '../frontend')));


const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

app.get('/', function (req, res) {
    res.set({
        'Access-control-Allow-Origin': '*'
    });
    return res.redirect('/main.html');
});

// Signup route
app.post('/sign_up', async function (req, res) {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
        return res.status(400).send("User already exists");
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        name: name,
        email: email,
        password: hashedPassword
    });

    await newUser.save();
    console.log("Record inserted Successfully");

    return res.redirect('/login.html');
});

app.post('/login', async function (req, res) {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email });
    if (!user) {
        return res.status(400).send("Invalid email or password");
    }

    // Check if password is correct
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(400).send("Invalid email or password");
    }

    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, "secretKey");
    res.header("auth-token", token).redirect('/dashboard.html');

});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});