#!/usr/bin/env node

const express = require("express");
const app = express();
require("dotenv").config();
const bodyParser = require("body-parser");

const { mongoose } = require("./db/mongoose");

const port = process.env.PORT || 3000;

// Load in the mongoose models
const { List, Task, User, GoogleUser, Team } = require("./db/models/index");

//jwt module import 
const jwt = require('jsonwebtoken');

// authorization helper for team endpoints
const { authorizeTeam } = require('./middleware/authorizeTeam');
const shortid = require('shortid');

/* MIDDLEWARE */

// Load middleware
app.use(bodyParser.json());

// CORS HEADERS MIDDLEWARE
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'x-access-token',
    'Authorization',
    'x-refresh-token',
    '_id',
    'Origin',
    'X-Requested-With',
    'Accept',
  ],
}));


/**
 * Middleware to authenicate users via JWT token
 * Purpose: Ensure the user is authenticated by validating the JWT token
 */
const authenicate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Extract token from header

  if (!token) {
    return res.status(401).send({ error: 'Authorization token missing' }); // Handle missing token
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure JWT_SECRET is set
    req.user_id = decoded._id; // Add user id to request for further use
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Authentication Error:", error); // Log the error for debugging
    res.status(401).send({ error: 'Invalid or expired token' }); // Handle invalid/expired token
  }
};


// Verify refresh Token Middleware (which will be verifying the session)
let VerifySession = (req, res, next) => {
  // Normalize header keys to handle potential case mismatches
  const refreshToken = req.header('x-refresh-token') || req.header('refreshToken');
  const _id = req.header('_id') || req.header('x-id');

  // Validate if both headers are present
  if (!refreshToken || !_id) {
    return res.status(400).json({ error: 'Refresh token and user ID are required' });
  }

  // Find the user by ID and refresh token
  User.findByIdAndToken(_id, refreshToken)
    .then((user) => {
      if (!user) {
        // User couldn't be found
        return Promise.reject({
          error: 'User not found. Make sure that the refresh token and user ID are correct',
        });
      }

      // Check if the session is valid
      const isSessionValid = user.sessions.some((session) => {
        return (
          session.token === refreshToken &&
          !User.hasRefreshTokenExpired(session.expirytime) // Fix typo: 'expiresAt' to 'expirytime'
        );
      });

      if (isSessionValid) {
        // Attach user details to the request object
        req.user_id = user._id;
        req.refreshToken = refreshToken;
        req.userObject = user;
        next();
      } else {
        return Promise.reject({
          error: 'Refresh token has expired or the session is invalid',
        });
      }
    })
    .catch((err) => {
      res.status(401).json(err);
    });
};

/* END MIDDLEWARE */

// Route  Handlers

/* ------------------------------------------------------------------
   SOLO LIST  ROUTES  (personal workspace)
-------------------------------------------------------------------*/

/**
 * GET /lists
 * Purpose: Get all solo lists for the authenticated user
 */
app.get('/lists', authenicate, async (req, res) => {
  try {
    const userId = req.user_id;              // <-- use the ID your middleware set
    const lists  = await List.find({ _userId: userId });
    return res.status(200).send(lists);
  } catch (err) {
    console.error('Error fetching solo lists:', err);
    return res.status(500).send({ error: 'Unable to fetch lists' });
  }
});

/**
 * POST /lists
 * Purpose: Create a new solo list
 */
app.post('/lists', authenicate, async (req, res) => {
  const { title } = req.body;
  try {
    const userId  = req.user_id;             // <-- correct field
    const newList = new List({ title, _userId: userId });
    const saved   = await newList.save();
    return res.status(201).send(saved);
  } catch (err) {
    console.error('Error creating list:', err);
    return res.status(500).send({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /lists/:id
 * Purpose: Update a solo list (must belong to user)
 */
app.patch('/lists/:id', authenicate, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid ID format' });
  }

  try {
    const userId = req.user_id;               // <-- correct field
    const updated = await List.findOneAndUpdate(
      { _id: id, _userId: userId },
      { $set: req.body },
      { new: true }
    );
    if (!updated) {
      return res.status(404).send({ error: 'List not found or unauthorized' });
    }
    return res.status(200).send(updated);
  } catch (err) {
    console.error('Error updating list:', err);
    return res.status(500).send({ error: 'Internal Server Error' });
  }
});

/**
 * DELETE /lists/:id
 * Purpose: Delete a solo list + its tasks
 */
app.delete('/lists/:id', authenicate, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid ID format' });
  }

  try {
    const userId = req.user_id;               // <-- correct field
    const removed = await List.findOneAndDelete({ _id: id, _userId: userId });
    if (!removed) {
      return res.status(404).send({ error: 'List not found or unauthorized' });
    }
    await deleteTasksFromList(removed._id);
    return res.status(200).send(removed);
  } catch (err) {
    console.error('Error deleting list:', err);
    return res.status(500).send({ error: 'Internal Server Error' });
  }
});


/* ------------------------------------------------------------------
   SOLO TASK ROUTES  (under a solo list)
-------------------------------------------------------------------*/

/**
 * GET /lists/:listId/tasks
 * Purpose: Get tasks for one personal list
 */
app.get('/lists/:listId/tasks', authenicate, async (req, res) => {
  const { listId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(listId)) {
    return res.status(400).send({ error: 'Invalid listId' });
  }

  try {
    /* make sure the list really belongs to this user */
    const list = await List.findOne({ _id: listId, _userId: req.user_id });
    if (!list) return res.status(404).send({ error: 'List not found or unauthorized' });

    const tasks = await Task.find({ _listId: listId });
    return res.status(200).send(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return res.status(500).send({ error: 'Server error' });
  }
});



/**
 * POST /lists/:listId/tasks
 * Purpose: Add a task to a personal list
 */
app.post('/lists/:listId/tasks', authenicate, async (req, res) => {
  const { listId }          = req.params;
  const { title, priority = 0, dueDate = null } = req.body;

  if (!mongoose.Types.ObjectId.isValid(listId)) {
    return res.status(400).send({ error: 'Invalid listId format' });
  }

  try {
    const list = await List.findOne({ _id: listId, _userId: req.user_id });
    if (!list) return res.status(404).send({ error: 'List not found or unauthorized' });

    const newTask = new Task({ title, _listId: listId, priority, dueDate });
    await newTask.save();
    return res.status(201).send(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    return res.status(500).send({ error: 'Internal Server Error' });
  }
});



/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Update a task in a personal list
 */
app.patch('/lists/:listId/tasks/:taskId', authenicate, async (req, res) => {
  const { listId, taskId } = req.params;

  if (![listId, taskId].every(id => mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).send({ error: 'Invalid ID format' });
  }

  try {
    /* first, confirm ownership of the list                      */
    const list = await List.findOne({ _id: listId, _userId: req.user_id });
    if (!list) return res.status(404).send({ error: 'List not found or unauthorized' });

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, _listId: listId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).send({ error: 'Task not found' });
    }
    return res.status(200).send(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    return res.status(500).send({ error: 'Internal Server Error' });
  }
});



/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Remove a task from a personal list
 */
app.delete('/lists/:listId/tasks/:taskId', authenicate, async (req, res) => {
  const { listId, taskId } = req.params;

  if (![listId, taskId].every(id => mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).send({ error: 'Invalid ID format' });
  }

  try {
    const list = await List.findOne({ _id: listId, _userId: req.user_id });
    if (!list) return res.status(404).send({ error: 'List not found or unauthorized' });

    const removed = await Task.findOneAndDelete({ _id: taskId, _listId: listId });
    if (!removed) {
      return res.status(404).send({ error: 'Task not found' });
    }
    return res.status(200).send(removed);
  } catch (err) {
    console.error('Error deleting task:', err);
    return res.status(500).send({ error: 'Internal Server Error' });
  }
});

/* ------------------------------------------------------------------
   TEAM LIST ROUTES (admin-only for write ops)
-------------------------------------------------------------------*/

/**
 * GET /teams/:teamId/lists
 * Purpose: Get all lists in a team (viewer+)
 */
app.get(
  '/teams/:teamId/lists',
  authenicate,
  authorizeTeam(['viewer', 'editor', 'admin']),
  async (req, res) => {
    try {
      const lists = await List.find({ teamId: req.params.teamId });
      res.status(200).send(lists);
    } catch (err) {
      console.error('Error fetching team lists:', err);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

/**
 * POST /teams/:teamId/lists
 * Purpose: Create a new list in the team (admin-only)
 */
app.post(
  '/teams/:teamId/lists',
  authenicate,
  authorizeTeam(['admin']),
  async (req, res) => {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).send({ error: 'Title is required' });
    }

    try {
      const newList = new List({
        title,
        teamId: req.params.teamId
      });

      await newList.save();
      res.status(201).send(newList);
    } catch (err) {
      console.error('Error creating team list:', err);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

/**
 * PATCH /teams/:teamId/lists/:listId
 * Purpose: Rename a team list (admin-only)
 */
app.patch(
  '/teams/:teamId/lists/:listId',
  authenicate,
  authorizeTeam(['admin']),
  async (req, res) => {
    const { listId, teamId } = req.params;
    const { title } = req.body;

    try {
      const updated = await List.findOneAndUpdate(
        { _id: listId, teamId },
        { $set: { title } },
        { new: true }
      );

      if (!updated) {
        return res.status(404).send({ error: 'List not found or unauthorized' });
      }

      res.status(200).send(updated);
    } catch (err) {
      console.error('Error updating team list:', err);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

/**
 * DELETE /teams/:teamId/lists/:listId
 * Purpose: Delete a team list + its tasks (admin-only)
 */
app.delete(
  '/teams/:teamId/lists/:listId',
  authenicate,
  authorizeTeam(['admin']),
  async (req, res) => {
    const { listId, teamId } = req.params;

    try {
      const deleted = await List.findOneAndDelete({ _id: listId, teamId });

      if (!deleted) {
        return res.status(404).send({ error: 'List not found or unauthorized' });
      }

      await deleteTasksFromList(listId);
      res.status(200).send({ message: 'List and its tasks deleted', deleted });
    } catch (err) {
      console.error('Error deleting team list:', err);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

/* ------------------------------------------------------------------
   TEAM TASK ROUTES (with role guards and teamId fix)
-------------------------------------------------------------------*/

/**
 * GET /teams/:teamId/lists/:listId/tasks  (viewer+)
 */
app.get(
  '/teams/:teamId/lists/:listId/tasks',
  authenicate,
  authorizeTeam(['viewer', 'editor', 'admin']),
  async (req, res) => {
    try {
      const { listId } = req.params;

      // Confirm list belongs to this team
      const list = await List.findOne({ _id: listId, teamId: req.params.teamId });
      if (!list) return res.status(404).send({ error: 'List not found or unauthorized' });

      const tasks = await Task.find({ _listId: listId });
      res.status(200).send(tasks);
    } catch (err) {
      console.error('Error fetching team tasks:', err);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
);


/**
 * POST /teams/:teamId/lists/:listId/tasks  (editor+)
 */
app.post(
  '/teams/:teamId/lists/:listId/tasks',
  authenicate,
  authorizeTeam(['editor', 'admin']),
  async (req, res) => {
    const { title, priority = 0, dueDate = null } = req.body;
    const { listId, teamId } = req.params;

    try {
      const list = await List.findOne({ _id: listId, teamId });
      if (!list) return res.status(404).send({ error: 'List not found or unauthorized' });

      const newTask = new Task({
        title,
        _listId: listId,
        _teamId: teamId,
        priority,
        dueDate
      });

      await newTask.save();
      res.status(201).send(newTask);
    } catch (err) {
      console.error('Error creating team task:', err);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
);


/**
 * PATCH /teams/:teamId/lists/:listId/tasks/:taskId  (editor+)
 */
app.patch(
  '/teams/:teamId/lists/:listId/tasks/:taskId',
  authenicate,
  authorizeTeam(['editor', 'admin']),
  async (req, res) => {
    const { teamId, listId, taskId } = req.params;

    if (![listId, taskId].every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).send({ error: 'Invalid listId or taskId format' });
    }

    try {
      const list = await List.findOne({ _id: listId, teamId });
      if (!list) return res.status(404).send({ error: 'List not found or unauthorized' });

      const updatedTask = await Task.findOneAndUpdate(
        { _id: taskId, _listId: listId },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!updatedTask) {
        return res.status(404).send({ error: 'Task not found or unauthorized' });
      }

      res.status(200).send(updatedTask);
    } catch (err) {
      console.error('Error updating team task:', err);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
);


/**
 * DELETE /teams/:teamId/lists/:listId/tasks/:taskId  (editor+)
 */
app.delete(
  '/teams/:teamId/lists/:listId/tasks/:taskId',
  authenicate,
  authorizeTeam(['editor', 'admin']),
  async (req, res) => {
    const { teamId, listId, taskId } = req.params;

    if (![listId, taskId].every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).send({ error: 'Invalid listId or taskId format' });
    }

    try {
      const list = await List.findOne({ _id: listId, teamId });
      if (!list) return res.status(404).send({ error: 'List not found or unauthorized' });

      const removedTask = await Task.findOneAndDelete({ _id: taskId, _listId: listId });
      if (!removedTask) {
        return res.status(404).send({ error: 'Task not found or unauthorized' });
      }

      res.status(200).send({ message: 'Task deleted successfully', removedTask });
    } catch (err) {
      console.error('Error deleting team task:', err);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

/* ------------------------------------------------------------------
   SHARED HELPER
-------------------------------------------------------------------*/

/**
 * deleteTasksFromList(listId)
 * Purpose: Remove every task under a deleted list (solo or team)
 */
async function deleteTasksFromList(listId) {
  try {
    await Task.deleteMany({ _listId: listId });
  } catch (err) {
    console.error(`Error deleting tasks for list ${listId}:`, err);
  }
}

// USER ROUTES

/**
 * POST /users
 * Purpose: Sign Up
 */
app.post('/users', (req, res) => {
  const body = req.body;

  if (!body.email || !body.password) {
    return res.status(400).send({ error: "Email and password are required" });
  }

  const newUser = new User(body);

  User.findOne({ email: body.email })
    .then((existingUser) => {
      if (existingUser) {
        return Promise.reject({ error: "Email already exists" });
      }
      return newUser.save();
    })
    .then(() => newUser.createSession())
    .then((refreshToken) => {
      return newUser.generateAccessAuthToken().then((accessToken) => {
        return { accessToken, refreshToken };
      });
    })
    .then((authTokens) => {
      const sanitizedUser = newUser.toObject();
      delete sanitizedUser.password; // Ensure password is not sent in the response

      res
        .header('x-refresh-token', authTokens.refreshToken)
        .header('x-access-token', authTokens.accessToken)
        .send(sanitizedUser);
    })
    .catch((e) => {
      console.error("Login Error:", e);
      let message = typeof e === 'string'
        ? e
        : e.error || e.message || "Invalid email or password";
      res.status(400).send({ error: message });
    });
});

/**
 * POST /users/login
 * Purpose: Login
 */
app.post('/users/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ error: "Email and password are required" });
  }
  
  User.findByCredentials(email, password)
    .then((user) => {
      return user.createSession().then((refreshToken) => {
        return user.generateAccessAuthToken().then((accessToken) => {
          return { accessToken, refreshToken, user };
        });
      });
    })
    .then(({ accessToken, refreshToken, user }) => {
      const sanitizedUser = user.toObject();
      delete sanitizedUser.password; // Remove password before sending response
      
      res
      .header('x-refresh-token', refreshToken)
      .header('x-access-token', accessToken)
      .send({
        _id: sanitizedUser._id,
        email: sanitizedUser.email,
        accessToken,
          refreshToken,
        });
    })
    .catch((e) => {
      console.error("Login Error:", e);
      let message = typeof e === 'string'
        ? e
        : e.error || e.message || "Invalid email or password";
      res.status(400).send({ error: message });
    });
  });
  
  /**
   * GET /users/me/access-token
 * Purpose: Generate and return an access token
 */
app.get('/users/me/access-token', VerifySession, (req, res) => {
  req.userObject
    .generateAccessAuthToken()
    .then((accessToken) => {
      res.set('x-access-token', accessToken).send({ accessToken });
    })
    .catch((e) => {
      res.status(400).send({ error: 'Failed to generate access token', details: e });
    });
});

app.post('/users/google-signin', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).send({ error: "Google credential is required" });
  }

  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name;

    if (!email) {
      return res.status(400).send({ error: "Invalid Google credential" });
    }

    // ✅ Use GoogleUser model instead of User
    let user = await GoogleUser.findOne({ email });
    if (!user) {
      user = new GoogleUser({ email, name });
      await user.save();
    }

    // ✅ Uses methods defined in googleuser.model.js
    const refreshToken = await user.createSession();
    const accessToken = await user.generateAccessAuthToken();

    res
      .header('x-refresh-token', refreshToken)
      .header('x-access-token', accessToken)
      .send({
        _id: user._id,
        email: user.email,
        name: user.name,
        accessToken,
        refreshToken,
      });

  } catch (err) {
    console.error("Google Sign-In failed:", err);
    res.status(400).send({ error: "Google Sign-In failed", details: err.message });
  }
});



const { OAuth2Client } = require('google-auth-library');

// Load the Client ID from environment variables
const CLIENT_ID = process.env.CLIENT_ID;

// Initialize the OAuth2Client with credentials
const oAuth2Client = new OAuth2Client(CLIENT_ID);

/**
 * GET /users/me/token-id
 * Purpose: Generate and return a token ID
 */
app.get('/users/me/token-id', VerifySession, (req, res) => {
  req.userObject
    .generateTokenId()
    .then((tokenId) => {
      res.set('x-token-id', tokenId).send({ tokenId });
    })
    .catch((e) => {
      res.status(400).send({ error: 'Failed to generate token ID', details: e });
    });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}

// AI Schedular routes

/**
 * POST /ai/schedule
 * Purpose: Generate and return a schedule for user
 */
const axios = require('axios');

app.post('/ai/schedule', authenicate, async (req, res) => {
  try {
    const { tasks } = req.body;
    const { data } = await axios.post('http://localhost:5001/api/schedule', { tasks });
    res.status(200).json(data);
  } catch (err) {
    console.error("AI Scheduler Error:", err.toString());
    res.status(err.response?.status || 500).send({ error: 'AI service failed' });
  }
});

// CREATE A NEW TEAM (you become admin)
app.post('/teams', authenicate, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send({ error: 'Name is required' });

  // auto-generate code via shortid
  const code = shortid.generate();
  const team = new Team({
    name,
    code,
    memberships: [{ userId: req.user_id, role: 'admin' }]
  });
  await team.save();
  res.status(201).send(team);
});

// JOIN A TEAM by code
app.post('/teams/join', authenicate, async (req, res) => {
  const { code } = req.body;
  const team = await Team.findOne({ code });
  if (!team) return res.status(404).send({ error: 'Team not found' });

  // prevent duplicate
  if (team.memberships.some(m => m.userId.equals(req.user_id))) {
    return res.status(400).send({ error: 'Already a member' });
  }

  team.memberships.push({ userId: req.user_id, role: 'viewer' });
  await team.save();
  res.send(team);
});

// LIST YOUR TEAMS
app.get('/teams', authenicate, async (req, res) => {
  const teams = await Team.find({ 'memberships.userId': req.user_id });
  res.send(teams);
});

/**
 * GET /teams/:teamId/members
 * Purpose: list all members + roles
 */
app.get('/teams/:teamId/members', authenicate, async (req, res) => {
  const team = await Team.findById(req.params.teamId)
    .populate('memberships.userId', 'email name');
  if (!team) return res.status(404).send({ message: 'Team not found' });
  res.send(team.memberships);
});

/**
 * PATCH /teams/:teamId/members/:userId
 * Purpose: update a member's role
 */
app.patch('/:teamId/members/:userId', authenicate, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'editor', 'viewer'].includes(role))
    return res.status(400).send({ message: 'Invalid role' });

  const team = await Team.findById(req.params.teamId);
  if (!team) return res.status(404).send({ message: 'Team not found' });

  // Only allow if current user is admin
  const requestingMember = team.members.find(m => m.userId.toString() === req.user._id);
  if (!requestingMember || requestingMember.role !== 'admin')
    return res.status(403).send({ message: 'Only admin can change roles' });

  // Find and update the target user
  const memberToUpdate = team.members.find(m => m.userId.toString() === req.params.userId);
  if (!memberToUpdate) return res.status(404).send({ message: 'User not in team' });

  memberToUpdate.role = role;
  await team.save();
  res.send({ message: 'Role updated' });
});

const { sendEmail } = require('./utils/sendEmail');

// KICK A MEMBER from the team
// Only admins can kick members
app.delete('/:teamId/members/:userId', authenicate, async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  const userToRemove = await User.findById(req.params.userId);

  if (!team || !userToRemove) return res.status(404).send({ message: 'Invalid team or user' });

  const requester = team.members.find(m => m.userId.toString() === req.user._id);
  if (!requester || requester.role !== 'admin') return res.status(403).send({ message: 'Forbidden' });
  if (req.user._id === req.params.userId) return res.status(400).send({ message: 'Cannot kick yourself' });

  team.members = team.members.filter(m => m.userId.toString() !== req.params.userId);
  await team.save();

  // ⛳ Send email
  await sendEmail({
    to: userToRemove.email,
    subject: `You were removed from team "${team.name}"`,
    text: `Hello ${userToRemove.name || 'User'},\n\nYou have been removed from the team "${team.name}" by an admin.\n\nIf this was a mistake, please contact your team admin.\n\n- TaskFlow`,
  });

  res.send({ message: 'User removed and notified' });
});


module.exports = app;