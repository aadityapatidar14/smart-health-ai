const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const phcNames = [
    'Dr. Rajesh Kumar', 'Dr. Sunita Sharma', 'Dr. Anil Verma', 'Dr. Neha Gupta', 'Dr. Sanjay Patel',
    'Dr. Priya Joshi', 'Dr. Ramesh Singh', 'Dr. Swati Chouhan', 'Dr. Vijay Patidar', 'Dr. Kamlesh Dave',
    'Dr. Mahesh Sharma', 'Dr. Ritu Trivedi', 'Dr. Vikram Rathore', 'Dr. Sneha Shah', 'Dr. Arjun Pandey',
    'Dr. Divya Mishra', 'Dr. Deepak Yadav', 'Dr. Shalini Dubey', 'Dr. Manish Soni', 'Dr. Sunita Solanki',
    'Dr. Vinay Deshmukh', 'Dr. Neha Agarwal', 'Dr. Amit Choudhary', 'Dr. Sandeep Naik', 'Dr. Preeti Joshi'
];

const chcNames = [
    'Dr. Vivek Saxena', 'Dr. Pooja Mehta', 'Dr. Rahul Shrivastava', 'Dr. Kavita Rao', 'Dr. Devendra Mishra',
    'Dr. Kiran Patil', 'Dr. Nitin Gawde', 'Dr. Manoj Deshpande', 'Dr. Archana Kulkarni', 'Dr. Suresh Bhat',
    'Dr. Harish Iyer', 'Dr. Gopal Pillai', 'Dr. Madhavan Nair', 'Dr. Anand Krishnan', 'Dr. Radha Menon',
    'Dr. Prakash Hegde', 'Dr. Venkat Raman', 'Dr. Karthik Subramanian', 'Dr. Balaji Srinivasan', 'Dr. Ranganathan Swamy',
    'Dr. Sridhar Murthy', 'Dr. Prabhakar Reddy', 'Dr. Sekhar Babu', 'Dr. Krishna Rao', 'Dr. Mohan Prasad',
    'Dr. Ramachandran Pillai', 'Dr. Narayanan Kutty', 'Dr. Subramaniam Iyer', 'Dr. Viswanathan Chettiar', 'Dr. Chandrasekharan Nair'
];

async function run() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        
        console.log("🔍 Fetching all doctors from the database...");
        const selectQuery = `
            SELECT 
                d.id AS doctor_id, 
                u.id AS user_id, 
                u.health_centre_id, 
                hc.type AS centre_type 
            FROM doctors d 
            JOIN users u ON d.user_id = u.id 
            JOIN health_centres hc ON u.health_centre_id = hc.id 
            ORDER BY hc.type DESC, d.id ASC;
        `;
        const selectRes = await client.query(selectQuery);
        const doctorsList = selectRes.rows;
        
        console.log(`📋 Found ${doctorsList.length} doctors. Updating names and emails...`);

        let phcIdx = 0;
        let chcIdx = 0;

        for (const doc of doctorsList) {
            let selectedName = "";
            let emailUsername = "";

            if (doc.centre_type === "PHC") {
                selectedName = phcNames[phcIdx % phcNames.length];
                // strip "Dr. " (first 4 characters) and spaces
                emailUsername = selectedName.substring(4).replace(/\s+/g, "").toLowerCase();
                phcIdx++;
            } else {
                selectedName = chcNames[chcIdx % chcNames.length];
                emailUsername = selectedName.substring(4).replace(/\s+/g, "").toLowerCase() + doc.health_centre_id;
                chcIdx++;
            }

            const newEmail = `doc.${emailUsername}@smarthealth.gov.in`;

            console.log(`🔄 Updating User ID ${doc.user_id}: ${selectedName} | ${newEmail}`);

            const updateQuery = `
                UPDATE users 
                SET name = $1, email = $2 
                WHERE id = $3;
            `;
            await client.query(updateQuery, [selectedName, newEmail, doc.user_id]);
        }

        await client.query("COMMIT");
        console.log("✅ Successfully updated all doctor names and emails in the live database!");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Failed to update doctor profiles:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
