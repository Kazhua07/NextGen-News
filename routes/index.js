const fetch = require('node-fetch');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const saltRounds = 10;

router.get('/', (req, res, next) => {
	return res.render('index.ejs');
});

router.post('/', async (req, res, next) => {
	let personInfo = req.body;

	if (!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf) {
		return res.send({ "Success": "All fields required." });
	}

	if (personInfo.password !== personInfo.passwordConf) {
		return res.send({ "Success": "Passwords do not match." });
	}

	const existingUser = await User.findOne({ email: personInfo.email });
	if (existingUser) {
		return res.send({ "Success": "Email is already used." });
	}

	// Generate unique_id
	let latestUser = await User.findOne({}).sort({ _id: -1 }).limit(1);
	let newId = latestUser ? latestUser.unique_id + 1 : 1;

	// Hash the password
	const hashedPassword = await bcrypt.hash(personInfo.password, saltRounds);

	const newUser = new User({
		unique_id: newId,
		email: personInfo.email,
		username: personInfo.username,
		password: hashedPassword,
		passwordConf: hashedPassword // no need for separate field, just keeping for structure
	});

	await newUser.save();
	res.send({ "Success": "You are registered. You can login now." });
});


router.get('/login', (req, res, next) => {
	return res.render('login.ejs');
});

router.post('/login', async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return res.send({ "Success": "This Email is not registered!" });
	}

	const match = await bcrypt.compare(req.body.password, user.password);

	if (match) {
		req.session.userId = user.unique_id;
		res.send({ "Success": "Success!" });
	} else {
		res.send({ "Success": "Wrong password!" });
	}
});
 

// router.get('/api/news', async (req, res) => {
//   try {
//     const topic = req.query.topic || "technology";

//     const response = await fetch(
//   `https://gnews.io/api/v4/top-headlines?lang=en&country=in&topic=${topic}&apikey=4a24e1c4a5962c36f679155697c5c96d`
// );

//     const data = await response.json();
//     res.json(data);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch news" });
//   }
// });


router.get('/api/news', async (req, res) => {
  try {
    const topic = req.query.topic || "technology";

    const url = `https://gnews.io/api/v4/top-headlines?lang=en&country=in&topic=${topic}&apikey=4a24e1c4a5962c36f679155697c5c96d`;

    // 🔥 ADD THESE LOGS HERE
    console.log("FINAL URL:", url);

    const response = await fetch(url);
    const data = await response.json();

    console.log("API RESPONSE:", data);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});


// router.post('/api/chat', async (req, res) => {
//   try {
//     const userMessage = req.body.message;

//     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Authorization": "Bearer YOUR_OPENROUTER_API_KEY",
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         model: "openai/gpt-3.5-turbo",
//         messages: [{ role: "user", content: userMessage }]
//       })
//     });

//     const data = await response.json();
//     res.json(data);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Chat failed" });
//   }
// });

router.post('/api/chat', async (req, res) => {
  try {
    // 🔥 ADD HERE
    console.log("OPENROUTER KEY:", process.env.OPENROUTER_API_KEY);

    const messages = req.body.messages;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: messages
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat failed" });
  }
});

router.get('/news', (req, res, next) => {
	User.findOne({ unique_id: req.session.userId }, (err, data) => {
		if (!data) {
			res.redirect('/');
		} else {
			return res.render('gptnews.ejs', { "name": data.username, "email": data.email });
		}
	});
});



router.get('/logout', (req, res, next) => {
	if (req.session) {
		// delete session object
		req.session.destroy((err) => {
			if (err) {
				return next(err);
			} else {
				return res.redirect('/');
			}
		});
	}
});

router.get('/forgetpass', (req, res, next) => {
	res.render("forget.ejs");
});

router.post('/forgetpass', (req, res, next) => {
	User.findOne({ email: req.body.email }, (err, data) => {
		if (!data) {
			res.send({ "Success": "This Email Is not regestered!" });
		} else {
			if (req.body.password == req.body.passwordConf) {
				data.password = req.body.password;
				data.passwordConf = req.body.passwordConf;

				data.save((err, Person) => {
					if (err)
						console.log(err);
					else
						console.log('Success');
					res.send({ "Success": "Password changed!" });
				});
			} else {
				res.send({ "Success": "Password does not matched! Both Password should be same." });
			}
		}
	});

});
router.get('/dball', async (req, res, next) => {
    try {
        const allUsers = await User.find({});
        
        // Format the data nicely and remove sensitive information
        const formattedUsers = allUsers.map(user => ({
            id: user.unique_id,
            username: user.username,
            email: user.email,
            registered_date: user.createdAt // if you have this field
        }));

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(formattedUsers, null, 2));
    } catch (error) {
        next(error);
    }
});

module.exports = router;