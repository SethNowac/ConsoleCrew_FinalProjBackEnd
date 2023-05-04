const express = require('express');
const { send } = require('express/lib/response');
const router = express.Router();

// Endpoints:

// /projects/:id/notes (get) = get all by project
// /projects/:id/notes/:id (get) = get single
// /projects/:id/notes (post) = create single
// /projects/:id/notes (put) = update
// /projects/Id/notes (delete) = remove