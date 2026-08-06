import Journal from '../models/Journal.js';

// @desc    Get logged in user's journal entries
// @route   GET /api/journals
// @access  Private
export const getJournals = async (req, res) => {
  try {
    // Fetch entries for the user, newest first
    const journals = await Journal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(journals);
  } catch (error) {
    console.error("Error fetching journals:", error.message);
    res.status(500).json({ message: 'Server Error: Could not fetch journals' });
  }
};

// @desc    Create a new journal entry
// @route   POST /api/journals
// @access  Private
export const createJournal = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Journal content is required' });
    }

    const journal = await Journal.create({
      user: req.user._id,
      content,
    });

    res.status(201).json(journal);
  } catch (error) {
    console.error("Journal Creation Failed:", error.message);
    res.status(500).json({ message: 'Failed to create journal entry' });
  }
};