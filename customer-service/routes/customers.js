const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');

// Get all customers
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Create or update customer
router.post('/', async (req, res) => {
    try {
        const {
            user_id,
            unique_id,
            username,
            email,
            plan_type,
            created_at,
            questionnaire_data
        } = req.body;

        // Check if customer already exists
        let customer = await Customer.findOne({ 
            $or: [
                { user_id: user_id },
                { email: email }
            ]
        });

        if (customer) {
            // Update existing customer
            customer.username = username;
            customer.plan_type = plan_type;
            customer.questionnaire_data = questionnaire_data;
            customer.last_updated = new Date();
            await customer.save();
            console.log('Customer updated:', email);
        } else {
            // Create new customer
            customer = new Customer({
                user_id,
                unique_id,
                username,
                email,
                plan_type,
                created_at: created_at ? new Date(created_at) : new Date(),
                questionnaire_data,
                status: 'active',
                last_updated: new Date()
            });
            await customer.save();
            console.log('New customer created:', email);
        }

        res.status(201).json({ 
            message: 'Customer data saved successfully',
            customer: customer
        });
    } catch (error) {
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
