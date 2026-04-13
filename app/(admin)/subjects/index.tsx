import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB, List, Searchbar, useTheme } from 'react-native-paper';
import { api } from '../../../convex/_generated/api';

export default function SubjectsList() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const subjects = useQuery(api.subjects.listAllSubjects) ?? [];

  const onChangeSearch = (query: string) => setSearchQuery(query);

  const filteredSubjects = subjects.filter(subject => 
    subject.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search subjects"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredSubjects}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <List.Item
            title={`${item.subjectCode} - ${item.subjectName}`}
            description={`Faculty: ${item.faculty?.users?.full_name || 'Unassigned'} | Sem: ${item.semester}`}
            left={props => <List.Icon {...props} icon="book" />}
            onPress={() => console.log('View subject', item._id)}
          />
        )}
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => router.push('/(admin)/subjects/add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
