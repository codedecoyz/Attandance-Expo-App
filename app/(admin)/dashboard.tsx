import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Paragraph, Title, useTheme } from 'react-native-paper';
import { api } from '../../convex/_generated/api';

export default function AdminDashboard() {
  const theme = useTheme();
  const router = useRouter();

  const usersCount = useQuery(api.users.countUsers) ?? 0;
  const studentsCount = useQuery(api.users.countStudents) ?? 0;
  const facultyCount = useQuery(api.users.countFaculty) ?? 0;
  const subjectsCount = useQuery(api.users.countSubjects) ?? 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Admin Dashboard</Title>
        <Paragraph>Welcome back, Admin</Paragraph>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Ionicons name="people" size={24} color={theme.colors.primary} />
            <Title>{usersCount}</Title>
            <Paragraph>Total Users</Paragraph>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Ionicons name="school" size={24} color={theme.colors.secondary} />
            <Title>{studentsCount}</Title>
            <Paragraph>Students</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Ionicons name="briefcase" size={24} color={theme.colors.error} />
            <Title>{facultyCount}</Title>
            <Paragraph>Faculty</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Ionicons name="book" size={24} color={theme.colors.tertiary} />
            <Title>{subjectsCount}</Title>
            <Paragraph>Subjects</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actionsContainer}>
        <Title style={styles.sectionTitle}>Quick Actions</Title>
        <Button 
          mode="contained" 
          onPress={() => router.push('/(admin)/users/add')}
          style={styles.button}
          icon="account-plus"
        >
          Add New User
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => router.push('/(admin)/subjects')}
          style={styles.button}
          icon="book-plus"
        >
          Manage Subjects
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    marginBottom: 10,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    marginBottom: 10,
  },
});
