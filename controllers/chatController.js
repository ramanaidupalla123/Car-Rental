const Chat = require('../models/Chat');
const User = require('../models/User');

// Start new chat (User)
exports.startChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if user has an active chat
    let chat = await Chat.findOne({
      user: req.user.id,
      status: 'active'
    });

    if (!chat) {
      // Create new chat
      chat = new Chat({
        user: req.user.id,
        messages: [{
          sender: 'user',
          message: message
        }]
      });
    } else {
      // Add message to existing chat
      chat.messages.push({
        sender: 'user',
        message: message
      });
    }

    await chat.save();

    // Populate user details
    await chat.populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      chat
    });

  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting chat',
      error: error.message
    });
  }
};

// Send message (User)
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { chatId } = req.params;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      user: req.user.id
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (chat.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This chat is no longer active'
      });
    }

    chat.messages.push({
      sender: 'user',
      message: message
    });

    await chat.save();
    await chat.populate('user', 'name email phone');

    res.json({
      success: true,
      message: 'Message sent successfully',
      chat
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Admin sends message
exports.adminSendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { chatId } = req.params;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Assign admin if not already assigned
    if (!chat.admin) {
      chat.admin = req.user.id;
    }

    chat.messages.push({
      sender: 'admin',
      message: message
    });

    await chat.save();
    await chat.populate('user', 'name email phone');
    await chat.populate('admin', 'name email');

    res.json({
      success: true,
      message: 'Message sent successfully',
      chat
    });

  } catch (error) {
    console.error('Admin send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Get user chats (User)
exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id })
      .populate('admin', 'name email')
      .sort({ lastActivity: -1 });

    res.json({
      success: true,
      count: chats.length,
      chats
    });

  } catch (error) {
    console.error('Get my chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chats',
      error: error.message
    });
  }
};

// Get all chats (Admin)
exports.getAllChats = async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const filter = {};
    if (status !== 'all') {
      filter.status = status;
    }

    const chats = await Chat.find(filter)
      .populate('user', 'name email phone')
      .populate('admin', 'name email')
      .sort({ lastActivity: -1 });

    // Count unread messages for each chat
    const chatsWithUnread = chats.map(chat => {
      const unreadCount = chat.messages.filter(
        msg => msg.sender === 'user' && !msg.read
      ).length;
      
      return {
        ...chat.toObject(),
        unreadCount
      };
    });

    res.json({
      success: true,
      count: chats.length,
      chats: chatsWithUnread
    });

  } catch (error) {
    console.error('Get all chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chats',
      error: error.message
    });
  }
};

// Get single chat (Admin)
exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('admin', 'name email');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Mark user messages as read
    chat.messages.forEach(msg => {
      if (msg.sender === 'user') {
        msg.read = true;
      }
    });

    await chat.save();

    res.json({
      success: true,
      chat
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat',
      error: error.message
    });
  }
};

// Update chat status (Admin)
exports.updateChatStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    .populate('user', 'name email phone')
    .populate('admin', 'name email');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.json({
      success: true,
      message: `Chat ${status} successfully`,
      chat
    });

  } catch (error) {
    console.error('Update chat status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating chat status',
      error: error.message
    });
  }
};

// Get chat statistics (Admin)
exports.getChatStats = async (req, res) => {
  try {
    const totalChats = await Chat.countDocuments();
    const activeChats = await Chat.countDocuments({ status: 'active' });
    const resolvedChats = await Chat.countDocuments({ status: 'resolved' });
    const closedChats = await Chat.countDocuments({ status: 'closed' });

    // Today's chats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysChats = await Chat.countDocuments({
      createdAt: { $gte: today }
    });

    // Average response time (simplified)
    const chatsWithAdminResponse = await Chat.aggregate([
      {
        $match: {
          'messages.sender': 'admin',
          status: { $in: ['resolved', 'closed'] }
        }
      },
      {
        $unwind: '$messages'
      },
      {
        $match: {
          'messages.sender': 'admin'
        }
      },
      {
        $group: {
          _id: '$_id',
          firstAdminResponse: { $min: '$messages.timestamp' },
          createdAt: { $first: '$createdAt' }
        }
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$firstAdminResponse', '$createdAt'] },
              60000 // Convert to minutes
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const stats = {
      totalChats,
      activeChats,
      resolvedChats,
      closedChats,
      todaysChats,
      avgResponseTime: chatsWithAdminResponse[0]?.avgResponseTime || 0
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat statistics',
      error: error.message
    });
  }
};