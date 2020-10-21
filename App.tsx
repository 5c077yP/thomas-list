import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  SafeAreaView,
  Pressable,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';

interface Contact {
  id: string;
  name: string;
  image?: { uri: string };
}

type RootStackParamList = {
  Home: { selectedContact?: Contact };
  ContactList: { contacts: Contact[] };
};

const Stack = createStackNavigator<RootStackParamList>();

function Routes() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ContactList" component={ContactList} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
});

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  route: HomeScreenRouteProp;
  navigation: HomeScreenNavigationProp;
}

function HomeScreen({ route, navigation }: HomeScreenProps) {
  const { selectedContact } = route.params;

  const loadContacts = React.useCallback(async () => {
    const contacts = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.ID, Contacts.Fields.Name, Contacts.Fields.Image],
    });
    navigation.push('ContactList', { contacts: contacts.data as Contact[] });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {selectedContact && (
        <>
          <Text>has selected contact:</Text>
          <Text>{selectedContact.name}</Text>
        </>
      )}
      <Button onPress={loadContacts} title="Load Contacts" />
    </View>
  );
}

interface ContactProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
}

const Contact = ({ contact, onSelect }: ContactProps) => (
  <View style={styles.item}>
    <Pressable onPress={() => onSelect(contact)}>
      <Text style={styles.title}>{contact.name}</Text>
    </Pressable>
  </View>
);

type ContactListRouteProp = RouteProp<RootStackParamList, 'ContactList'>;
type ContactListNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ContactList'
>;

interface ContactListProps {
  route: ContactListRouteProp;
  navigation: ContactListNavigationProp;
}

function ContactList({ navigation, route }: ContactListProps) {
  const { contacts } = route.params;

  const selectContact = React.useCallback(
    (contact) => {
      navigation.navigate('Home', { selectedContact: contact });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text>Select a contact</Text>
      <FlatList
        data={contacts}
        renderItem={({ item }) => (
          <Contact contact={item} onSelect={selectContact} />
        )}
        keyExtractor={(item) => item.id}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Routes />
    </NavigationContainer>
  );
}
