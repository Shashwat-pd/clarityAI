import unittest

from app.services.signal_extractors.cross_turn_features import extract_rumination_features, score_rumination
from app.services.signal_extractors.text_features import extract_tense_features, score_temporal_collapse
from app.services.signal_extractors.valence_features import extract_valence_features, score_negative_valence


class TextFeatureExtractorTests(unittest.TestCase):
    def test_future_planning_lowers_temporal_collapse(self):
        message = "I want to study psychology and I will apply next year."
        features = extract_tense_features(message)
        score = score_temporal_collapse(message, features)
        self.assertGreater(features.future_ratio, 0)
        self.assertFalse(features.future_absent)
        self.assertLess(score, 0.55)

    def test_present_tense_distress_raises_temporal_collapse(self):
        message = "I am stuck and I don't know what to do right now."
        features = extract_tense_features(message)
        score = score_temporal_collapse(message, features)
        self.assertTrue(features.future_absent)
        self.assertGreaterEqual(score, 0.6)

    def test_past_focused_message_counts_as_past_heavy(self):
        message = "I failed before and I was never good at maths."
        features = extract_tense_features(message)
        self.assertGreater(features.past_ratio, 0)
        self.assertTrue(features.future_absent)

    def test_empty_message_is_safe_default(self):
        features = extract_tense_features("")
        score = score_temporal_collapse("", features)
        self.assertEqual(features.future_ratio, 0.0)
        self.assertGreaterEqual(score, 0.0)

    def test_mixed_tense_message_produces_mixed_ratios(self):
        message = "I was worried before but now I think I will be okay."
        features = extract_tense_features(message)
        self.assertGreater(features.past_ratio, 0)
        self.assertGreater(features.present_ratio, 0)
        self.assertGreater(features.future_ratio, 0)

    def test_explanation_mentions_future_absence_when_missing(self):
        message = "Everything feels impossible and I can't decide."
        features = extract_tense_features(message)
        self.assertIn("Future-oriented language", features.explanation)

    def test_rumination_detects_repeated_phrases(self):
        history = [
            "I do not know what to do about psychology",
            "I still do not know what to do about university",
        ]
        features = extract_rumination_features("I really do not know what to do now", history)
        score = score_rumination(features)
        self.assertGreaterEqual(features.repeated_turn_count, 1)
        self.assertTrue(features.repeated_phrases)
        self.assertGreater(score, 0.0)

    def test_rumination_stays_low_without_overlap(self):
        features = extract_rumination_features(
            "I want to compare biology and chemistry",
            ["I enjoy drawing in my free time"],
        )
        self.assertEqual(features.repeated_turn_count, 0)
        self.assertEqual(score_rumination(features), 0.0)

    def test_negative_valence_scores_higher_when_negative_language_dominates(self):
        features = extract_valence_features("I feel overwhelmed, stressed, and afraid.")
        score = score_negative_valence(features)
        self.assertGreater(features.negative_word_ratio, 0)
        self.assertGreater(score, 0.0)

    def test_positive_language_offsets_negative_valence(self):
        features = extract_valence_features("I feel hopeful, clear, and ready.")
        score = score_negative_valence(features)
        self.assertLessEqual(score, 0.05)


if __name__ == "__main__":
    unittest.main()
