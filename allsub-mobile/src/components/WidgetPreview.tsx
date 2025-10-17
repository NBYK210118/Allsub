import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';

const WidgetPreview: React.FC = () => {
  const { isCaptionEnabled, captionText } = useAppStore();

  if (!isCaptionEnabled) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.widget}>
        <Text style={styles.widgetTitle}>Caption</Text>
        <Text style={styles.widgetText}>{captionText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  widget: {
    backgroundColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  widgetText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default WidgetPreview;
