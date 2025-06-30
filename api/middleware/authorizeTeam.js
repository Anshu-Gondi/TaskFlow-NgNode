// middleware/authorizeTeam.js
const { Team } = require('../db/models/index');

const authorizeTeam = (roles=['viewer']) => async (req, res, next) => {
  const teamId = req.params.teamId || req.body.teamId;
  if (!teamId) return res.status(400).send({ error: 'teamId required' });

  const team = await Team.findById(teamId);
  if (!team) return res.status(404).send({ error: 'Team not found' });

  const role = team.getUserRole(req.user_id);
  if (!role || !roles.includes(role)) {
    return res.status(403).send({ error: 'Insufficient permissions' });
  }
  req.team = team;
  req.userRole = role;
  next();
};

module.exports = { authorizeTeam };
