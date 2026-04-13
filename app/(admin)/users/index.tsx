import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Chip, FAB, List, Searchbar, Text, useTheme } from 'react-native-paper';
import { api } from '../../../convex/_generated/api';

export default function UsersList() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, student, faculty

  const users = useQuery(api.users.listUsers, {
    role: filter === 'all' ? undefined : filter,
  }) ?? [];

  const onChangeSearch = (query: string) => setSearchQuery(query);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search users"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.filterContainer}>
        <Chip 
          selected={filter === 'all'} 
          onPress={() => setFilter('all')} 
          style={styles.chip}
        >
          All
        </Chip>
        <Chip 
          selected={filter === 'student'} 
          onPress={() => setFilter('student')} 
          style={styles.chip}
        >
          Students
        </Chip>
        <Chip 
          selected={filter === 'faculty'} 
          onPress={() => setFilter('faculty')} 
          style={styles.chip}
        >
          Faculty
        </Chip>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <List.Item
            title={item.fullName || 'No Name'}
            description={item.email}
            left={props => <List.Icon {...props} icon={item.role === 'student' ? 'school' : 'briefcase'} />}
            right={props => <Text {...props} style={{ alignSelf: 'center', color: theme.colors.secondary }}>{item.role}</Text>}
            onPress={() => console.log('View user', item._id)}
          />
        )}
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => router.push('/(admin)/users/add')}
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chip: {
    marginRight: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
