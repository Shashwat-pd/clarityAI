import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

interface CrisisBannerProps {
  visible: boolean;
}

export const CrisisBanner: React.FC<CrisisBannerProps> = ({ visible }) => {
  if (!visible) return null;

  const handleSupportPress = () => {
    // International crisis support resources
    const url = 'https://findahelpline.com';
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        It sounds like things are really difficult right now. Please speak to a trusted adult or contact a support line.
      </Text>
      <TouchableOpacity onPress={handleSupportPress} style={styles.linkButton}>
        <Text style={styles.linkText}>Find Support Resources</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    padding: 16,
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 8,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
