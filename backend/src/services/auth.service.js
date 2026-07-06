const pool = require("../config/db");
const bcrypt = require("bcrypt");

const loginUser = async (email, password) => {

    const result = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );
    console.log("Email entered:", email);
    console.log("Users found:", result.rows.length);
    console.log(result.rows);

    if (result.rows.length === 0) {
        throw new Error("Invalid email or password");
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("Password verification status:", isMatch);

    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    return user;
};

module.exports = {
    loginUser
};