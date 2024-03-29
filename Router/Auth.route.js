const express = require('express');
const createError = require('http-errors');
const User = require('../models/User.model');
const { authSchema } = require('../helpers/validation_schema');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../helpers/jwt_helper');
const client = require('../helpers/init_redis');
const router = express.Router();
router.post('/register', async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const result = await authSchema.validateAsync(req.body);
		const doesExist = await User.findOne({ email: result.email });
		if (doesExist) throw createError.Conflict(`${result.email} is already register`);
		const user = new User(result);
		const savedUser = await user.save();
		const accessToken = await signAccessToken(savedUser.id);
		const refreshToken = await signRefreshToken(savedUser.id);
		res.send({ accessToken, refreshToken });
	} catch (error) {
		if (error.isJoi) error.status = 422;
		next(error);
	}
});
router.post('/login', async (req, res, next) => {
	try {
		const result = await authSchema.validateAsync(req.body);
		const user = await User.findOne({ email: result.email });
		if (!user) throw createError.NotFound('User not Register');
		const isMatch = await user.isValidPassword(result.password);
		if (!isMatch) throw createError.Unauthorized('Username/password valid');
		const accessToken = await signAccessToken(user.id);
		const refreshToken = await signRefreshToken(user.id);
		res.send({ accessToken, refreshToken });
	} catch (error) {
		if (error.isJoi) return next(createError.BadRequest('Invalid Username/Password'));
		next(error);
	}
});

router.post('/refresh-token', async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken) throw createError.BadRequest();
		const userId = await verifyRefreshToken(refreshToken);
		const accessToken = await signAccessToken(userId);
		const refToken = await signRefreshToken(userId);
		res.send({ accessToken: accessToken, refreshToken: refToken });
	} catch (error) {
		next(error);
	}
});
router.delete('/logout', async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken) throw createError.BadRequest();
		const userId = await verifyRefreshToken(refreshToken);
		client.DEL(userId, (err, val) => {
			if (err) {
				console.log(err.message);
				throw createError.InternalServerError();
			}
			console.log(val);
			res.sendStatus(204);
		});
	} catch (error) {
		next(error);
	}
});
module.exports = router;
