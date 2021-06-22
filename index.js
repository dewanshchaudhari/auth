const express = require('express');
const morgan = require('morgan');
const createError = require('http-errors');
require('dotenv').config();
require('./helpers/init_mongodb');
require('./helpers/init_redis');
const { verifyAccessToken } = require('./helpers/jwt_helper');
const AuthRoute = require('./Router/Auth.route');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', verifyAccessToken, async (req, res, next) => {
	res.send('hello from express');
});
app.use('/auth', AuthRoute);
app.use(async (req, res, next) => {
	// const error = new Error('Not Found');
	// error.status = 404;
	// next(error);
	next(createError.NotFound());
});
app.use((err, req, res, next) => {
	res.status(err.status || 500);
	res.send({
		error: {
			status: err.status || 500,
			message: err.message,
		},
	});
});
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`server running on port:${port}`));
