import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput, Title, useTheme } from 'react-native-paper';
import { api } from '../../../convex/_generated/api';

export default function AddSubject() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    semester: '',
    department: 'Computer Science',
    facultyEmail: '', // Using email to find faculty ID
    schedule: '',
  });

  const createSubject = useMutation(api.subjects.createSubject);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.subjectCode || !formData.subjectName || !formData.semester || !formData.facultyEmail) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Find faculty ID from email using the Convex HTTP client
      const { ConvexHttpClient } = require('convex/browser');
      const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || '';
      const httpClient = new ConvexHttpClient(convexUrl);

      const facultyUser = await httpClient.query(api.users.getUserByEmail, {
        email: formData.facultyEmail,
        role: 'faculty',
      });

      if (!facultyUser) {
        throw new Error('Faculty not found with this email');
      }

      // 2. Create subject
      await createSubject({
        subjectCode: formData.subjectCode,
        subjectName: formData.subjectName,
        semester: parseInt(formData.semester),
        department: formData.department,
        facultyId: facultyUser._id,
        schedule: formData.schedule || undefined,
      });

      Alert.alert('Success', 'Subject created successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={styles.title}>Add New Subject</Title>
      
      <TextInput
        label="Subject Code"
        value={formData.subjectCode}
        onChangeText={(text) => handleChange('subjectCode', text)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Subject Name"
        value={formData.subjectName}
        onChangeText={(text) => handleChange('subjectName', text)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Semester"
        value={formData.semester}
        onChangeText={(text) => handleChange('semester', text)}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Department"
        value={formData.department}
        onChangeText={(text) => handleChange('department', text)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Faculty Email"
        value={formData.facultyEmail}
        onChangeText={(text) => handleChange('facultyEmail', text)}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="Enter faculty email to assign"
        style={styles.input}
      />

      <TextInput
        label="Schedule"
        value={formData.schedule}
        onChangeText={(text) => handleChange('schedule', text)}
        mode="outlined"
        placeholder="e.g. Mon 10:00 AM"
        style={styles.input}
      />

      <Button 
        mode="contained" 
        onPress={handleSubmit} 
        loading={loading}
        style={styles.button}
      >
        Create Subject
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 10,
    marginBottom: 30,
  },
});
