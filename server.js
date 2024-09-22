require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const User = require('./userSchema');
const app = express();
const {userSchemaValidation, loginValidation} = require('./middleware/validation');
const authenticationToken = require('./middleware/auth');
const BlacklistedToken = require('./tokenSchema');
app.use(bodyParser.json());

const SECRET_KEY = process.env.SECRET_KEY 

mongoose.connect(process.env.MONGO_URL).then(()=>console.log("Successfully connected to MongoDB")).catch(()=>{
    console.log("Error connecting to MongoDB");
})

app.post('/api/register', async(req, res) => {
    const {error} = userSchemaValidation.validate(req.body);
    if(error) return res.status(400).json({success: false, error: error});
    try {
        const existingUser = await User.findOne({email: req.body.email});
        if(existingUser) return res.status(409).json({success: false, error: "User already exists"});
        const {name, email, password, age} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name, email, password: hashedPassword, age
        });
        await user.save();
        const token = jwt.sign({name: name, email: email}, SECRET_KEY, {expiresIn: '1h'});
        const refreshToken = jwt.sign({name: name, email: email}, SECRET_KEY, {expiresIn: '1d'})
        res.status(201).json({
            success: true,
            name: name,
            token: token,
            refreshToken: refreshToken
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
});
app.post('/api/login', async(req, res) => {
    const {error} = loginValidation.validate(req.body);
    if(error) return res.status(400).json({success: false, error: error.details[0].message});
    try {
        const user = await User.findOne({email: req.body.email});
        if(!user) return res.status(404).json({success: false, error: "User not found"});
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if(!validPassword) return res.status(401).json({success: false, error: "Invalid password"});
        const token = jwt.sign({name: user.name, email: user.email}, SECRET_KEY, {expiresIn: '1h'});
        const refreshToken = jwt.sign({name: user.name, email: user.email}, SECRET_KEY, {expiresIn: '1d'})
        res.status(201).json({
            success: true,
            email: req.body.email,
            token: token,
            refreshToken: refreshToken
        })
    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})
app.get("/api/users",authenticationToken, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})
app.put("/api/update", authenticationToken, async (req, res) =>  {
    const {error} = userSchemaValidation.validate(req.body);
    if(error) return res.status(400).json({success: false, error: error});
    try {
        const user = await User.findOne({email: req.user.email});
        if(!user) return res.status(404).json({success: false, error: "User not found"});
        const {name, email, password, age} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.updateOne({name: name}, {email: email}, {password: hashedPassword}, {age: age});
        res.status(200).json({
            success: true,
            message: "User updated successfully"
        })
    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})
app.delete("/api/delete", authenticationToken, async(req, res) => {
    try {
        const user = await User.findOneAndDelete({email: req.body.email});
        if(!user) return res.status(404).json({success: false, error: "User not found"});
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.decode(token);
        const expiresAt = new Date(decodedToken.exp * 1000);
        const blacklist = new BlacklistedToken({token, expiresAt});
        await blacklist.save();
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        })
    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})
app.post("/api/increment-point", authenticationToken, async(req, res) => {
    try {
        const user = await User.findOneAndUpdate({email: req.user.email}, {$inc: {point: 1}});
        if(!user) return res.status(404).json({
            success: false,
            error: "User not found"
        })
        res.status(200).json({
            success: true,
            message: "Point incremented successfully",
            point: user.point
        })
    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})
app.get('/api/topscore', async (req, res)=>{
    try {
        const users = await User.find().select("-password").sort({point: -1}).limit(1);
        if(!users) return res.status(404).json({
            success: false,
            error: "No users found"
        })
        res.status(200).json({
            success: true,
            topUser: users[0].name,
            points: users[0].point
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})
app.get('/api/averagepoint', async(req, res)=>{
    try {
        const averagepoint = await User.aggregate([
            {
                $group: {
                    _id: null,
                    averagePoint: {$avg: "$point"}
                }
            }
        ]);
        const averagePoint = averagepoint.length > 0 ? averagepoint[0].averagePoint : 0;
        res.status(200).json({
            success: true,
            averagePoint: averagePoint
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})
app.get('/api/refresh-token', async(req, res) => {
    try {
        const refreshToken = req.headers.authorization.split(' ')[1];
        if(!refreshToken) {
            return res.status(403).json({
                success: false,
                error: "No refresh token found"
            })
        }
        jwt.verify(refreshToken, process.env.SECRET_KEY, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid token' });
            }
            const token = jwt.sign({name: user.name, email: user.email}, process.env.SECRET_KEY, {expiresIn: '1h'});
            res.status(200).json({
                success: true,
                token: token
            })
        })

    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})
app.post('/api/logout', authenticationToken, async(req,res)=>{
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.decode(token);
        const expiresAt = new Date(decodedToken.exp * 1000);
        const blacklist = new BlacklistedToken({token: token, expiresAt: expiresAt});
        await blacklist.save();
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})
app.get('/api/getprofile', authenticationToken, async (req, res) => {
    try {
        const user = await User.findOne({email: req.user.email}).select("-password");
        if(!user) return res.status(404).json({
            success: false,
            error: "User not found"
        })
        res.status(200).json({
            success: true,
            user: user
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            error: err.message 
        })
    }
})
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})