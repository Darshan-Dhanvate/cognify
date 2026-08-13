import axios from 'axios';
import Journal from '../models/Journal.js';

/**
 * @desc    Process Cognitive Journal Entry via Python ML Engine & Save to DB
 * @route   POST /api/journal
 * @access  Private (Requires JWT Authentication)
 */
export const createJournalEntry = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user?._id;

        // 1. Input Guard Clauses
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized: User identification missing." 
            });
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Validation Error: Journal content cannot be empty." 
            });
        }

        // 2. Dispatch HTTP Request to Python FastAPI Analytical Engine
        let mlAnalysisPayload;
        
        try {
            // FIXED: Changed port 5000 to 8080 to prevent conflict with Express
            const pythonServiceUrl = process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:8080/analyze';
            
            const pythonResponse = await axios.post(pythonServiceUrl, {
                content: content.trim()
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 8000 // 8 second timeout threshold for ML processing
            });

            mlAnalysisPayload = pythonResponse.data;

        } catch (mlError) {
            console.error("⚠️ ML Microservice Error / Fallback Triggered:", mlError.message);
            
            // Safe Graceful Fallback in case Python service is restarting or unavailable
            mlAnalysisPayload = {
                stressScore: 50.0,
                detectedDistortions: [],
                suggestedReframing: "Analytical engine is temporarily re-calibrating. Entry captured successfully.",
                moodState: "Focused",
                burnoutRiskPercentage: 0.0,
                isAtRisk: false
            };
        }

        // 3. Construct Document Payload Matching Database Schema
        const newJournalEntry = new Journal({
            user: userId,
            content: content.trim(),
            psychologicalAnalysis: {
                stressScore: mlAnalysisPayload.stressScore,
                detectedDistortions: mlAnalysisPayload.detectedDistortions || [],
                suggestedReframing: mlAnalysisPayload.suggestedReframing || "",
                moodState: mlAnalysisPayload.moodState || "Focused",
                // 🧠 Added Ensemble Predictions
                burnoutRiskPercentage: mlAnalysisPayload.burnoutRiskPercentage || 0.0,
                isAtRisk: mlAnalysisPayload.isAtRisk || false
            }
        });

        // 4. Save Entry to Database
        const savedJournal = await newJournalEntry.save();

        // 5. Send Completed Response to Frontend
        return res.status(201).json({
            success: true,
            data: savedJournal
        });

    } catch (error) {
        console.error("🔴 Express Journal Controller Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error while creating journal entry.",
            error: error.message 
        });
    }
};

/**
 * @desc    Fetch User's Journal History
 * @route   GET /api/journal
 * @access  Private
 */
export const getUserJournals = async (req, res) => {
    try {
        const userId = req.user?._id;

        const journals = await Journal.find({ user: userId })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: journals.length,
            data: journals
        });

    } catch (error) {
        console.error("🔴 Express Journal Fetch Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to retrieve journal entries.",
            error: error.message 
        });
    }
};

/**
 * @desc    Delete a specific journal entry
 * @route   DELETE /api/journal/:id
 * @access  Private
 */
export const deleteJournalEntry = async (req, res) => {
    try {
        const journal = await Journal.findById(req.params.id);

        if (!journal) {
            return res.status(404).json({ success: false, message: 'Journal entry not found' });
        }

        // Ensure the logged-in user actually owns this journal entry
        if (journal.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this entry' });
        }

        await journal.deleteOne();

        return res.status(200).json({ success: true, message: 'Journal entry deleted successfully' });

    } catch (error) {
        console.error("🔴 Express Journal Deletion Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error while deleting journal entry.",
            error: error.message 
        });
    }
};