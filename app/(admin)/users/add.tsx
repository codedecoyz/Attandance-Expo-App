import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, SegmentedButtons, TextInput, Title, useTheme } from 'react-native-paper';
import { api } from '../../../convex/_generated/api';

export default function AddUser() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    password: 'password123', // Default for ease
    fullName: '',
    // Student specific
    rollNumber: '',
    department: 'Computer Science',
    semester: '1',
    // Faculty specific
    employeeId: '',
  });

  const createUser = useMutation(api.users.createUser);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.fullName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createUser({
        email: formData.email,
        fullName: formData.fullName,
        role: role as 'student' | 'faculty' | 'admin',
        rollNumber: role === 'student' ? formData.rollNumber : undefined,
        semester: role === 'student' ? parseInt(formData.semester) : undefined,
        department: (role === 'student' || role === 'faculty') ? formData.department : undefined,
        employeeId: role === 'faculty' ? formData.employeeId : undefined,
      });

      Alert.alert('Success', 'User created successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={styles.title}>Add New User</Title>
      
      <SegmentedButtons
        value={role}
        onValueChange={setRole}
        buttons={[
          { value: 'student', label: 'Student' },
          { value: 'faculty', label: 'Faculty' },
          { value: 'admin', label: 'Admin' },
        ]}
        style={styles.segmentedButton}
      />

      <TextInput
        label="Email"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        label="Password"
        value={formData.password}
        onChangeText={(text) => handleChange('password', text)}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        label="Full Name"
        value={formData.fullName}
        onChangeText={(text) => handleChange('fullName', text)}
        mode="outlined"
        style={styles.input}
      />

      {role === 'student' && (
        <>
          <TextInput
            label="Roll Number"
            value={formData.rollNumber}
            onChangeText={(text) => handleChange('rollNumber', text)}
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
        </>
      )}

      {role === 'faculty' && (
        <TextInput
          label="Employee ID"
          value={formData.employeeId}
          onChangeText={(text) => handleChange('employeeId', text)}
          mode="outlined"
          style={styles.input}
        />
      )}
      
      {(role === 'student' || role === 'faculty') && (
        <TextInput
          label="Department"
          value={formData.department}
          onChangeText={(text) => handleChange('department', text)}
          mode="outlined"
          style={styles.input}
        />
      )}

      <Button 
        mode="contained" 
        onPress={handleSubmit} 
        loading={loading}
        style={styles.button}
      >
        Create User
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
  segmentedButton: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 10,
    marginBottom: 30,
  },
});
