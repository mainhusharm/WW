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

module.exports = router;
