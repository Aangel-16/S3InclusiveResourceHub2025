const express = require("express");
const router = express.Router();
const path = require("path");

// 1. Manual map from URL slug to EJS view path and title
// 'view' paths are relative to your 'views' directory (e.g., 'flashcards/alphabet_flashcards' 
// maps to 'views/flashcards/alphabet_flashcards.ejs').
const flashcardMap = {
    'alphabet': { view: 'flashcards/alphabet_flashcards', title: 'Alphabet Flashcards' },
    'alphabet-worksheet': { view: 'flashcards/alphabet_worksheet', title: 'Alphabet Worksheet' },
    'animals': { view: 'flashcards/animal_flashcards', title: 'Animal Flashcards' },
    'animal-voices': { view: 'flashcards/animal_voice_flashcards', title: 'Animal Voice Cards' },
    'daily-routine': { view: 'flashcards/daily_routine_cards', title: 'Daily Routine Cards' },
    'emotions': { view: 'flashcards/emotion_flashcards', title: 'Emotion Flashcards' },
    'traffic-light': { view: 'flashcards/traffic_light_flashcard', title: 'Traffic Light Card' },
    'algebra-intro': { view: 'flashcards/algebra', title: 'Fundamental Algebra' },
    'roman-empire': { view: 'flashcards/roman', title: 'Roman Empire Overview' }
};

// Route to handle the dynamic part of the URL (e.g., '/alphabet', '/roman-empire')
// Since this router will be mounted at '/flashcards' in app.js, the full path is /flashcards/:slug
router.get('/:slug', (req, res) => {
    const slug = req.params.slug;
    const flashcardData = flashcardMap[slug];
    
    if (flashcardData) {
        try {
            // Render the EJS view defined in the map
            res.render(flashcardData.view, { 
                pageTitle: flashcardData.title
                // Add any necessary data required by the flashcard EJS file here
            });
        } catch (error) {
            // Log the error for debugging and inform the user
            console.error(`🔴 EJS Render Error for slug '${slug}':`, error.message);
            // This often means the EJS file path is WRONG.
            res.status(500).render('error', { 
                pageTitle: 'Error',
                message: `Failed to load interactive. Check server console for details on view: ${flashcardData.view}` 
            });
        }
    } else {
        // Handle 404 if slug not found in the map
        console.warn(`Flashcard not found for slug: ${slug}`);
        res.status(404).render('404', { pageTitle: '404', message: 'Interactive resource not found.' });
    }
});

module.exports = router; // Essential: Export the router