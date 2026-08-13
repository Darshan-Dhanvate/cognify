import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    content: {
      type: String,
      required: true,
    },
    // This section will be populated by your Python ML Microservice
    psychologicalAnalysis: {
      stressScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      detectedDistortions: [
        {
          type: String,
        },
      ],
      suggestedReframing: {
        type: String,
      },
      moodState: {
        type: String,
        enum: ['Calm', 'Anxious', 'Overwhelmed', 'Focused'],
      },
      // NEW: Ensemble Prediction Outputs
      burnoutRiskPercentage: {
        type: Number,
      },
      isAtRisk: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Journal = mongoose.model('Journal', journalSchema);
export default Journal;