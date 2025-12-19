const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { io } = require('../server');

// Import models
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const Ticket = require('../models/ticket');
const Customer = require('../models/customer');
const Activity = require('../models/activity');
const { searchKnowledgeBase } = require('../services/knowledgeBaseService');
const { getChatbotResponse } = require('../services/chatbotService');

// @route   POST api/user/update-risk
// @desc    Update user's risk per trade
router.post('/user/update-risk', auth, async (req, res) => {
    try {
        const { email, riskPerTrade } = req.body;
        const user = await Customer.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        if (user.tradingData.lastRiskUpdate > twoWeeksAgo) {
            return res.status(400).json({ msg: 'You can only update your risk percentage once every two weeks.' });
        }

        user.tradingData.riskPerTrade = riskPerTrade;
        user.tradingData.lastRiskUpdate = new Date();
        await user.save();

        res.json({ user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/chats
// @desc    Get all active chats
router.get('/chats', auth, async (req, res) => {
    try {
        const chats = await Conversation.find({ status: 'Active' }).populate('customer_id', ['name', 'email']);
        res.json(chats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/messages
// @desc    Send a message
router.post('/messages', auth, async (req, res) => {
    try {
        const { conversation_id, sender_type, sender_id, message } = req.body;
        const newMessage = new Message({
            conversation_id,
            sender_type,
            sender_id,
            message,
        });
        const savedMessage = await newMessage.save();
        res.json(savedMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/messages/:chatId
// @desc    Get chat history
router.get('/messages/:chatId', auth, async (req, res) => {
    try {
        const messages = await Message.find({ conversation_id: req.params.chatId }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tickets/:id
// @desc    Update ticket status
router.put('/tickets/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/customers/:id
// @desc    Get customer details
router.get('/customers/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id)
            .populate('activities')
            .populate('screenshots')
            .populate('questionnaireResponses')
            .populate('riskManagementPlan')
            .populate('dashboardData');
        
        if (!customer) {
            return res.status(404).json({ msg: 'Customer not found' });
        }

        // Parse dashboardData content before sending
        const parsedCustomer = customer.toObject();
        if (parsedCustomer.dashboardData) {
            parsedCustomer.dashboardData.forEach(data => {
                if (typeof data.data_content === 'string') {
                    try {
                        data.data_content = JSON.parse(data.data_content);
                    } catch (e) {
                        console.error('Error parsing data_content:', e);
                    }
                }
            });
        }

        res.json({ customer: parsedCustomer });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/customers
// @desc    Get all customers with search
router.get('/customers', auth, async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { uniqueId: { $regex: search, $options: 'i' } },
                ],
            };
        }

        const customers = await Customer.find(query).populate('activities');
        res.json({ customers });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE api/customers/:id
// @desc    Delete a customer
router.delete('/customers/:uniqueId', auth, async (req, res) => {
    try {
        const customer = await Customer.findOne({ uniqueId: req.params.uniqueId });
        if (!customer) {
            return res.status(404).json({ msg: 'Customer not found' });
        }
        await customer.remove();
        res.json({ msg: 'Customer removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/transfer
// @desc    Transfer chat to another agent
router.post('/transfer', auth, async (req, res) => {
    try {
        const { conversation_id, new_agent_id } = req.body;
        const conversation = await Conversation.findByIdAndUpdate(conversation_id, { agent_id: new_agent_id }, { new: true });
        res.json(conversation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/knowledge-base
// @desc    Search knowledge base
router.get('/knowledge-base', auth, (req, res) => {
    try {
        const { query } = req.query;
        const results = searchKnowledgeBase(query);
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/chatbot
// @desc    Get a response from the chatbot
router.post('/chatbot', (req, res) => {
    try {
        const { message } = req.body;
        const response = getChatbotResponse(message);
        res.json({ response });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/signals
// @desc    Create a new signal and broadcast it
router.post('/signals', auth, (req, res) => {
    try {
        const signal = req.body;
        // Here you would typically save the signal to a database
        console.log('New signal received:', signal);
        
        // Broadcast the signal to all connected clients
        io.emit('newSignal', signal);
        
        res.status(201).json({ message: 'Signal broadcasted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/customers
// @desc    Create a new customer
router.post('/customers', async (req, res) => {
    try {
        const { name, email, phone, account_type } = req.body;

        let customer = await Customer.findOne({ email });
        if (customer) {
            return res.status(400).json({ msg: 'Customer already exists' });
        }

        customer = new Customer({
            name,
            email,
            phone,
            account_type,
        });

        await customer.save();

        res.json({ msg: 'Customer created successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/customers/:id
// @desc    Update a customer
router.put('/customers/:id', auth, async (req, res) => {
    try {
        const { name, email, phone, account_type } = req.body;

        let customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ msg: 'Customer not found' });
        }

        customer.name = name;
        customer.email = email;
        customer.phone = phone;
        customer.account_type = account_type;

        await customer.save();

        res.json({ msg: 'Customer updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/customers/stats
// @desc    Get customer stats
router.get('/customers/stats', auth, async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments();
        const newCustomers = await Customer.countDocuments({ joinDate: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) } });
        const activeCustomers = await Customer.countDocuments({ lastActive: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) } });

        res.json({
            totalCustomers,
            newCustomers,
            activeCustomers,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/activity
// @desc    Log a customer activity
router.post('/activity', auth, async (req, res) => {
    try {
        const { customerId, activity_type, activity_details, ip_address } = req.body;
        
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ msg: 'Customer not found' });
        }

        const newActivity = new Activity({
            customer_id: customerId,
            activity_type,
            activity_details,
            ip_address,
        });

        await newActivity.save();

        customer.activities.push(newActivity._id);
        customer.lastActive = Date.now();
        await customer.save();

        res.json(newActivity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/user/profile
// @desc    Get user profile data
router.get('/user/profile', async (req, res) => {
    try {
        // Get user identifier from query params or headers
        const userEmail = req.query.email || req.headers['x-user-email'];
        const userId = req.query.userId || req.headers['x-user-id'];
        
        if (!userEmail && !userId) {
            return res.status(400).json({ 
                error: 'User identifier required',
                message: 'Please provide either email or userId'
            });
        }
        
        let customer;
        
        // Try to find customer by email or user_id
        if (userEmail) {
            customer = await Customer.findOne({ email: userEmail });
        } else if (userId) {
            customer = await Customer.findOne({ user_id: userId });
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
            tradingGoals: Array.isArray(customer.tradingGoals) ? customer.tradingGoals : ['Capital Preservation'],
            preferredMarkets: Array.isArray(customer.preferredMarkets) ? customer.preferredMarkets : ['Forex'],
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

// @route   GET api/user/progress
// @desc    Get user progress data
router.get('/user/progress', async (req, res) => {
    try {
        // Get user identifier from query params or headers
        const userEmail = req.query.email || req.headers['x-user-email'];
        const userId = req.query.userId || req.headers['x-user-id'];
        
        if (!userEmail && !userId) {
            return res.status(400).json({ 
                error: 'User identifier required',
                message: 'Please provide either email or userId'
            });
        }
        
        let customer;
        
        // Try to find customer by email or user_id
        if (userEmail) {
            customer = await Customer.findOne({ email: userEmail });
        } else if (userId) {
            customer = await Customer.findOne({ user_id: userId });
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

// @route   GET api/database/bot-status
// @desc    Get bot status for user
router.get('/database/bot-status', async (req, res) => {
    try {
        // Get user identifier from query params or headers
        const userEmail = req.query.email || req.headers['x-user-email'];
        const userId = req.query.userId || req.headers['x-user-id'];
        
        if (!userEmail && !userId) {
            return res.status(400).json({ 
                error: 'User identifier required',
                message: 'Please provide either email or userId'
            });
        }
        
        let customer;
        
        // Try to find customer by email or user_id
        if (userEmail) {
            customer = await Customer.findOne({ email: userEmail });
        } else if (userId) {
            customer = await Customer.findOne({ user_id: userId });
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

module.exports = router;
