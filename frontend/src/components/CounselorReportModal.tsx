import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { ApiService } from '../services/api';
import { BriefResponse } from '../types';

interface CounselorReportModalProps {
  visible: boolean;
  onClose: () => void;
  studentId: string | undefined;
}

const SECTION_META: Record<string, { title: string; icon: string }> = {
  session_overview: { title: 'Session Overview', icon: 'Overview' },
  core_concerns: { title: 'Core Concerns Identified', icon: 'Concerns' },
  behavioural_signals: { title: 'Behavioural Signal Analysis', icon: 'Signals' },
  trajectory: { title: 'Clarity Trajectory', icon: 'Trajectory' },
  suggested_focus_areas: { title: 'Suggested Focus Areas', icon: 'Focus' },
};

function SignalStatRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: theme.colors.text, fontFamily: theme.fonts.bodyMedium }]}>
        {value}
      </Text>
    </View>
  );
}

function renderSectionContent(key: string, value: unknown, theme: any) {
  if (key === 'behavioural_signals' && typeof value === 'object' && value !== null) {
    const signals = value as Record<string, unknown>;
    return (
      <View style={styles.signalGrid}>
        {signals.avg_clarity != null && (
          <SignalStatRow label="Avg Clarity" value={String(signals.avg_clarity)} />
        )}
        {signals.min_clarity != null && (
          <SignalStatRow label="Min Clarity" value={String(signals.min_clarity)} />
        )}
        {signals.max_clarity != null && (
          <SignalStatRow label="Max Clarity" value={String(signals.max_clarity)} />
        )}
        {signals.total_readings != null && (
          <SignalStatRow label="Total Readings" value={String(signals.total_readings)} />
        )}
        {signals.trend && (
          <SignalStatRow label="Trend" value={String(signals.trend)} />
        )}
        {signals.temporal_language_observation && (
          <Text style={[styles.observation, { color: theme.colors.text, fontFamily: theme.fonts.body }]}>
            {String(signals.temporal_language_observation)}
          </Text>
        )}
        {signals.rumination_observation && (
          <Text style={[styles.observation, { color: theme.colors.text, fontFamily: theme.fonts.body }]}>
            {String(signals.rumination_observation)}
          </Text>
        )}
        {signals.valence_observation && (
          <Text style={[styles.observation, { color: theme.colors.text, fontFamily: theme.fonts.body }]}>
            {String(signals.valence_observation)}
          </Text>
        )}
      </View>
    );
  }

  if (key === 'core_concerns' || key === 'suggested_focus_areas') {
    let items: string[] = [];
    if (typeof value === 'string') {
      try {
        items = JSON.parse(value);
      } catch {
        items = [value];
      }
    } else if (Array.isArray(value)) {
      items = value.map(String);
    }
    return (
      <View style={styles.listContainer}>
        {items.map((item, i) => (
          <View key={i} style={styles.listItem}>
            <View style={[styles.listBullet, { backgroundColor: theme.colors.brandPrimary }]} />
            <Text style={[styles.listText, { color: theme.colors.text, fontFamily: theme.fonts.body }]}>
              {item}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <Text style={[styles.sectionBody, { color: theme.colors.text, fontFamily: theme.fonts.body }]}>
      {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
    </Text>
  );
}

export default function CounselorReportModal({ visible, onClose, studentId }: CounselorReportModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<BriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && studentId && !brief) {
      generateReport();
    }
  }, [visible, studentId]);

  const generateReport = async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ApiService.generateBrief(studentId);
      setBrief(result);
    } catch (err: any) {
      console.error('Report generation failed:', err);
      setError(err?.response?.data?.detail || 'Could not generate report. Make sure you have conversation data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: 'docx' | 'pdf') => {
    if (!brief) return;
    const url = format === 'docx'
      ? ApiService.resolveBriefExportUrl(brief.brief_id)
      : ApiService.resolveBriefPdfUrl(brief.brief_id);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleClose = () => {
    setBrief(null);
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.colors.heading, fontFamily: theme.fonts.heading }]}>
              Counselor Report
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body }]}>
              Generated by ClarityAI
            </Text>
          </View>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary, fontFamily: theme.fonts.bodyMedium }]}>
              Close
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body }]}>
              Analyzing session data...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { color: theme.colors.crisisText, fontFamily: theme.fonts.body }]}>
              {error}
            </Text>
            <Pressable
              onPress={generateReport}
              style={[styles.retryButton, { backgroundColor: theme.colors.brandPrimary }]}
            >
              <Text style={[styles.retryText, { fontFamily: theme.fonts.bodyMedium }]}>
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : brief ? (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Meta bar */}
              <View style={[styles.metaBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body }]}>
                    Sessions
                  </Text>
                  <Text style={[styles.metaValue, { color: theme.colors.brandDeep, fontFamily: theme.fonts.heading }]}>
                    {brief.session_count}
                  </Text>
                </View>
                <View style={[styles.metaDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body }]}>
                    Generated
                  </Text>
                  <Text style={[styles.metaValue, { color: theme.colors.brandDeep, fontFamily: theme.fonts.heading }]}>
                    {new Date(brief.generated_at).toLocaleDateString()}
                  </Text>
                </View>
                {brief.crisis_flagged && (
                  <>
                    <View style={[styles.metaDivider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.metaItem}>
                      <Text style={[styles.crisisBadge, { color: theme.colors.crisisText, fontFamily: theme.fonts.bodyMedium }]}>
                        Crisis Flagged
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Disclaimer */}
              <View style={[styles.disclaimer, { backgroundColor: theme.colors.brandFog, borderColor: theme.colors.brandGlow }]}>
                <Text style={[styles.disclaimerText, { color: theme.colors.brandDark, fontFamily: theme.fonts.body }]}>
                  This report contains behavioural observations generated by ClarityAI's cognitive engine. It is intended to support — not replace — professional counselor judgment.
                </Text>
              </View>

              {/* Sections */}
              {Object.entries(SECTION_META).map(([key, meta]) => {
                const value = brief.sections[key];
                if (!value) return null;
                return (
                  <View key={key} style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.heading, fontFamily: theme.fonts.heading }]}>
                      {meta.title}
                    </Text>
                    {renderSectionContent(key, value, theme)}
                  </View>
                );
              })}

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Download bar */}
            <View style={[styles.downloadBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
              <Pressable
                onPress={() => handleDownload('pdf')}
                style={[styles.downloadButton, { backgroundColor: theme.colors.brandPrimary }]}
              >
                <Text style={[styles.downloadButtonText, { fontFamily: theme.fonts.bodyMedium }]}>
                  Download PDF
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleDownload('docx')}
                style={[styles.downloadButtonOutline, { borderColor: theme.colors.brandPrimary }]}
              >
                <Text style={[styles.downloadOutlineText, { color: theme.colors.brandPrimary, fontFamily: theme.fonts.bodyMedium }]}>
                  Download DOCX
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  closeText: {
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: 28,
  },
  crisisBadge: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disclaimer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.8,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  signalGrid: {
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  observation: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.85,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  listText: {
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  downloadBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  downloadButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  downloadButtonOutline: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  downloadOutlineText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
