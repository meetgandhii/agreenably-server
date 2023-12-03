const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
app.get('/', (req, res) => {
    res.send('Working!')
});
app.post('/submitForm', async (req, res) => {
    try {
        console.log('Received form submission:', req.body);
        await client.connect();
        const database = client.db('recommendationEngine');
        const collection = database.collection('V1');

        
        const { email, industries, revenue, budget, interest } = req.body;

        const lsCollection = await collection.find({}).toArray();
        const lsCertificates = [];
        

        for (const cert of lsCollection) {
            const {
                industries: certIndustries,
                revenue_cap: certRevenueCap,
                corresponding_program: certProgram,
                annual_fee: certAnnualFee,
                description,
                required_documentation: certRequiredDocumentation,
                timeline,
                renewal,
                benefits,
                certification_scope: certScope,
                certification_process: certProcess,
            } = cert;

            if (!certProgram) {
                
                continue;
            }

            const matchingIndustries = certIndustries.filter((ind) => industries.includes(ind));

            if (matchingIndustries.length > 0) {
                for (let i = 0; i < certProgram.length; i++) {
                    if (
                        Array.isArray(certRevenueCap) &&
                        certRevenueCap.length !== undefined && 
                        certRevenueCap.length > 0 &&
                        revenue >= certRevenueCap[i]
                    ) {
                        lsCertificates.push({
                            certification_name: cert.certification_name,
                            program_name: certProgram[i],
                            revenue_cap: certRevenueCap[i],
                            annual_fee: certAnnualFee[i],
                            description,
                            required_documentation: certRequiredDocumentation,
                            timeline,
                            renewal,
                            benefits,
                            certification_scope: certScope,
                            certification_process: certProcess,
                        });
                    }
                }
            }
        }

console.log(lsCertificates);
        res.json({ success: true, message: 'Form submitted successfully', certificates: lsCertificates });
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
