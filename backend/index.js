const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8765;
const fs = require('fs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.send('yes i exist');
});

app.get('/config', function (req, res) {
	res.sendFile(__dirname + '/config/index.html');
});

app.get('/appPing', function (req, res) {
	var watchModel = req.query.watchModel;
	var last4TTN = req.query.last4TTN;
	var config = {
		"watchModel": watchModel,
		"last4TTN": last4TTN,
		"timestamp": Date.now()
	};
	// Current config is a JSON array of objects
	// We want to append the new config to the end of the array
	var current = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
	current.push(config);
	fs.writeFileSync('config/config.json', JSON.stringify(current));
	res.send('ok');
});

app.get('/analytics', function (req, res) {
	// Get number of users and most popular watch model from config.json
	var config = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
	var users = config.length;
	var watchModels = {};
	for (var i = 0; i < config.length; i++) {
		var watchModel = config[i].watchModel;
		if (watchModels[watchModel]) {
			watchModels[watchModel] += 1;
		} else {
			watchModels[watchModel] = 1;
		}
	}
	var mostPopularWatchModel = Object.keys(watchModels).reduce(function(a, b){ return watchModels[a] > watchModels[b] ? a : b });
	var analytics = {
		"users": users,
		"mostPopularWatchModel": mostPopularWatchModel
	};
	var installs_today = 0;
	var installs_this_month = 0;
	var installs_all_time = 0;

	// Get number of installs today, this month, and all time from config.json
	var today = new Date();
	var this_month = today.getMonth();
	var this_year = today.getFullYear();
	for (var i = 0; i < config.length; i++) {
		var timestamp = config[i].timestamp;
		var date = new Date(timestamp);
		var year = date.getFullYear();
		var month = date.getMonth();
		if (year == this_year) {
			if (month == this_month) {
				installs_this_month += 1;
				if (date.getDate() == today.getDate()) {
					installs_today += 1;
				}
			}
			installs_all_time += 1;
		}
	}
	analytics.installs_today = installs_today;
	analytics.installs_this_month = installs_this_month;
	analytics.installs_all_time = installs_all_time;



	var html = `
	<html>
		<head>
			<title>Analytics</title>
			<style>
				body {
					font-family: sans-serif;
				}
				table {
					border-collapse: collapse;
				}
				th, td {
					border: 1px solid black;
					padding: 10px;
				}
			</style>

		</head>
		<body>
			<h1>Analytics</h1>
			<table>
				<tr>
					<th>Users</th>
					<td>${analytics.users}</td>
				</tr>
				<tr>
					<th>Most Popular Watch Model</th>
					<td>${analytics.mostPopularWatchModel}</td>
				</tr>
				<tr>
					<th>Installs Today</th>
					<td>${analytics.installs_today}</td>
				</tr>
				<tr>
					<th>Installs This Month</th>
					<td>${analytics.installs_this_month}</td>
				</tr>
				<tr>
					<th>Installs All Time</th>
					<td>${analytics.installs_all_time}</td>
				</tr>
			</table>
		</body>
	</html>
	`;
	res.send(html);
});

app.listen(port, function () {
  console.log(`app ${port}!`);
});

