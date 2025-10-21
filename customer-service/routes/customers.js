const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');

// Get all customers
router.get('/', async (req, res) => {
    try {
        // Add timeout and error handling for database queries
        const customers = await Customer.find().sort({ createdAt: -1 }).timeout(10000);
        res.json({ customers: customers || [] });
    } catch (error) {
        console.error('Error fetching customers:', error);
        
        // Return empty array if database is unavailable
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            return res.json({ customers: [] });
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
        questionnaire_data,
        // New fields for enhanced customer profiles
        selectedPlan,
        tradingExperience,
        accountBalance,
        riskTolerance,
        tradingGoals,
        preferredMarkets,
        timeAvailability,
        hasTradingExperience,
        maxLossTolerance,
        monthlyTradingBudget,
        maxPositionSize,
        stopLossPreference,
        takeProfitStrategy,
        riskPerTrade,
        maxOpenTrades,
        correlationAwareness,
        newsTradingPreference,
        weekendTrading,
        timeZonePreference,
        communicationPreference,
        supportLevelNeeded,
        additionalNotes
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
            last_updated: new Date(),
            // Enhanced customer profile fields
            selectedPlan: selectedPlan || 'Basic',
            tradingExperience: tradingExperience || 'Beginner',
            accountBalance: accountBalance || 'Under $1K',
            riskTolerance: riskTolerance || 'Moderate',
            tradingGoals: tradingGoals || ['Capital Preservation'],
            preferredMarkets: preferredMarkets || ['Forex'],
            timeAvailability: timeAvailability || 'Part-time (1-2 hours/day)',
            hasTradingExperience: hasTradingExperience || false,
            maxLossTolerance: maxLossTolerance || 2,
            monthlyTradingBudget: monthlyTradingBudget || 100,
            maxPositionSize: maxPositionSize || 5,
            stopLossPreference: stopLossPreference || 'Fixed Percentage',
            takeProfitStrategy: takeProfitStrategy || 'Fixed R:R Ratio',
            riskPerTrade: riskPerTrade || 1,
            maxOpenTrades: maxOpenTrades || 3,
            correlationAwareness: correlationAwareness || false,
            newsTradingPreference: newsTradingPreference || 'Wait for News to Settle',
            weekendTrading: weekendTrading || false,
            timeZonePreference: timeZonePreference || 'UTC',
            communicationPreference: communicationPreference || 'Email',
            supportLevelNeeded: supportLevelNeeded || 'Basic Support',
            additionalNotes: additionalNotes || ''
        });

        await newCustomer.save();
        console.log('New customer created with enhanced profile:', email);

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

// Get user profile by email or user_id
router.get('/profile/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        let customer;
        
        // Try to find by email first, then by user_id
        customer = await Customer.findOne({ email: identifier });
        if (!customer) {
            customer = await Customer.findOne({ user_id: identifier });
        }
        
        if (!customer) {
            return res.status(404).json({ 
                error: 'User profile not found',
                message: 'No customer found with the provided identifier'
            });
        }
        
        // Return a properly formatted user profile
        const userProfile = {
            id: customer._id,
            email: customer.email,
            username: customer.username || customer.email.split('@')[0],
            plan_type: customer.plan_type || customer.selectedPlan || 'Basic',
            status: customer.status || 'Active',
            joinDate: customer.joinDate || customer.created_at,
            lastActive: customer.lastActive || customer.last_updated,
            // Enhanced profile fields
            selectedPlan: customer.selectedPlan || 'Basic',
            tradingExperience: customer.tradingExperience || 'Beginner',
            accountBalance: customer.accountBalance || 'Under $1K',
            riskTolerance: customer.riskTolerance || 'Moderate',
            tradingGoals: customer.tradingGoals || ['Capital Preservation'],
            preferredMarkets: customer.preferredMarkets || ['Forex'],
            timeAvailability: customer.timeAvailability || 'Part-time (1-2 hours/day)',
            hasTradingExperience: customer.hasTradingExperience || false,
            maxLossTolerance: customer.maxLossTolerance || 2,
            monthlyTradingBudget: customer.monthlyTradingBudget || 100,
            maxPositionSize: customer.maxPositionSize || 5,
            stopLossPreference: customer.stopLossPreference || 'Fixed Percentage',
            takeProfitStrategy: customer.takeProfitStrategy || 'Fixed R:R Ratio',
            riskPerTrade: customer.riskPerTrade || 1,
            maxOpenTrades: customer.maxOpenTrades || 3,
            correlationAwareness: customer.correlationAwareness || false,
            newsTradingPreference: customer.newsTradingPreference || 'Wait for News to Settle',
            weekendTrading: customer.weekendTrading || false,
            timeZonePreference: customer.timeZonePreference || 'UTC',
            communicationPreference: customer.communicationPreference || 'Email',
            supportLevelNeeded: customer.supportLevelNeeded || 'Basic Support',
            additionalNotes: customer.additionalNotes || ''
        };
        
        res.json(userProfile);
        
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user profile',
            message: 'Internal server error occurred'
        });
    }
});

// Get user progress data
router.get('/progress/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        let customer;
        
        // Try to find by email first, then by user_id
        customer = await Customer.findOne({ email: identifier });
        if (!customer) {
            customer = await Customer.findOne({ user_id: identifier });
        }
        
        if (!customer) {
            return res.status(404).json({ 
                error: 'User not found',
                message: 'No customer found with the provided identifier'
            });
        }
        
        // Return progress data in the expected format
        const progressData = {
            userId: customer._id,
            email: customer.email,
            planType: customer.plan_type || customer.selectedPlan || 'Basic',
            status: customer.status || 'Active',
            joinDate: customer.joinDate || customer.created_at,
            lastActive: customer.lastActive || customer.last_updated,
            // Progress metrics
            tradingExperience: customer.tradingExperience || 'Beginner',
            riskTolerance: customer.riskTolerance || 'Moderate',
            accountBalance: customer.accountBalance || 'Under $1K',
            // Ensure arrays are always returned
            tradingGoals: Array.isArray(customer.tradingGoals) ? customer.tradingGoals : ['Capital Preservation'],
            preferredMarkets: Array.isArray(customer.preferredMarkets) ? customer.preferredMarkets : ['Forex'],
            // Risk management data
            riskManagement: {
                maxLossTolerance: customer.maxLossTolerance || 2,
                monthlyTradingBudget: customer.monthlyTradingBudget || 100,
                maxPositionSize: customer.maxPositionSize || 5,
                riskPerTrade: customer.riskPerTrade || 1,
                maxOpenTrades: customer.maxOpenTrades || 3
            }
        };
        
        res.json(progressData);
        
    } catch (error) {
        console.error('Error fetching user progress:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user progress',
            message: 'Internal server error occurred'
        });
    }
});

// Get bot status for user
router.get('/bot-status/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        let customer;
        
        // Try to find by email first, then by user_id
        customer = await Customer.findOne({ email: identifier });
        if (!customer) {
            customer = await Customer.findOne({ user_id: identifier });
        }
        
        if (!customer) {
            return res.status(404).json({ 
                error: 'User not found',
                message: 'No customer found with the provided identifier'
            });
        }
        
        // Return bot status data
        const botStatus = {
            userId: customer._id,
            email: customer.email,
            status: 'active',
            lastActive: customer.lastActive || customer.last_updated,
            planType: customer.plan_type || customer.selectedPlan || 'Basic',
            // Bot configuration based on user profile
            botConfig: {
                tradingExperience: customer.tradingExperience || 'Beginner',
                riskTolerance: customer.riskTolerance || 'Moderate',
                maxLossTolerance: customer.maxLossTolerance || 2,
                maxPositionSize: customer.maxPositionSize || 5,
                preferredMarkets: Array.isArray(customer.preferredMarkets) ? customer.preferredMarkets : ['Forex']
            }
        };
        
        res.json(botStatus);
        
    } catch (error) {
        console.error('Error fetching bot status:', error);
        res.status(500).json({ 
            error: 'Failed to fetch bot status',
            message: 'Internal server error occurred'
        });
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

// Search customers
router.get('/search', async (req, res) => {
    try {
        const { search } = req.query;
        if (!search) {
            return res.json({ customers: [] });
        }

        const customers = await Customer.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { uniqueId: { $regex: search, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 }).timeout(10000);

        res.json({ customers: customers || [] });
    } catch (error) {
        console.error('Error searching customers:', error);
        res.status(500).json({ 
            error: 'Failed to search customers',
            customers: []
        });
    }
});

module.exports = router;
