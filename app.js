const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');
const secrets = require('./.secret/secrets.json');


const connection = mysql.createConnection({
    host: 'localhost',
    user : secrets.username,
    password: secrets.password,
    database: 'bad_banking'
});

const app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.engine('html', require('ejs').renderFile);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function(request, response) {
	// Render login template
	return response.sendFile(path.join(__dirname + '/static/login.html'));
});

app.get('/login', function(request, response) {
	// Render login template
	return response.sendFile(path.join(__dirname + '/static/login.html'));
});

app.post('/auth', function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.username = username;
				request.session.name = results[0].name;
				request.session.balance = results[0].balance;
				// Redirect to home page
				return response.redirect('/home');
			} else {
				return response.redirect('/badauth');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/badauth', function(request, response) {
	response.render(path.join(__dirname + '/static/badauth.html'));
	response.end();
});

app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		connection.query('SELECT * FROM accounts WHERE username = ?', [request.session.username], function(error, results) {
			if (results.length > 0) {
				return response.render(path.join(__dirname + '/static/home.html'), {name: results[0].name, balance: results[0].balance});
			} else {
				return response.send('Please enter Username and Password!');
			}
		});
	} else {
		// Not logged in
		response.send('Please login to view this page!');
		response.end();
	}
});

app.get('/transaction', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.render(path.join(__dirname + '/static/transaction.html'), {name: request.session.name, balance: request.session.balance});
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});

app.post('/transactiongo', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		
		let amount = request.body.amount;
		let reciever = request.body.username;
		let username = request.session.username;
		
		if(amount <= request.session.balance) {
			connection.query('SELECT * FROM accounts WHERE username = ? or username = ?', [username, reciever], function(error, results, fields) {
				if(results.length > 1) {

					let user_bal = results[0].balance - amount;
					let reciever_old_bal = parseInt(results[1].balance);
					let reciever_bal = parseInt(amount) + reciever_old_bal;

					//console.log(reciever_bal);

					connection.query('UPDATE accounts SET balance = ? WHERE username = ?', [user_bal, username], function(err, res) {

						connection.query('UPDATE accounts SET balance = ? WHERE username = ?', [parseInt(reciever_bal), reciever], function(err, res) { 
						});
					});

				} else {
					return response.send('User does not exist!');
				}
				return response.redirect('/home');
			});
		} else {
			return response.send('Not enough Money!');
		}
	} else {
		// Not logged in
		response.send('Please login to view this page!');
		response.end();
	}
});

app.get('/error'), function(request, response) {
	let error = request.query.error;
	if(error) {
		response.render(path.join(__dirname + '/static/error.html'), {error: error});
	} else {
		response.send('Unknown error!');
	}
	response.end();
}

app.post('/test', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		console.log("hello")
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});

app.listen(3000);

console.log("listening on port 3000");