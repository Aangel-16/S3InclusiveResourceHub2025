//adminRoute
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { Category, Resource } = require("../models/adminModel");
const { User } = require("../models/userModel");
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




//============================================= Admin Dashboard ==============================
//GET: Show admin dashboard
router.get("/adminDashboard", async (req, res) => {
    try {
        // 1. Fetch categories to populate the "Add Resource" sidebar dropdown
        const categories = await Category.find().select("name");

        // 2. Render the dashboard, passing the categories data
        res.render("admin/adminDashboard", { categories: categories });
    } catch (err) {
        console.error("Error loading admin dashboard/categories:", err);
        // Render dashboard even if categories fail to load, passing an empty array
        res.render("admin/adminDashboard", { categories: [] });
    }
});


//============================================ MANAGE USERS ==================================
//GET: Show add user form
router.get("/addUser", (req, res) => {
  //check if logged-in user is admin
  if (req.session.role !== "admin") {
    return res.status(403).send("Access denied. Admins only.");
  }
  res.render("admin/addUser"); 
});


// POST:Handle Add User Form Submission
router.post("/addUser", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, role } = req.body;

    // 1. Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
      return res.status(400).send("All required fields must be filled.");
    }
    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists with this email.");
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone: phone || "",   //  avoid schema error if left empty
      password: hashedPassword,
      role, // "admin" or "teacher"
    });

    await newUser.save();

    console.log(" User created by Admin:", newUser);

    // 5. Redirect to dashboard
    res.redirect("/admin/adminDashboard");

  } catch (err) {
    console.error("Add User Error:", err);

    if (err.code === 11000) {
      // Duplicate email error
      return res.status(400).send("Email already registered.");
    }

    res.status(500).send("Server error while adding user.");
  }
});


// Special Educators - List , Restrict access
router.get("/listEducators", async (req, res) => {
  try {
    // Restrict access to admin only
    if (!req.session.userId || req.session.role !== "admin") {
      return res.status(400).send("Access denied. Admins only.");
    }

    // Query for users with role 'teacher' OR 'admin', selecting fields needed for modal
    const educators = await User.find({ 
      $or: [{ role: "teacher" }, { role: "admin" }] 
    }).select(
      "firstName lastName email phone role profile isActive createdAt"
    );

    // Render the view with the educators data
    res.render("admin/listEducators", { educators });

  } catch (err) {
    console.error("Error fetching educators:", err);
    res.status(500).send("Error while fetching educators.");
  }
});




//============================================= Manage and Add Resource =============================================


//View Resource Library (FIXED: Added data fetching and logic)
router.get("/resourceLibrary", async (req, res) => {
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
        res.render("admin/resourceLibrary", { 
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


// GET: Show Add Resource Form
router.get("/addResource", async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== "admin") {
            return res.status(403).send("Access denied. Admins only.");
        }

        const categories = await Category.find();
        res.render("admin/addResources", { categories });
    } catch (err) {
        console.error("DB ERROR: Category.find() failed:", err);
        res.render("admin/addResources", { categories: [] });
    }
});

// POST: Handle Add Resource Form Submission (Uses Multer)
router.post("/addResource", upload.single("file"), async (req, res, next) => {
    try {
        if (!req.session.userId || req.session.role !== "admin") {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).send("Access denied. Admins only.");
        }

        console.log("Form data received:", req.body);

        const { title, description, category, type } = req.body;
        const uploadedFile = req.file;

        // Validation
        if (!title || !description || !category || !type) {
            if (uploadedFile) fs.unlinkSync(uploadedFile.path);
            return res
                .status(400)
                .send("Title, Description, Category, and Type are required.");
        }

        if (!uploadedFile) {
            return res.status(400).send("A file must be uploaded for the resource.");
        }

        // Store only the filename (not the full path)
        const resourceUrl = uploadedFile.filename;
        const resourceType = type;

        const newResource = new Resource({
            title,
            description,
            category,
            type: resourceType,
            url: resourceUrl,
            uploadedBy: req.session.userId,
            approved: true, // Auto-approve admin uploads
        });

        await newResource.save();

        console.log(" Resource file added successfully:", newResource);
        res.redirect("/admin/resourceLibrary");
    } catch (err) {
        if (
            err instanceof multer.MulterError ||
            err.message.includes("Only PDF, Image, and Video files are allowed!")
        ) {
            return res.status(400).send(`File Upload Error: ${err.message}`);
        }

        console.error(" Error adding resource:", err);
        next(err);
    }
});



// POST/GET: Handle Delete Resource
router.get("/deleteResource/:id", async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== "admin") {
            return res.status(403).send("Access denied. Admins only.");
        }

        const resourceId = req.params.id;
        
        // 1. Find the resource to get the file path
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).send("Resource not found.");
        }

        // 2. Delete the physical file from the server, if a file exists (not a link/URL)
        if (resource.url && !resource.url.startsWith('http')) {
            const filePath = path.join(uploadDir, resource.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(` Deleted file: ${resource.url}`);
            }
        }
        
        // 3. Delete the resource from the database
        await Resource.findByIdAndDelete(resourceId);

        console.log(` Resource deleted: ${resourceId}`);
        // Optionally, add a flash message here before redirecting
        res.redirect("/admin/resourceLibrary");

    } catch (err) {
        console.error(" Error deleting resource:", err);
        res.status(500).send("Server error while deleting resource.");
    }
});



// POST: Handle Edit Resource Form Submission (Uses Multer if a new file is uploaded)
router.post("/editResource/:id", upload.single("file"), async (req, res, next) => {
    let uploadedFile = req.file;
    try {
        if (!req.session.userId || req.session.role !== "admin") { if (uploadedFile) fs.unlinkSync(uploadedFile.path); return res.status(403).send("Admins only."); }

        const resourceId = req.params.id;
        const { title, description, category, type, url: externalUrl } = req.body; 

        if (!title || !description || !category || !type) { if (uploadedFile) fs.unlinkSync(uploadedFile.path); return res.status(400).send("All required fields missing."); }

        const existingResource = await Resource.findById(resourceId);
        if (!existingResource) { if (uploadedFile) fs.unlinkSync(uploadedFile.path); return res.status(404).send("Resource not found."); }

        let updateData = { title, description, category, type, notes: req.body.notes, tags: req.body.tags, feedback: req.body.feedback };

        if (uploadedFile) {
            if (existingResource.url && !existingResource.url.startsWith('http')) {
                const oldFilePath = path.join(uploadDir, existingResource.url);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }
            updateData.url = uploadedFile.filename;
        } else if (type === 'link' || type === 'video') {
            updateData.url = externalUrl || '';
            if (existingResource.url && !existingResource.url.startsWith('http') && existingResource.type !== type) {
                const oldFilePath = path.join(uploadDir, existingResource.url);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }
        } else updateData.url = existingResource.url;

        await Resource.findByIdAndUpdate(resourceId, updateData, { new: true });
        res.redirect("/admin/resourceLibrary");
    } catch (err) {
        if (uploadedFile) fs.unlinkSync(uploadedFile.path);
        console.error(err);
        next(err);
    }
});



//======================  Manage content category =======================================

/// GET: View contentCategory page, fetching all categories
router.get("/contentCategory", async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== "admin") {
            return res.status(403).send("Access denied. Admins only.");
        }

        // Fetch all categories from the database
        const categories = await Category.find().sort({ name: 1 }); // Sort alphabetically

        // Render the view, passing the fetched categories
        res.render("admin/contentCategory", { categories: categories });
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).send("Error while fetching categories.");
    }
});


// POST: Handle Add category form submission (remains unchanged)
router.post("/addCategory", async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== "admin") { return res.status(403).send("Access denied. Admins only."); }
        
        const { name, description } = req.body;
        if (!name) { return res.status(400).send("Category name is required."); }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) { return res.status(400).send("Category already exists."); }

        const newCategory = new Category({ name, description });
        await newCategory.save();
        console.log(" Category Added:", newCategory);

        res.redirect("/admin/contentCategory"); 
    } catch (err) {
        console.error("Error adding category:", err);
        res.status(500).send("Error while adding category.");
    }
});


// POST: Handle Edit Category form submission
router.post("/editCategory/:id", async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== "admin") {
            return res.status(403).send("Access denied. Admins only.");
        }

        const categoryId = req.params.id;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).send("Category name is required for update.");
        }

        // Check for duplicate name, excluding the current category
        const existingCategory = await Category.findOne({ name, _id: { $ne: categoryId } });
        if (existingCategory) {
            return res.status(400).send("Another category with this name already exists.");
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { name, description },
            { new: true, runValidators: true } // Return the updated document and run validation
        );

        if (!updatedCategory) {
            return res.status(404).send("Category not found.");
        }

        console.log("Category Updated:", updatedCategory);
        res.redirect("/admin/contentCategory");
    } catch (err) {
        console.error("Error updating category:", err);
        res.status(500).send("Server error while updating category.");
    }
});


// POST: Handle Delete Category
router.post("/deleteCategory/:id", async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== "admin") {
            return res.status(403).send("Access denied. Admins only.");
        }

        const categoryId = req.params.id;

        // OPTIONAL: Check if any resources are linked to this category.
        // If there are resources, you might prevent deletion or move them to 'Uncategorized'.
        const resourceCount = await Resource.countDocuments({ category: categoryId });
        if (resourceCount > 0) {
            return res.status(400).send(`Cannot delete category. ${resourceCount} resource(s) are still linked to it.`);
        }

        const deletedCategory = await Category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).send("Category not found.");
        }

        console.log("Category Deleted:", deletedCategory);
        res.redirect("/admin/contentCategory");
    } catch (err) {
        console.error("Error deleting category:", err);
        res.status(500).send("Server error while deleting category.");
    }
});

//======================  Manage Reviews =======================================

//Manage Review
router.get("/review", async (req, res) => {
  res.render("admin/viewReview");
});


//Export the router
module.exports = router;  
