const { loginUser } = require("../services/auth.service");
const { generateToken } = require("../config/jwt");

const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await loginUser(email, password);

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                health_centre_id: user.health_centre_id
            }
        });

    } catch (error) {

        res.status(401).json({
            message: error.message
        });

    }

};

module.exports = {
    login
};