const mongoose = require('mongoose');
mongoose
	.connect(process.env.MONGODB_URI, {
		dbName: process.env.DB_NAME,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true,
	})
	.then(() => console.log('MongoDB Connected'))
	.catch((err) => console.log(err));
mongoose.connection.on('connected', () => {
	console.log(`mongoose connected to DB`);
});

mongoose.connection.on('error', (err) => {
	console.log(err.message);
});
mongoose.connection.on('disconnected', () => {
	console.log('Mongoose connection is Disconnected');
});

process.on('SIGINT', async () => {
	await mongoose.connection.close();
	process.exit(0);
});
