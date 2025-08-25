const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');

// Get all customers
router.get('/', async (req, res) => {
    try {
        // Add timeout and error handling for database queries
        const customers = await Customer.find().sort({ createdAt: -1 }).timeout(10000);
        res.json(customers || []);
    } catch (error) {
        console.error('Error fetching customers:', error);
        
        // Return empty array if database is unavailable
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            return res.json([]);
        }
        
        res.status(500).json({ 
            error: 'Failed to fetch customers',
            message: 'Database connection issue',
            customers: []
        });
    }
});

// Create or update customer
router.post('/', async (req, res) => {
    const {
        user_id, // This might be from an external auth system
        unique_id,
        username,
        email,
        plan_type,
        created_at,
        questionnaire_data
    } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if a customer with this email already exists
        let customer = await Customer.findOne({ email: email });

        if (customer) {
            // If customer exists, return an error to prevent duplicates
            return res.status(409).json({ 
                error: 'Email already registered',
                message: 'This email is already associated with an existing account.'
            });
        }

        // If customer does not exist, create a new one
        const newCustomer = new Customer({
            user_id, // Can be null if not provided
            unique_id,
            username,
            email,
            plan_type,
            created_at: created_at ? new Date(created_at) : new Date(),
            questionnaire_data,
            status: 'active',
            last_updated: new Date()
        });

        await newCustomer.save();
        console.log('New customer created:', email);

        res.status(201).json({ 
            message: 'Customer created successfully',
            customer: newCustomer
        });

    } catch (error) {
        // Handle potential database errors, including unique index violations
        if (error.code === 11000) {
            return res.status(409).json({ 
                error: 'Email already exists',
                message: 'A user with this email address has already been registered.'
            });
        }
        console.error('Error saving customer:', error);
        res.status(500).json({ error: 'Failed to save customer data' });
    }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// Update customer status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { status, last_updated: new Date() },
            { new: true }
        );
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json(customer);
    } catch (error) {
        console.error('Error updating customer status:', error);
        res.status(500).json({ error: 'Failed to update customer status' });
    }
});

module.exports = router;
