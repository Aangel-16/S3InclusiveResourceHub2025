//games.js router file

const express = require("express");
const router = express.Router();
const path = require("path");

/**
 * Game Routes
 * These routes render the static EJS files located in views/games/
 * The paths are corrected to remove the 'admin/' subdirectory.
 */

// GET: /games/inclusive-pattern-puzzle (Renders views/games/inclusive_pattern_puzzle.ejs)
router.get("/inclusive-pattern-puzzle", (req, res) => {
    // Corrected path: views/games/inclusive_pattern_puzzle
    res.render("games/inclusive_pattern_puzzle"); 
});

// GET: /games/memory-match-game (Renders views/games/memory_match_game.ejs)
router.get("/memory-match-game", (req, res) => {
    // Corrected path: views/games/memory_match_game
    res.render("games/memory_match_game");
});

// GET: /games/shapes-puzzle (Renders views/games/shapes_puzzle.ejs)
router.get("/shapes-puzzle", (req, res) => {
    // Corrected path: views/games/shapes_puzzle
    res.render("games/shapes_puzzle");
});

// General route (Handles the case where the slug might be different)
router.get("/:slug", (req, res) => {
    // Replace hyphens in the slug with underscores to match the EJS file naming convention
    const filename = req.params.slug.replace(/-/g, '_');
    
    // Attempt to render the EJS file based on the adjusted slug
    res.render(`games/${filename}`, (err, html) => {
        if (err) {
            console.error(`Error rendering game ${req.params.slug} (Attempted: views/games/${filename}.ejs):`, err);
            // Log the correct attempted path for better debugging
            return res.status(404).send("Game not found or inaccessible.");
        }
        res.send(html);
    });
});


//Export the router
module.exports = router;