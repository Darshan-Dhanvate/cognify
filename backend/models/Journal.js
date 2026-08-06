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
    // This section will be populated later by your Python ML Microservice
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
    },
  },
  {
    timestamps: true,
  }
);

const Journal = mongoose.model('Journal', journalSchema);
export default Journal;