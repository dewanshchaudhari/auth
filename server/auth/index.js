const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const db = require('../db/connection');

const users = db.get('users');
users.createIndex('username', { unique: true });

const schema = Joi.object({
    username: Joi.string().regex(/(^[a-zA-Z0-9_)]+$)/).min(2).max(30).required(),
    password: Joi.string().trim().min(10).required()
});



const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        message: '🔐'
    })
});

// POST /auth/signup

router.post('/signup', (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error === undefined) {
        users.findOne({
            username: req.body.username,
        }).then(user => {
            if (user) {
                const err = new Error('That username is not OG. Please choose another one.');
                next(err);
            } else {
                bcrypt.hash(req.body.password, 12).then(hashedPassword => {
                    const newUser = {
                        username: req.body.username,
                        password: hashedPassword
                    };
                    users.insert(newUser).then(insertedUser => {
                        delete insertedUser.password;
                        res.json(insertedUser);
                    })
                });
            }
        });
    }
    else {
        next(error);
    }

});

module.exports = router;