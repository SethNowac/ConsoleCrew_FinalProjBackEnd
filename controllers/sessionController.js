const express = require("express");
const { Session, createSession, getSession, deleteSession } = require("./Session");
const { checkCredentials } = require("./userController");
const router = express.Router();
const routeRoot = "/session";

const logger = require("../logger");

router.post("/login", loginUser);

/** Log a user in and create a session cookie that will expire in 2 minutes */
async function loginUser(request, response) {
    const username = request.body.username;
    const password = request.body.password;

    if (username && password) {
        const credentials = await checkCredentials(username, password);
        if (credentials.isSame) {
            logger.info("Successful login for user " + username);
            // Create a session object that will expire in 30 minutes
            const sessionId = createSession(username, 30);

            // Save cookie that will expire.
            response.cookie("sessionId", sessionId, { expires: getSession(sessionId).expiresAt, httpOnly: true });
            response.cookie("userId", credentials.id, { expires: getSession(sessionId).expiresAt, httpOnly: true });
            response.sendStatus(200); //Succeeded in logging in
            return; // Put this here to prevent two statuses from being sent
        } else {
            logger.error("Unsuccessful login: Invalid username / password for user: " + username);
        }
    } else {
        logger.error("Unsuccessful login: Empty username or password given!");
    }
    response.sendStatus(401); // Redirect to main page
};

router.get('/logout', logoutUser);

function logoutUser(request, response) {
    const authenticatedSession = authenticateUser(request);
    if (!authenticatedSession) {
        response.sendStatus(401); // Unauthorized access
        return;
    }
    deleteSession(authenticatedSession.sessionId)
    logger.info("Logged out user " + authenticatedSession.userSession.username);

    // "erase" cookie by forcing it to expire.
    response.cookie("sessionId", "", { expires: new Date(), httpOnly: true });
    response.cookie("userId", "", { expires: new Date(), httpOnly: true });
    response.sendStatus(401);
};

function authenticateUser(request) {
    // If this request doesn't have any cookies, that means it isn't authenticated. Return null.
    if (!request.cookies) {
        return null;
    }
    // We can obtain the session token from the requests cookies, which come with every request
    const sessionId = request.cookies['sessionId']
    if (!sessionId) {
        // If the cookie is not set, return null
        return null;
    }
    // We then get the session of the user from our session map
    userSession = getSession(sessionId);
    if (!userSession) {
        return null;
    } // If the session has expired, delete the session from our map and return null
    if (userSession.isExpired()) {
        deleteSession(sessionId);
        return null;
    }
    return { sessionId, userSession }; // Successfully validated.
}

function refreshSession(request, response) {
    const authenticatedSession = authenticateUser(request);
    if (!authenticatedSession) {
        response.sendStatus(401); // Unauthorized access
        return;
    }
    // Create and store a new Session object that will expire in 2 minutes.
    const newSessionId = createSession(authenticatedSession.userSession.username, 2);
    // Delete the old entry in the session map 
    deleteSession(authenticatedSession.sessionId);

    // Set the session cookie to the new id we generated, with a
    // renewed expiration time
    response.cookie("sessionId", newSessionId, { expires: getSession(newSessionId).expiresAt, httpOnly: true })
    return newSessionId;
}

router.get("/auth", authUser);
function authUser(request, response) {
    try {
        const authenticatedSession = authenticateUser(request);
        if (!authenticatedSession) {
            response.sendStatus(401);
        } else {
            response.sendStatus(200);
        }
    } catch (error) {
        response.sendStatus(401);
    }
}



module.exports = { router, routeRoot, authenticateUser, refreshSession };

