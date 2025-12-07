//adminRoute
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { Category, Resource ,Reply} = require("../models/adminModel");
const { User, Review,CommunityPost } = require("../models/userModel");
//============================================= File Upload Directory =============================================
// Use 'public/uploads/resources' as the target directory
const uploadDir = path.join(__dirname, "../public/uploads/resources");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

//============================================= Multer Setup =============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename: timestamp + random number + original extension
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/pdf|image|video/)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF, Image, and Video files are allowed!"), false);
        }
    },
});

// ===================================== MIDDLEWARE ====================================================

// Middleware to ensure user is logged in AND has the 'admin' role
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        console.log("Access denied: Not an administrator.");
        // Redirect to login or send a 403 Forbidden status
        return res.status(403).redirect("/auth/login"); 
    }
    next();
};

//============================================= Admin Dashboard ==============================
router.get("/adminDashboard", requireAdmin, async (req, res) => {
    try {
        const categories = await Category.find().select("name");
        res.render("admin/adminDashboard", { categories });
    } catch (err) {
        console.error("Error loading dashboard:", err);
        res.render("admin/adminDashboard", { categories: [] });
    }
});

//============================================ MANAGE USERS ==================================
router.get("/addUser", requireAdmin, (req, res) => {
    res.render("admin/addUser");
});

router.post("/addUser", requireAdmin, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, confirmPassword, role } = req.body;

        if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
            return res.status(400).send("All required fields must be filled.");
        }
        if (password !== confirmPassword) {
            return res.status(400).send("Passwords do not match.");
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send("User already exists.");

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName,
            lastName,
            email,
            phone: phone || "",
            password: hashedPassword,
            role,
        });

        await newUser.save();
        res.redirect("/admin/adminDashboard");
    } catch (err) {
        console.error("Add User Error:", err);
        res.status(500).send("Server error while adding user.");
    }
});

// List Educators
router.get("/listEducators", requireAdmin, async (req, res) => {
    try {
        const educators = await User.find({
            $or: [{ role: "teacher" }, { role: "admin" }],
        }).select("firstName lastName email phone role profile isActive createdAt");

        res.render("admin/listEducators", { educators });
    } catch (err) {
        console.error("Error fetching educators:", err);
        res.status(500).send("Error while fetching educators.");
    }
});

//============================================= Resource Library =============================================
router.get("/resourceLibrary", requireAdmin, async (req, res) => {
    try {
        const staticFlashcards = [
            { _id: 'html_alpha_1', title: 'Alphabet Flashcards', type: 'HTML Flashcard', description: 'Interactive A-Z learning cards.', slug: 'alphabet' },
            { _id: 'html_alpha_2', title: 'Alphabet Worksheet', type: 'HTML Flashcard', description: 'Printable worksheet.', slug: 'alphabet-worksheet' },
            { _id: 'html_animal_1', title: 'Animal Cards', type: 'HTML Flashcard', description: 'Animal flashcards.', slug: 'animals' },
            { _id: 'html_daily_1', title: 'Daily Routine Cards', type: 'HTML Flashcard', description: 'Daily routine visuals.', slug: 'daily-routine' },
            { _id:'html_letter_tutorial_1', title: 'Letter Learning Tutorial', type: 'HTML Flashcard', description: 'Tutorial for letter learning.', slug: 'letter_learning_tutorial' }
        ];

        const staticGames = [
            { _id: 'game_puzzle_1', title: 'Inclusive Pattern Puzzle', type: 'HTML Game', description: 'Pattern puzzle.', slug: 'inclusive-pattern-puzzle' },
            { _id: 'game_memory_1', title: 'Memory Match Game', type: 'HTML Game', description: 'Match pairs.', slug: 'memory-match-game' },
        ];

        const categories = await Category.find().select("name");

        const dbResources = await Resource.find({})
            .populate("category", "name")
            .lean();

        const dbGroupedResources = {};
        dbResources.forEach(res => {
            const name = res.category?.name || "Uncategorized";
            if (!dbGroupedResources[name]) dbGroupedResources[name] = [];
            dbGroupedResources[name].push(res);
        });

        res.render("admin/resourceLibrary", {
            staticResources: staticFlashcards,
            staticGames,
            dbGroupedResources,
            categories,
        });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Error loading resource library.");
    }
});

// Add Resource (GET)
router.get("/addResource", requireAdmin, async (req, res) => {
    try {
        const categories = await Category.find();
        res.render("admin/addResources", { categories });
    } catch {
        res.render("admin/addResources", { categories: [] });
    }
});

// Add Resource (POST)
router.post("/addResource", requireAdmin, upload.single("file"), async (req, res, next) => {
    try {
        const { title, description, category, type } = req.body;
        const uploadedFile = req.file;

        if (!title || !description || !category || !type) {
            if (uploadedFile) fs.unlinkSync(uploadedFile.path);
            return res.status(400).send("Missing required fields.");
        }

        if (!uploadedFile) {
            return res.status(400).send("A file must be uploaded.");
        }

        const newResource = new Resource({
            title,
            description,
            category,
            type,
            url: uploadedFile.filename,
            uploadedBy: req.session.user._id,
            approved: true,
        });

        await newResource.save();
        res.redirect("/admin/resourceLibrary");
    } catch (err) {
        console.error("Add Resource Error:", err);
        next(err);
    }
});

/*router.post("/addResource", requireAdmin, upload.single("file"), async (req, res, next) => {
    try {
        const { title, description, category, type, url } = req.body;
        const uploadedFile = req.file;

        if (!title || !description || !category || !type) {
            if (uploadedFile) fs.unlinkSync(uploadedFile.path);
            return res.status(400).send("Missing required fields.");
        }

        // For video/link, a URL is required
        if ((type === "video" || type === "link") && !url) {
            return res.status(400).send("Please provide a video or link URL.");
        }

        // For pdf/image, a file is required
        if ((type === "pdf" || type === "image") && !uploadedFile) {
            return res.status(400).send("A file must be uploaded.");
        }

        const newResource = new Resource({
            title,
            description,
            category,
            type,
            url: type === "video" || type === "link" ? url : uploadedFile.filename,
            uploadedBy: req.session.user._id,
            approved: true,
        });

        await newResource.save();
        res.redirect("/admin/resourceLibrary");
    } catch (err) {
        console.error("Add Resource Error:", err);
        next(err);
    }
});*/


// Delete Resource
router.get("/deleteResource/:id", requireAdmin, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).send("Resource not found.");

        if (resource.url && !resource.url.startsWith("http")) {
            const filePath = path.join(uploadDir, resource.url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await Resource.findByIdAndDelete(req.params.id);
        res.redirect("/admin/resourceLibrary");
    } catch (err) {
        console.error("Error deleting resource:", err);
        res.status(500).send("Server error deleting resource.");
    }
});

// Edit Resource
router.post("/editResource/:id", requireAdmin, upload.single("file"), async (req, res, next) => {
    let uploadedFile = req.file;
    try {
        const resourceId = req.params.id;
        const { title, description, category, type, url: externalUrl } = req.body;

        if (!title || !description || !category || !type) {
            if (uploadedFile) fs.unlinkSync(uploadedFile.path);
            return res.status(400).send("Missing fields.");
        }

        const existingResource = await Resource.findById(resourceId);
        if (!existingResource) {
            if (uploadedFile) fs.unlinkSync(uploadedFile.path);
            return res.status(404).send("Resource not found.");
        }

        let updateData = { title, description, category, type };

        if (uploadedFile) {
            if (existingResource.url && !existingResource.url.startsWith("http")) {
                const oldFilePath = path.join(uploadDir, existingResource.url);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }
            updateData.url = uploadedFile.filename;
        } else if (type === "link" || type === "video") {
            updateData.url = externalUrl || "";
        } else {
            updateData.url = existingResource.url;
        }

        await Resource.findByIdAndUpdate(resourceId, updateData, { new: true });
        res.redirect("/admin/resourceLibrary");

    } catch (err) {
        if (uploadedFile) fs.unlinkSync(uploadedFile.path);
        console.error(err);
        next(err);
    }
});

//====================== Manage Categories ==============================
router.get("/contentCategory", requireAdmin, async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.render("admin/contentCategory", { categories });
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).send("Error loading categories.");
    }
});

router.post("/addCategory", requireAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) return res.status(400).send("Category name required.");

        const exists = await Category.findOne({ name });
        if (exists) return res.status(400).send("Category already exists.");

        await new Category({ name, description }).save();
        res.redirect("/admin/contentCategory");
    } catch (err) {
        console.error("Add Category Error:", err);
        res.status(500).send("Server error.");
    }
});

router.post("/editCategory/:id", requireAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).send("Category name required.");

        const duplicate = await Category.findOne({ name, _id: { $ne: req.params.id } });
        if (duplicate) return res.status(400).send("Category with same name already exists.");

        await Category.findByIdAndUpdate(req.params.id, { name, description });
        res.redirect("/admin/contentCategory");
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).send("Server error.");
    }
});

router.post("/deleteCategory/:id", requireAdmin, async (req, res) => {
    try {
        const resourceCount = await Resource.countDocuments({ category: req.params.id });
        if (resourceCount > 0) {
            return res.status(400).send("Cannot delete category with assigned resources.");
        }

        await Category.findByIdAndDelete(req.params.id);
        res.redirect("/admin/contentCategory");
    } catch (err) {
        console.error("Delete Category Error:", err);
        res.status(500).send("Error deleting category.");
    }
});

//===================================== Manage Reviews ====================================================
router.get("/reviews", requireAdmin, async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate("user", "firstName lastName")
            .sort({ createdAt: -1 })
            .lean();

        res.render("admin/adminViewReviews", {
            reviews,
            currentUser: req.session.user
        });
    } catch (err) {
        console.error("Error loading reviews:", err);
        res.status(500).send("Server Error loading reviews");
    }
});


/*router.post("/reviews/:id/reply", requireAdmin,async (req, res) => {
    try {
        const { replyText } = req.body;
        const reviewId = req.params.id;

        // TODO: Save reply to DB (the Review schema needs a replies field)
        await new Reply({ replyTxt, reviewId }).save();

        console.log("Admin reply submitted:", reviewId, replyText);

        res.redirect("/admin/reviews");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error replying to review");
    }
});*/

router.post("/reviews/:id/reply", requireAdmin, async (req, res) => {
  try {
      const { replyText } = req.body;
      const reviewId = req.params.id;

      await Review.findByIdAndUpdate(
          reviewId,
          {
            $push: {
              replies: {
                text: replyText,
                adminName: req.session.user.firstName
              }
            }
          }
      );

      res.redirect("/admin/reviews");
  } catch (err) {
      console.error("Error replying:", err);
      res.status(500).send("Error replying to review");
  }
});



//===================== Manage Community Hub ===================================
// View all posts + search
router.get("/viewCommunityHub", requireAdmin, async (req, res) => {
    try {
        const search = req.query.search || "";

        const posts = await CommunityPost.find({
            title: { $regex: search, $options: "i" }
        })
        .populate("postedBy", "firstName lastName")
        .populate("replies.userId", "firstName lastName")
        .sort({ createdAt: -1 });

        res.render("admin/viewCommunityHub", {
            posts,
            search,
            currentUser: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Delete a post
router.post("/community/:id/delete", requireAdmin, async (req, res) => {
    try {
        await CommunityPost.findByIdAndDelete(req.params.id);
        res.redirect("/admin/viewCommunityHub");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting post");
    }
});

// Delete a reply
router.post("/community/:postId/reply/:replyId/delete", requireAdmin, async (req, res) => {
    try {
        await CommunityPost.findByIdAndUpdate(
            req.params.postId,
            { $pull: { replies: { _id: req.params.replyId } } }
        );
        res.redirect("/admin/viewCommunityHub");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting reply");
    }
});


//Export the router
module.exports = router;