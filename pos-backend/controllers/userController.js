const createHttpError = require("http-errors");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const register = async (req, res, next) => {
    try {

        const { name, phone, countryCode, email, password, role } = req.body;

        if(!name || !email || !password || !role){
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({email});
        if(isUserPresent){
            const error = createHttpError(400, "Email already exists!");
            return next(error);
        }

        if(phone){
            if(!/^\d+$/.test(phone) || parseInt(phone) < 0) {
                 const error = createHttpError(400, "Phone number must contain only positive digits!");
                 return next(error);
            }
            const isPhonePresent = await User.findOne({phone});
            if(isPhonePresent){
                const error = createHttpError(400, "Phone number already exists!");
                return next(error);
            }
        }

        // Determine initial status
        // First user (Admin) created in the system is Active.
        // Subsequent users are Inactive by default, requiring Admin approval.
        const adminCount = await User.countDocuments({ role: "Admin" });
        let initialStatus = "Inactive";
        if (adminCount === 0 && role === "Admin") {
            initialStatus = "Active";
        }
        
        // If there are no users at all, the first one must be Active (and likely Admin due to frontend restrictions or logical first step)
        // But the prompt emphasizes "primera cuenta de administrador".
        // Let's ensure if it's the very first user, they are Active.
        const userCount = await User.countDocuments({});
        if (userCount === 0) {
             initialStatus = "Active";
        }

        const user = { name, email, password, role, status: initialStatus };
        if(phone) user.phone = phone;
        if(countryCode) user.countryCode = countryCode;
        
        const newUser = User(user);
        await newUser.save();

        const accessToken = jwt.sign({_id: newUser._id}, config.accessTokenSecret, {
            expiresIn : '1d'
        });

        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 *24 * 30,
            httpOnly: true,
            sameSite: 'none',
            secure: true
        })

        res.status(201).json({success: true, message: "New user created!", data: newUser});


    } catch (error) {
        next(error);
    }
}


const login = async (req, res, next) => {

    try {
        
        const { email, password } = req.body;

        if(!email || !password) {
            const error = createHttpError(400, "Todos los campos son obligatorios");
            return next(error);
        }

        const isUserPresent = await User.findOne({email});
        if(!isUserPresent){
            const error = createHttpError(401, "Credenciales inválidas");
            return next(error);
        }

        if(isUserPresent.status === "Inactive"){
            const error = createHttpError(403, "Su cuenta está pendiente de validación. Por favor, espere la aprobación del administrador.");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if(!isMatch){
            const error = createHttpError(401, "Credenciales inválidas");
            return next(error);
        }

        const accessToken = jwt.sign({_id: isUserPresent._id}, config.accessTokenSecret, {
            expiresIn : '1d'
        });

        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 *24 * 30,
            httpOnly: true,
            sameSite: 'none',
            secure: true
        })

        // Fetch permissions for the user's role
        const roleDoc = await Role.findOne({ name: isUserPresent.role });
        const userData = isUserPresent.toObject();
        userData.permissions = roleDoc ? roleDoc.permissions : [];

        res.status(200).json({success: true, message: "User login successfully!", 
            data: userData
        });


    } catch (error) {
        next(error);
    }

}

const getUserData = async (req, res, next) => {
    try {
        
        const user = await User.findById(req.user._id);
        const roleDoc = await Role.findOne({ name: user.role });
        const userData = user.toObject();
        userData.permissions = roleDoc ? roleDoc.permissions : [];

        res.status(200).json({success: true, data: userData});

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        
        res.clearCookie('accessToken');
        res.status(200).json({success: true, message: "User logout successfully!"});

    } catch (error) {
        next(error);
    }
}




const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { email, phone, countryCode } = req.body;
        
        const updateData = { ...req.body };

        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        if (updateData.phone === "" || updateData.phone === null) {
            delete updateData.phone;
            updateData.$unset = { phone: 1 };
        }

        if (email) {
            const isEmailPresent = await User.findOne({ email, _id: { $ne: id } });
            if (isEmailPresent) {
                return next(createHttpError(400, "Email already exists!"));
            }
        }

        if (phone) {
            if(!/^\d+$/.test(phone) || parseInt(phone) < 0) {
                 return next(createHttpError(400, "Phone number must contain only positive digits!"));
            }
            const isPhonePresent = await User.findOne({ phone, _id: { $ne: id } });
            if (isPhonePresent) {
                return next(createHttpError(400, "Phone number already exists!"));
            }
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
    } catch (error) {
        next(error);
    }
};

const verifyAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            const error = createHttpError(400, "Todos los campos son obligatorios");
            return next(error);
        }

        const user = await User.findOne({ email });
        if (!user) {
            const error = createHttpError(401, "Credenciales inválidas");
            return next(error);
        }

        if (user.role !== "Admin") {
            const error = createHttpError(403, "El usuario no tiene privilegios de administrador");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error = createHttpError(401, "Credenciales inválidas");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Admin verified", adminId: user._id });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getUserData,
    logout,
    getAllUsers,
    deleteUser,
    updateUser,
    verifyAdmin
};