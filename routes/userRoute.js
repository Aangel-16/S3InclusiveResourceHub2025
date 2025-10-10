//userRoute.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const multer = require("multer");

// Import User model
const {User, CommunityPost } = require("../models/userModel"); 
const { Category, Resource } = require("../models/adminModel");

function getMockUser(req) {
    return { _id: '60f8b1a8f9c1d0a5b4e7f3a2', firstName: 'Learner', lastName: 'User' }; 
}

const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

//============================================= Multer Setup =============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });



// ===================================== USER DASHBOARD ====================================================
//View UserDashboard
router.get("/userDashboard", (req, res) => {
  res.render("user/userDashboard");
});


//user Views Guidelines
router.get("/viewGuidelines", (req, res) => { //define the route for the corresponding ejs file
  res.render("user/viewGuidelines"); // Mention the ejs file to be rendered
});



//============================================= COMMUNITY FORUM ROUTES =============================================

// View Community Forum
router.get("/communityHub", async (req, res) => {
    try {
        // Fetch all community posts, populating the user data for the initial post and all replies
        const posts = await CommunityPost.find({})
            .populate('postedBy', 'firstName lastName') // Get name of post creator
            .populate('replies.userId', 'firstName lastName') // Get name of reply creators
            .sort({ createdAt: -1 }) // Newest posts first
            .lean();

        res.render("user/community", { 
            posts: posts // Pass posts to EJS template
        });
    } catch (err) {
        console.error("Error fetching community posts:", err);
        // Render with an empty array to prevent EJS crash
        res.render("user/community", { posts: [] });
    }
});


// Create a New Post
router.post("/community/post", async (req, res) => {
    try {
        const { title, content } = req.body;
        const currentUser = getMockUser(req);
        const postedBy = currentUser._id; // Valid ObjectId string

        if (!title || !content) {
            console.warn("Attempt to create a post without title or content.");
            return res.redirect("/user/communityHub"); 
        }

        const newPost = new CommunityPost({ postedBy, title, content });
        await newPost.save();

        // Redirect to view updated posts
        res.redirect("/user/communityHub");
    } catch (err) {
        console.error("Error creating new community post:", err);
        res.redirect("/user/communityHub"); 
    }
});


// Add Reply to Post
router.post("/community/reply/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        const { replyText } = req.body;
        const currentUser = getMockUser(req);
        const userId = currentUser._id; // Valid ObjectId string

        if (!replyText) {
            return res.redirect("/user/communityHub");
        }

        const updatedPost = await CommunityPost.findByIdAndUpdate(
            postId,
            { $push: { replies: { userId, text: replyText } } },
            { new: true }
        );

        if (!updatedPost) {
            return res.redirect("/user/communityHub");
        }

        // Redirect to view updated post
        res.redirect("/user/communityHub");
    } catch (err) {
        console.error("Error submitting reply:", err);
        res.redirect("/user/communityHub"); 
    }
});


//============================== MANAGE RESOURCES - VIEW DOWNLOAD SEARCH ===================================

// Route to View All Resources (Guidelines Page)
router.get("/viewResources", async (req, res) => {
    try {
        // 1. Define all static flashcards/interactives
        const staticFlashcards = [
            { _id: 'html_alpha_1', title: 'Alphabet Flashcards', type: 'HTML Flashcard', description: 'Interactive A-Z learning cards.', slug: 'alphabet' },
            { _id: 'html_alpha_2', title: 'Alphabet Worksheet', type: 'HTML Flashcard', description: 'Fun printable and digital worksheet.', slug: 'alphabet-worksheet' },
            { _id: 'html_animal_1', title: 'Animal Cards', type: 'HTML Flashcard', description: 'Flashcards featuring various animals.', slug: 'animals' },
            { _id: 'html_animal_2', title: 'Animal Voice Match', type: 'HTML Flashcard', description: 'Match animals to their sounds.', slug: 'animal-voices' },
            { _id: 'html_daily_1', title: 'Daily Routine Cards', type: 'HTML Flashcard', description: 'Cards to visualize a daily schedule.', slug: 'daily-routine' },
            { _id: 'html_emotion_1', title: 'Emotion Flashcards', type: 'HTML Flashcard', description: 'Learn about different feelings.', slug: 'emotions' },
            { _id: 'html_traffic_1', title: 'Traffic Light Card', type: 'HTML Flashcard', description: 'Interactive lesson on traffic lights.', slug: 'traffic-light' },
            { _id: 'html_math_1', title: 'Fundamental Algebra', type: 'HTML Flashcard', description: 'Interactive lesson on variables and expressions.', slug: 'algebra-intro' },
            { _id: 'html_history_1', title: 'Roman Empire Overview', type: 'HTML Flashcard', description: 'Interactive map and timeline activity.', slug: 'roman-empire' }
        ];

        // NEW: Define all static games, matching the EJS file structure in /views/admin/games
        const staticGames = [
            { _id: 'game_puzzle_1', title: 'Inclusive Pattern Puzzle', type: 'HTML Game', description: 'Drag and drop inclusive patterns.', slug: 'inclusive-pattern-puzzle' },
            { _id: 'game_memory_1', title: 'Memory Match Game', type: 'HTML Game', description: 'Test your memory skills by matching pairs.', slug: 'memory-match-game' },
            { _id: 'game_shapes_1', title: 'Shapes Puzzle', type: 'HTML Game', description: 'Interactive shapes matching puzzle.', slug: 'shapes-puzzle' }
        ];

        // 2. Fetch all categories for the sidebar dropdown
        const categories = await Category.find().select("name");

        // 3. Fetch only database resources
        const dbResources = await Resource.find({})
            .populate('category', 'name')
            .lean();

        // 4. Group DB resources by category
        const dbGroupedResources = {};
        dbResources.forEach(res => {
            let categoryName = (res.category && res.category.name) ? res.category.name : "Uncategorized Database Files";
            if (!dbGroupedResources[categoryName]) {
                dbGroupedResources[categoryName] = [];
            }
            dbGroupedResources[categoryName].push(res);
        });

        // 5. Render the view, passing separate objects for static interactives, static games, and DB resources
        res.render("user/viewResources", { 
            staticResources: staticFlashcards,
            staticGames: staticGames, // NEWLY ADDED
            dbGroupedResources: dbGroupedResources,
            categories: categories
        });

    } catch (err) {
        console.error("Error fetching resources or categories for library:", err);
        res.status(500).send("Error while fetching resources."); 
    }
});

// Route to View a Specific Resource (e.g., in a detail page or as a preview)
router.get("/resource/view/:id", async (req, res) => {
  try {
    const resourceId = req.params.id;
    const resource = await Resource.findById(resourceId);

    if (!resource || !resource.approved) {
      return res.status(404).send("Resource not found or not approved.");
    }
    
    // For simplicity, we'll just render a dedicated view page and pass the resource data.
    // In a real app, 'video' types might use the 'url' as a source, 'pdf' might use an iframe.
    res.render("user/resourceDetail", { resource: resource }); 
    
  } catch (error) {
    console.error("Error viewing resource:", error);
    res.status(500).send("Server Error viewing resource.");
  }
});


// Route to Download a Resource
router.get("/resource/download/:id", async (req, res) => {
  try {
    const resourceId = req.params.id;
    const resource = await Resource.findById(resourceId);

    if (!resource || !resource.approved) {
      return res.status(404).send("Resource not found or not approved.");
    }

    // Assuming the resource.url stores the unique filename in the /public/uploads directory
    const filePath = path.join(uploadDir, resource.url);
    
    // Check if the file exists on the server
    if (fs.existsSync(filePath)) {
      // res.download sends the file as an attachment
      res.download(filePath, resource.title + path.extname(resource.url)); 
    } else {
      res.status(404).send("File not found on server.");
    }

  } catch (error) {
    console.error("Error downloading resource:", error);
    res.status(500).send("Server Error during download.");
  }
});


module.exports = router;
