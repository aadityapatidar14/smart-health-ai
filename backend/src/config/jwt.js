const jwt = require("jsonwebtoken");

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            healthCentreId: user.health_centre_id,
            name: user.name,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

module.exports = {
    generateToken
};