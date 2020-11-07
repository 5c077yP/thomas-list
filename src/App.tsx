import React from 'react';
import {
  /* eslint react-native/no-inline-styles: "off" */
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Pressable,
  Button,
  TextInput,
  ScrollView,
  ViewStyle,
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
import Fuse from 'fuse.js';

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
        component={AddContactScreen}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}

/******************************
 *
 * ====  Center Container  ====
 *
 ******************************/

interface CenterContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const centerContainerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});

function CenterContainer({ children, style }: CenterContainerProps) {
  return (
    <View style={{ ...centerContainerStyles.container, ...style }}>
      {children}
    </View>
  );
}

/******************************
 *
 * ====       Title        ====
 *
 ******************************/

const titleStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  text: {
    fontSize: 32,
    marginBottom: 15,
  },
});

function Title({ text = '' }) {
  return <Text style={titleStyles.text}>{text}</Text>;
}

/******************************
 *
 * ====   Safe Container   ====
 *
 ******************************/

const safeContainerStyles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
});

function SafeContainer({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={safeContainerStyles.container}>
      {children}
    </SafeAreaView>
  );
}

/******************************
 *
 * ====  Add Contact Form  ====
 *
 ******************************/

interface AddContactFormProps {
  contact: Contact;
  onSave: (result: { contact: Contact; note: string }) => void;
  onCancel: () => void;
}

const addContactFormStyles = StyleSheet.create({
  textInput: {
    borderBottomWidth: 1,
    paddingBottom: 5,
    borderColor: '#ACACAC',
    marginTop: 5,
    marginBottom: 2,
  },
  actionsContainer: {
    flexDirection: 'row-reverse',
  },
});

function AddContactForm({ contact, onSave, onCancel }: AddContactFormProps) {
  const [note, setNote] = React.useState<string | undefined>();
  const handleSave = React.useCallback(() => {
    onSave({ contact, note: note ?? '' });
  }, [contact, note, onSave]);

  return (
    <View key={contact.id}>
      <Text>{contact.name}</Text>
      <TextInput
        style={addContactFormStyles.textInput}
        onChangeText={(text) => setNote(text)}
        multiline
        placeholder="gib hier deine Notiz ein"
        value={note}
      />
      <View style={addContactFormStyles.actionsContainer}>
        <Button title="Abbrechen" onPress={onCancel} />
        <Button title="Speichern" onPress={handleSave} />
      </View>
    </View>
  );
}

/******************************
 *
 * ====    Home Screen     ====
 *
 ******************************/

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
  const [showAddContactForm, setShowAddContactForm] = React.useState<boolean>(
    false,
  );

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
    if (selectedContact) {
      setShowAddContactForm(true);
    }
  }, [selectedContact]);

  const cancelEdit = React.useCallback(() => {
    setShowAddContactForm(false);
  }, []);

  const saveEdit = React.useCallback(({ contact, note }) => {
    setContacts((prev) => {
      return [{ id: nanoid(6), contact, note }, ...prev];
    });
    setShowAddContactForm(false);
  }, []);

  const deleteContactNote = React.useCallback((id) => {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) {
        return prev;
      }

      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  }, []);

  return (
    <SafeContainer>
      <CenterContainer>
        <Title text="Notizen" />
      </CenterContainer>

      {showAddContactForm && (
        <AddContactForm
          contact={selectedContact as Contact}
          onCancel={cancelEdit}
          onSave={saveEdit}
        />
      )}

      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
        {contacts.map(({ id, contact, note }) => (
          <View key={id} style={{ flexDirection: 'row', marginTop: 15 }}>
            <View style={{ flex: 1 }}>
              <Text>{contact.name}</Text>
              <Text
                style={{
                  borderBottomWidth: 1,
                  paddingBottom: 5,
                  borderColor: '#ACACAC',
                  marginTop: 5,
                }}
              >
                {note}
              </Text>
            </View>
            <Button
              title="löschen"
              onPress={() => deleteContactNote(id)}
              disabled={loading || saving}
            />
          </View>
        ))}
      </ScrollView>

      {!contacts.length && !showAddContactForm && (
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '300', color: '#495057' }}>
            Noch keine Notizen vorhanden
          </Text>
        </View>
      )}
      <CenterContainer>
        <Button
          title="Notiz hinzufügen"
          onPress={() => navigation.navigate('AddContact')}
        />
      </CenterContainer>
    </SafeContainer>
  );
}

/******************************
 *
 * ==== Contact List Item ====
 *
 ******************************/

interface ContactListItemProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
}

const contactListItemStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomColor: '#ddddde',
    borderBottomWidth: 1,
    padding: 20,
    marginHorizontal: 16,
  },
  text: {
    fontSize: 22,
  },
});

function ContactListItem({ contact, onSelect }: ContactListItemProps) {
  return (
    <View style={contactListItemStyles.container}>
      <Pressable onPress={() => onSelect(contact)}>
        <Text style={contactListItemStyles.text}>{contact.name}</Text>
      </Pressable>
    </View>
  );
}

/******************************
 *
 * ==== Add Contact Screen ====
 *
 ******************************/

type AddContactRouteProp = RouteProp<RootStackParamList, 'AddContact'>;
type AddContactNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AddContact'
>;

interface AddContactProps {
  route: AddContactRouteProp;
  navigation: AddContactNavigationProp;
}

function AddContactScreen({ navigation }: AddContactProps) {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    (async () => {
      // load contacts on first render
      const phoneContacts = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.ID,
          Contacts.Fields.Name,
          Contacts.Fields.Image,
        ],
        sort: Contacts.SortTypes.UserDefault,
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

  const contactsToShow = React.useMemo(() => {
    const fuse = new Fuse(contacts, { keys: ['name'] });
    return searchTerm ? fuse.search(searchTerm).map((c) => c.item) : contacts;
  }, [contacts, searchTerm]);

  return (
    <SafeContainer>
      <View style={{ flexDirection: 'row-reverse' }}>
        <Button onPress={() => navigation.goBack()} title="Schließen" />
      </View>

      <CenterContainer>
        <Title text="Kontakt auswählen" />
      </CenterContainer>

      {/* Search Bar */}
      <View
        style={{
          marginBottom: 12,
          paddingHorizontal: 10,
          flexDirection: 'row',
        }}
      >
        <TextInput
          style={{
            paddingHorizontal: 8,
            paddingVertical: 6,
            fontSize: 22,
            borderColor: '#ddddde',
            borderRadius: 6,
            borderWidth: 1,
            backgroundColor: 'white',
            flex: 1,
          }}
          placeholder="Kontakt suchen"
          onChangeText={(text) => setSearchTerm(text)}
          value={searchTerm}
        />
        <Button title="Abbrechen" onPress={() => setSearchTerm('')} />
      </View>

      <FlatList
        data={contactsToShow}
        renderItem={({ item }) => (
          <ContactListItem contact={item} onSelect={selectContact} />
        )}
        keyExtractor={(item) => item.id}
      />
    </SafeContainer>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Routes />
    </NavigationContainer>
  );
}
