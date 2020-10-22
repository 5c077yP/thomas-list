import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Pressable,
  Button,
  TextInput,
  ScrollView,
} from 'react-native';
import 'react-native-get-random-values';
import * as Contacts from 'expo-contacts';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import AsyncStorage from '@react-native-community/async-storage';
import { nanoid } from 'nanoid';

interface Contact {
  id: string;
  name: string;
  image?: { uri: string };
}

type RootStackParamList = {
  Home: { selectedContact?: Contact };
  AddContact: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();

function Routes() {
  return (
    <RootStack.Navigator mode="modal">
      <RootStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AddContact"
        component={AddContact}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  homeContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
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

interface ContactWithNote {
  id: string;
  contact: Contact;
  note: string;
}

async function loadContacts(): Promise<ContactWithNote[]> {
  const value = await AsyncStorage.getItem('contacts');
  return value ? JSON.parse(value) : [];
}

async function saveContacts(contacts: ContactWithNote[]): Promise<void> {
  const value = JSON.stringify(contacts);
  await AsyncStorage.setItem('contacts', value);
}

function HomeScreen({ route, navigation }: HomeScreenProps) {
  const { selectedContact } = route.params ?? {};

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [contacts, setContacts] = React.useState<ContactWithNote[]>([]);
  const [contact, setContact] = React.useState<Contact | undefined>();
  const [note, setNote] = React.useState<string | undefined>();

  // load contacts from storage to memory
  React.useEffect(() => {
    setLoading(true);
    loadContacts()
      .then((loadedContacts) => {
        setContacts(loadedContacts);
      })
      .catch((err) => {
        console.error('>> failed to load contacts');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // save contacts to storage from memory, for every change to contacts
  React.useEffect(() => {
    setSaving(true);
    saveContacts(contacts)
      .catch((err) => {
        console.error('>> failed to save contacts');
        console.error(err);
      })
      .finally(() => {
        setSaving(false);
      });
  }, [contacts]);

  React.useEffect(() => {
    setContact(selectedContact);
  }, [selectedContact]);

  const cancelEdit = React.useCallback(() => {
    setContact(undefined);
    setNote(undefined);
  }, []);

  const saveEdit = React.useCallback(() => {
    if (!contact) {
      return;
    }

    setContacts((prev) => {
      return [{ id: nanoid(6), contact, note: note || '' }, ...prev];
    });
    setContact(undefined);
    setNote(undefined);
  }, [setContacts, contact, note]);

  return (
    <SafeAreaView style={styles.homeContainer}>
      <View style={{ alignItems: 'center', marginBottom: 15 }}>
        <Text style={{ fontSize: 32 }}>Notizen</Text>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled">
        {contact && (
          <View key={contact.id}>
            <Text>{contact.name}</Text>
            <TextInput
              style={{
                borderBottomWidth: 1,
                paddingBottom: 5,
                borderColor: '#ACACAC',
                marginTop: 5,
                marginBottom: 2,
              }}
              onChangeText={(text) => setNote(text)}
              multiline
              placeholder="gib hier deine Notiz ein"
              value={note}
            />
            <View style={{ flex: 1, flexDirection: 'row-reverse' }}>
              <Button title="Abbrechen" onPress={cancelEdit} />
              <Button title="Speichern" onPress={saveEdit} />
            </View>
          </View>
        )}
        {contacts.map(({ id, contact, note }) => (
          <View key={id}>
            <Text>{contact.name}</Text>
            <Text
              style={{
                borderBottomWidth: 1,
                paddingBottom: 5,
                borderColor: '#ACACAC',
                marginTop: 5,
                marginBottom: 5,
              }}
            >
              {note}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ height: 50, alignItems: 'center' }}>
        <Button
          title="Notiz hinzufügen"
          onPress={() => navigation.navigate('AddContact')}
        />
      </View>
    </SafeAreaView>
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

type AddContactRouteProp = RouteProp<RootStackParamList, 'AddContact'>;
type AddContactNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AddContact'
>;

interface AddContactProps {
  route: AddContactRouteProp;
  navigation: AddContactNavigationProp;
}

function AddContact({ navigation }: AddContactProps) {
  const [contacts, setContacts] = React.useState<Contact[]>([]);

  React.useEffect(() => {
    (async () => {
      // load contacts on first render
      const phoneContacts = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.ID,
          Contacts.Fields.Name,
          Contacts.Fields.Image,
        ],
      });

      setContacts(phoneContacts.data as Contact[]);
    })();
  }, []);

  const selectContact = React.useCallback(
    (contact) => {
      navigation.navigate('Home', { selectedContact: contact });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Button onPress={() => navigation.goBack()} title="Dismiss" />

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
